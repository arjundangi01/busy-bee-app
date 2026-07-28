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
  // Bee's Hive — tapping a Pro-locked work type. See design-artifacts/
  // evolution/specs/07-paywall-worktype-gating.md. Deliberately still no
  // companion visuals anywhere on this page — only this entry's headline
  // copy and the new comparison row reference work types at all.
  HIVE_WORK_TYPE = "hiveWorkType",
  // Bee's Hive — tapping a Pro-locked appearance skin. Same reasoning as
  // HIVE_WORK_TYPE: appearance variety is a genuine Pro perk, the companion
  // itself is still never used as a sales visual.
  HIVE_SKIN = "hiveSkin",
  // Bee's Hive — tapping a Pro-locked environment theme. Same reasoning as
  // HIVE_WORK_TYPE/HIVE_SKIN: environment variety is a genuine Pro perk.
  HIVE_THEME = "hiveTheme",
  // Mission task editing — tapping "Add Task" on a Free-tier mission that's
  // already at its task-count or time-budget cap. Rides alongside a
  // `reason: "count" | "time"` param (like `missionId` already does for
  // SESSION_CAP) so the copy can say which limit was actually hit.
  MISSION_TASK_LIMIT = "missionTaskLimit",
}
