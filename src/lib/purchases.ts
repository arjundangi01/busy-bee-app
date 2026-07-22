import { Platform } from "react-native";
import Purchases from "react-native-purchases";

let isConfigured = false;

// DD-003: no real RevenueCat account/products exist yet — configure() is a
// deliberate no-op (with a console warning) until real API keys are set,
// rather than crashing the app on every boot.
export const initPurchases = (): void => {
  const apiKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn("RevenueCat API key not set — Purchases.configure() skipped, paywall purchases are disabled.");
    return;
  }

  Purchases.configure({ apiKey });
  isConfigured = true;
};

// Keeps RevenueCat's app_user_id equal to our own User.id so the backend
// webhook (lib/routes/webhooks) can map purchase events back to a real user.
export const loginToPurchases = async (userId: string): Promise<void> => {
  if (!isConfigured) return;
  await Purchases.logIn(userId);
};

export const logoutOfPurchases = async (): Promise<void> => {
  if (!isConfigured) return;
  await Purchases.logOut();
};
