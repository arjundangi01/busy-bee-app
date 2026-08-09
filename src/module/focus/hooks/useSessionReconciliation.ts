import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { fetchActiveFocusSession } from "@/module/focus/hooks/useFocusSession";
import { useBlocklist } from "@/module/settings/hooks/useBlocklist";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

// Keeps native on-device blocking state converged with the backend's own
// idea of "is there an active session" — independent of whether the user is
// currently on the Focus Session screen at all (that screen has its own,
// more detailed push effect; this is the global backstop). Closes two drift
// directions (see docs/session-lifecycle-reliability-fixes.md item 4): the
// backend session started but the native push never landed (app killed
// mid-launch), and native still enforcing a session the backend has already
// ended (second line of defense on top of the account-switch fix in
// auth-store's signOut). Runs on mount and every foreground return.
//
// currentStepText is intentionally blank here — cosmetic (notification/
// interstitial display text only, not enforcement), and gets filled in for
// real the moment the user actually opens the Focus Session screen, which
// pushes its own update. Reconciliation's job is only "is blocking on/off
// and against the right packages," not the display detail.
export function useSessionReconciliation(enabled: boolean) {
  const { blockedApps } = useBlocklist();
  const blockedPackageNames = blockedApps.map((app) => app.packageName);

  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;

    const reconcile = async () => {
      try {
        const active = await fetchActiveFocusSession();
        if (active) {
          await BlockingEnforcement.setActiveSession(
            active.id,
            active.missionId,
            blockedPackageNames,
            "",
            new Date(active.expiredAt).getTime(),
          );
        } else {
          await BlockingEnforcement.clearActiveSession();
        }
      } catch {
        // Best-effort — the next foreground return retries. Must never
        // throw into the app-wide listener below.
      }
    };

    reconcile();
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") reconcile();
    });
    return () => subscription.remove();
    // blockedPackageNames intentionally joined, not passed by reference —
    // same reasoning as useBlockingEnforcement's own push effect: a new
    // array identity every render shouldn't re-subscribe this listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, blockedPackageNames.join(",")]);
}
