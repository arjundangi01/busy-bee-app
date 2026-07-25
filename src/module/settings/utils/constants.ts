import { IBlocklistAppPayload } from "@/module/settings/hooks/useBlocklist";

// Auto-added to a fresh blocklist once, only if installed — see
// BlockedAppsTemplate. Matches the backend's known default set.
export const BLOCKLIST_DEFAULT_APPS: IBlocklistAppPayload[] = [
  { packageName: "com.instagram.android", appName: "Instagram" },
  { packageName: "com.google.android.youtube", appName: "YouTube" },
  { packageName: "com.twitter.android", appName: "X" },
];
