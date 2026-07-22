// 4.1 Paywall/Upgrade entry points. SESSION_CAP and ANALYTICS are the two
// from the spec (1.2 Start Mission Flow, 2.2 Progress/Analytics); SESSION_TIME_LIMIT
// is a 3rd real trigger this delivery adds (the 1-hour Free session duration
// cap, WP9) — reuses this same page rather than building a separate screen.
export enum PAYWALL_ENTRY {
  SESSION_CAP = "sessionCap",
  ANALYTICS = "analytics",
  SESSION_TIME_LIMIT = "sessionTimeLimit",
}
