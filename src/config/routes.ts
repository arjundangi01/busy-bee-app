export const routes = {
  onboarding: {
    welcome: (): "/onboarding" => "/onboarding",
  },
  auth: {
    signUp: (): "/sign-up" => "/sign-up",
    signIn: (): "/sign-in" => "/sign-in",
  },
  tabs: {
    home: (): "/home" => "/home",
    progress: (): "/progress" => "/progress",
    settings: (): "/settings" => "/settings",
  },
  settingsAccount: (): "/settings/account" => "/settings/account",
  settingsMembership: (): "/settings/membership" => "/settings/membership",
  settingsPermissions: (): "/settings/permissions" => "/settings/permissions",
  settingsBlockedApps: (): "/settings/blocked-apps" => "/settings/blocked-apps",
  beesHive: (): "/bees-hive" => "/bees-hive",
  permissionPriming: (): "/permission-priming" => "/permission-priming",
  settingsHelpCenter: (): "/settings/help-center" => "/settings/help-center",
  eveningReview: (): "/evening-review" => "/evening-review",
  history: (): "/history" => "/history",
  sessionTimeline: (sessionId: string) => `/session/${sessionId}/timeline` as const,
  paywall: (): "/paywall" => "/paywall",
  startMission: (): "/mission/new" => "/mission/new",
  mission: (id: string) => `/mission/${id}` as const,
  focusSession: (id: string) => `/mission/${id}/focus` as const,
  sessionComplete: (id: string) => `/mission/${id}/complete` as const,
} as const;
