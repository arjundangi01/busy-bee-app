import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type AppUsageRecord = {
  packageName: string;
  appName: string;
  foregroundSeconds: number;
};

export type DeviceActivityRecord = {
  pickupCount: number;
  firstPickupAtMillis: number | null;
  lastPickupAtMillis: number | null;
  offlineSeconds: number;
};

type UsageStatsNativeModule = {
  isUsageAccessGranted: () => Promise<boolean>;
  openUsageAccessSettings: () => Promise<void>;
  getDailyAppUsage: () => Promise<AppUsageRecord[]>;
  getDailyDeviceActivity: () => Promise<DeviceActivityRecord>;
};

const NativeModule = requireOptionalNativeModule<UsageStatsNativeModule>("UsageStats");

// Android only (design-artifacts/evolution/specs/
// 11-insights-screen-time-and-device-activity.md — same Apple entitlement
// wall already documented for blocking enforcement rules this out on iOS).
// On iOS, or on Android running in Expo Go rather than a dev-client build
// that actually contains this native module, every call below degrades to a
// safe default rather than throwing — callers render the same "not
// available on this platform" state either way, no separate error path.
const isAvailable = Platform.OS === "android" && NativeModule != null;

export async function isUsageAccessGranted(): Promise<boolean> {
  if (!isAvailable) return false;
  return NativeModule!.isUsageAccessGranted();
}

export async function openUsageAccessSettings(): Promise<void> {
  if (!isAvailable) return;
  await NativeModule!.openUsageAccessSettings();
}

export async function getDailyAppUsage(): Promise<AppUsageRecord[]> {
  if (!isAvailable) return [];
  return NativeModule!.getDailyAppUsage();
}

export async function getDailyDeviceActivity(): Promise<DeviceActivityRecord> {
  if (!isAvailable) {
    return { pickupCount: 0, firstPickupAtMillis: null, lastPickupAtMillis: null, offlineSeconds: 0 };
  }
  return NativeModule!.getDailyDeviceActivity();
}
