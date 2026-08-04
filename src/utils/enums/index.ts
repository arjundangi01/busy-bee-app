export enum MISSION_STATUS {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

export enum TASK_STATUS {
  PENDING = "PENDING",
  DONE = "DONE",
}

export enum SESSION_END_REASON {
  MISSION_COMPLETED = "MISSION_COMPLETED",
  EARLY_EXIT = "EARLY_EXIT",
  TIME_LIMIT_REACHED = "TIME_LIMIT_REACHED",
}

// design-artifacts/evolution/specs/12-post-session-history-and-roughness.md —
// how a session went, computed server-side. Used by both the dashboard's
// today's-sessions list and the History screen, so it's shared here rather
// than duplicated per module.
export enum SESSION_ROUGHNESS {
  CLEAN = "clean",
  MIXED = "mixed",
  ROUGH = "rough",
}

// design-artifacts/evolution/specs/14-session-timeline.md -- how this
// session's first blocked attempt compares to the user's own rolling
// 8-week baseline, computed server-side. "clean" (no blocks) and "building"
// (baseline doesn't have enough data yet) both carry no comparison claim.
export enum SESSION_DISTRACTION_TIMING_TIER {
  CLEAN = "clean",
  BUILDING = "building",
  EARLIER = "earlier",
  TYPICAL = "typical",
  LATER = "later",
  HELD_LONG = "heldLong",
}

export enum SUBSCRIPTION_STATUS {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  BILLING_ISSUE = "BILLING_ISSUE",
}
