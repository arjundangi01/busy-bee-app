// Client-side mirror of the backend's WORK_UNIT_SECONDS pacing (focus-sessions/helpers.ts)
// — used only to drive the Companion's live on-screen animation during a
// session. The server independently recomputes the authoritative banked
// unit count from real elapsed time at session end (never trusts this),
// so a client/server mismatch here can only ever affect the live preview,
// never what actually gets banked.
const WORK_UNIT_SECONDS = 300;

export function computeCurrentWorkUnit(elapsedSeconds: number, totalUnits: number): number {
  return Math.min(Math.floor(elapsedSeconds / WORK_UNIT_SECONDS), totalUnits);
}
