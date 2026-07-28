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

export enum SUBSCRIPTION_STATUS {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  BILLING_ISSUE = "BILLING_ISSUE",
}
