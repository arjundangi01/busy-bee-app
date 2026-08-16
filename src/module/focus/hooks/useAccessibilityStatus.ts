import { useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

// Mirrors useUsageAccessStatus's reasoning exactly — the accessibility-service
// grant is another special app-op the user can flip in system Settings at any
// time, so it's never stored server-side and is checked live, re-checked on
// every foreground return rather than just on mount.
export function useAccessibilityStatus(): boolean | null {
  const [isGranted, setIsGranted] = useState<boolean | null>(Platform.OS === "android" ? null : false);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const checkStatus = () => {
      BlockingEnforcement.isAccessibilityServiceEnabled().then(setIsGranted);
    };

    checkStatus();
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") checkStatus();
    });
    return () => subscription.remove();
  }, []);

  return isGranted;
}
