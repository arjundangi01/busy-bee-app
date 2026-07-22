// Mirrors the backend's FREE_TIER_DAILY_SESSION_CAP / FREE_TIER_SESSION_DURATION_CAP_SECONDS
// (lib/utils/constants/entitlement.ts) — display-only here, the backend is
// the source of truth for actual enforcement.
export const FREE_TIER_DAILY_SESSION_CAP = 2;
export const FREE_TIER_SESSION_DURATION_HOURS = 1;

// Shown only until a real RevenueCat offering loads (see getProPackage) —
// the real price always wins once available.
export const FALLBACK_PRO_PRICE_LABEL = "$10.00/month · billed monthly · cancel anytime";
