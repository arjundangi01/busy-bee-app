import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";
import { loginToPurchases, logoutOfPurchases } from "@/lib/purchases";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/utils/session";
import { IApiResponse, IAuthResult, IUser } from "@/types";

type AuthStoreValue = {
  isBootstrapping: boolean;
  user: IUser | null;
  setSession: (result: IAuthResult) => Promise<void>;
  updateUser: (user: IUser) => void;
  signOut: () => Promise<void>;
};

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const token = await getStoredToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await apiClient.get<IApiResponse<IAuthResult>>("/auth/me");
        const result = response.data.data;
        if (result) {
          setUser(result.user);
          await loginToPurchases(result.user.id);
        }
      } catch {
        await clearStoredToken();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const setSession = async (result: IAuthResult): Promise<void> => {
    await setStoredToken(result.token);
    setUser(result.user);
    await loginToPurchases(result.user.id);
  };

  const signOut = async (): Promise<void> => {
    await clearStoredToken();
    setUser(null);
    await logoutOfPurchases();
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
