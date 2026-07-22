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
} as const;
