// 4.1 Paywall/Upgrade entry points. SESSION_CAP and ANALYTICS are the two
// from the spec (1.2 Start Mission Flow, 2.2 Progress/Analytics); SESSION_TIME_LIMIT
// and SETTINGS are 2 more real triggers added later (the 1-hour Free session
// duration cap, and 5.1 Settings/Account's "Upgrade ›" link) — both reuse
// this same page rather than building a separate screen.
export enum PAYWALL_ENTRY {
  SESSION_CAP = "sessionCap",
  ANALYTICS = "analytics",
  SESSION_TIME_LIMIT = "sessionTimeLimit",
  SETTINGS = "settings",
}
