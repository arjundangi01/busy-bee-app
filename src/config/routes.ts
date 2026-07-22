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
  startMission: (): "/mission/new" => "/mission/new",
  mission: (id: string) => `/mission/${id}` as const,
  focusSession: (id: string) => `/mission/${id}/focus` as const,
} as const;
