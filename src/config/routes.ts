export const routes = {
  onboarding: {
    welcome: () => "/onboarding",
  },
  auth: {
    signUp: () => "/sign-up",
    signIn: () => "/sign-in",
  },
  tabs: {
    home: () => "/home",
    progress: () => "/progress",
    settings: () => "/settings",
  },
  mission: (id: string) => `/mission/${id}`,
} as const;
