import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type OnboardingPermissions = {
  backgroundExecutionGranted: boolean | null;
  notificationsGranted: boolean | null;
};

type OnboardingPermissionsContextValue = {
  permissions: OnboardingPermissions;
  setBackgroundExecutionGranted: (granted: boolean) => void;
  setNotificationsGranted: (granted: boolean) => void;
};

const INITIAL_PERMISSIONS: OnboardingPermissions = {
  backgroundExecutionGranted: null,
  notificationsGranted: null,
};

const OnboardingPermissionsContext = createContext<OnboardingPermissionsContextValue | null>(null);

export function OnboardingPermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<OnboardingPermissions>(INITIAL_PERMISSIONS);

  const value = useMemo<OnboardingPermissionsContextValue>(
    () => ({
      permissions,
      setBackgroundExecutionGranted: (granted) =>
        setPermissions((prev) => ({ ...prev, backgroundExecutionGranted: granted })),
      setNotificationsGranted: (granted) =>
        setPermissions((prev) => ({ ...prev, notificationsGranted: granted })),
    }),
    [permissions],
  );

  return (
    <OnboardingPermissionsContext.Provider value={value}>{children}</OnboardingPermissionsContext.Provider>
  );
}

export function useOnboardingPermissions(): OnboardingPermissionsContextValue {
  const context = useContext(OnboardingPermissionsContext);
  if (!context) {
    throw new Error("useOnboardingPermissions must be used within an OnboardingPermissionsProvider");
  }
  return context;
}
