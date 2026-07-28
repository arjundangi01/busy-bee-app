// Client-side mirror of the backend's dynamic work-unit pacing and
// effective-duration logic (focus-sessions/helpers.ts) — used only to drive
// the Companion's live on-screen animation and countdown display during a
// session. The server independently recomputes the authoritative banked
// unit count and enforced cap from real elapsed time at session end (never
// trusts this), so a client/server mismatch here can only ever affect the
// live preview, never what actually gets banked or enforced.
const WORK_UNIT_SECONDS = 300;

// The smaller of the caller's plan cap and the mission's own chosen focus
// duration — null only when neither is set, meaning no cap applies at all.
export function getEffectiveDurationCapSeconds(
  planCapSeconds: number | null,
  missionDurationSeconds: number | null,
): number | null {
  if (planCapSeconds === null) return missionDurationSeconds;
  if (missionDurationSeconds === null) return planCapSeconds;
  return Math.min(planCapSeconds, missionDurationSeconds);
}

// Paces the fill so the hive finishes exactly at the session's effective
// duration (a 20-minute mission fills in 20 minutes, a 4-hour one over 4
// hours) — falls back to the fixed WORK_UNIT_SECONDS only when there's no
// effective duration at all (uncapped Pro, no chosen duration).
export function computeCurrentWorkUnit(
  elapsedSeconds: number,
  totalUnits: number,
  effectiveDurationSeconds: number | null,
): number {
  if (totalUnits <= 0) return 0;
  const unitSeconds = effectiveDurationSeconds !== null ? effectiveDurationSeconds / totalUnits : WORK_UNIT_SECONDS;
  return Math.min(Math.floor(elapsedSeconds / unitSeconds), totalUnits);
}
