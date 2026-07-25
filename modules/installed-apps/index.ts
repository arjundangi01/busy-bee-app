import { requireOptionalNativeModule } from "expo-modules-core";

export type InstalledApp = {
  packageName: string;
  appName: string;
};

type InstalledAppsNativeModule = {
  getInstalledApps: () => Promise<InstalledApp[]>;
};

const InstalledAppsModule = requireOptionalNativeModule<InstalledAppsNativeModule>("InstalledApps");

// Android only (see spec) — on iOS, or when running in Expo Go rather than a
// dev-client build that actually contains this native module, the module
// simply isn't linked. Throw a clear error rather than crashing so callers
// (the blocklist hook) can show an honest empty/error state instead.
export async function getInstalledApps(): Promise<InstalledApp[]> {
  if (!InstalledAppsModule) {
    throw new Error(
      "InstalledApps native module is unavailable — requires a dev-client build (not Expo Go) on Android.",
    );
  }

  return InstalledAppsModule.getInstalledApps();
}
