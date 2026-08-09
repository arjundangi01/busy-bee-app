import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import axios from "axios";
import { apiClient } from "@/lib/api";
import { loginToPurchases, logoutOfPurchases } from "@/lib/purchases";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/utils/session";
import { routes } from "@/config/routes";
import { IApiResponse, IAuthResult, IUser } from "@/types";
import { endFocusSession, fetchActiveFocusSession } from "@/module/focus/hooks/useFocusSession";
import { SESSION_END_REASON } from "@/utils/enums";
import * as BlockingEnforcement from "../../modules/blocking-enforcement";

type AuthStoreValue = {
  isBootstrapping: boolean;
  user: IUser | null;
  setSession: (result: IAuthResult) => Promise<void>;
  // Accepts a functional updater (like setState) so a caller can merge onto
  // the *current* user rather than a possibly-stale snapshot it captured
  // earlier (e.g. from a closure that outlived an in-flight request).
  updateUser: (user: IUser | ((current: IUser | null) => IUser | null)) => void;
  signOut: () => Promise<void>;
};

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);
  // Bumped by setSession/signOut — any authoritative state change. The
  // bootstrap effect below captures the value at the moment it starts and
  // checks it again before applying its result, so a slow bootstrap check
  // that resolves *after* a newer login/logout has already happened
  // discards its stale result instead of overwriting the newer state (e.g.
  // bootstrap for A still in flight, user logs in as B, A's check finally
  // resolves and would otherwise silently flip the UI back to A while
  // storage already holds B's token). See
  // docs/session-lifecycle-reliability-fixes.md's bootstrap race note.
  const sessionGenerationRef = useRef(0);

  useEffect(() => {
    const bootstrapGeneration = sessionGenerationRef.current;

    const bootstrap = async (): Promise<void> => {
      const token = await getStoredToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await apiClient.get<IApiResponse<IAuthResult>>("/auth/me");
        const result = response.data.data;
        if (result && sessionGenerationRef.current === bootstrapGeneration) {
          setUser(result.user);
          await loginToPurchases(result.user.id);
        }
      } catch (error) {
        // Only a genuine 401/403 means the token is actually invalid —
        // wiping it on a network error or a 5xx (backend outage) would log
        // the user out because of an infrastructure problem that isn't
        // theirs, and can strand someone with an active focus session
        // unable to authenticate at all while native blocking (which
        // doesn't depend on the backend) keeps enforcing regardless. See
        // docs/session-lifecycle-reliability-fixes.md item 5.
        const isUnauthorized =
          axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
        if (isUnauthorized && sessionGenerationRef.current === bootstrapGeneration) {
          await clearStoredToken();
          // This path bypasses signOut() entirely (there's no user session
          // to sign out of yet), so it needs its own native clear — same
          // account-switch-leak concern as signOut() above.
          await BlockingEnforcement.clearActiveSession();
        }
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const setSession = async (result: IAuthResult): Promise<void> => {
    sessionGenerationRef.current += 1;
    await setStoredToken(result.token);
    setUser(result.user);
    await loginToPurchases(result.user.id);
    // Defensive: BlockingPrefs is device-scoped, not account-scoped (see
    // docs/session-lifecycle-reliability-fixes.md item 3). A fresh login
    // should never inherit whatever session/blocklist a previous account
    // on this device left active, even if some other cleanup path missed
    // it. Harmless no-op when there's nothing to clear.
    await BlockingEnforcement.clearActiveSession();
  };

  const signOut = async (): Promise<void> => {
    sessionGenerationRef.current += 1;

    // Best-effort: end any session still active on the backend while the
    // token is still valid to make the call. Not required for correctness
    // — the expiredAt/cron backstop reconciles a dangling session either
    // way — just avoids leaving it open until the next sweep.
    try {
      const active = await fetchActiveFocusSession();
      if (active) {
        await endFocusSession(active.id, SESSION_END_REASON.EARLY_EXIT);
      }
    } catch {
      // Best-effort — see docs/session-lifecycle-reliability-fixes.md item 3.
    }

    // Always clears native blocking regardless of the above — this is the
    // actual fix for the account-switch leak: without it, a different
    // account signing in on this device inherits whatever the previous
    // account's session was still enforcing.
    await BlockingEnforcement.clearActiveSession();

    await clearStoredToken();
    setUser(null);
    await logoutOfPurchases();
    router.replace(routes.auth.signIn());
  };

  const value = useMemo<AuthStoreValue>(
    () => ({ isBootstrapping, user, setSession, updateUser: setUser, signOut }),
    [isBootstrapping, user],
  );

  return <AuthStoreContext.Provider value={value}>{children}</AuthStoreContext.Provider>;
}

export function useAuthStore(): AuthStoreValue {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }
  return context;
}
