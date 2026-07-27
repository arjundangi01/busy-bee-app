import { useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as UsageStats from "../../../../modules/usage-stats";

// Never stored server-side, same reasoning as PermissionsSection's
// accessibility-service check — this is a special app-op the user can flip
// in system Settings at any time, so it's checked live and re-checked on
// every foreground return, not just on mount.
export function useUsageAccessStatus(): boolean | null {
  // Resolved synchronously in the initializer, not via a same-render effect
  // setState — iOS never has a real value to wait for, so there's no
  // "loading" state to represent for it.
  const [isGranted, setIsGranted] = useState<boolean | null>(Platform.OS === "android" ? null : false);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const checkStatus = () => {
      UsageStats.isUsageAccessGranted().then(setIsGranted);
    };

    checkStatus();
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") checkStatus();
    });
    return () => subscription.remove();
  }, []);

  return isGranted;
}
