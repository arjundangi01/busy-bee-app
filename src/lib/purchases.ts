import { Platform } from "react-native";
import Purchases, { CustomerInfo, PurchasesPackage } from "react-native-purchases";

let isConfigured = false;

export const isPurchasesConfigured = (): boolean => isConfigured;

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

// Null both when the SDK isn't configured yet and when it's configured but no
// real offering/product has been set up in the RevenueCat dashboard yet —
// callers fall back to a placeholder price in either case.
export const getProPackage = async (): Promise<PurchasesPackage | null> => {
  if (!isConfigured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages[0] ?? null;
  } catch {
    return null;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
};
