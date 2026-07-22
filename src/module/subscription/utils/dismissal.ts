import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYWALL_DISMISSED_DATE_KEY = "busy-bee/paywall-dismissed-date";

const todayKey = (): string => new Date().toISOString().slice(0, 10);

// Spec Open Question #3, resolved: dismissing suppresses the session-cap
// paywall for the rest of that day rather than re-showing on every attempt.
export const wasPaywallDismissedToday = async (): Promise<boolean> => {
  const stored = await AsyncStorage.getItem(PAYWALL_DISMISSED_DATE_KEY);
  return stored === todayKey();
};

export const markPaywallDismissedToday = async (): Promise<void> => {
  await AsyncStorage.setItem(PAYWALL_DISMISSED_DATE_KEY, todayKey());
};
