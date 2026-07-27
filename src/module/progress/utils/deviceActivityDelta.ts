// "vs your average" track math for the Device Activity card
// (design-artifacts/evolution/specs/sketches/insights-accuracy-and-distraction-detail-sketch.html's
// avg-track). Metric-aware: which direction counts as "good" differs per
// metric (more offline time is good, more pickups is bad), but the only
// colors used are the existing `text` (good) and `danger` (bad) tokens — no
// new color token is invented for this.
export type DeltaWording = "aboveBelowAverage" | "laterEarlierThanUsual";

export type DeltaDisplay = {
  trackFillPercent: number;
  trackSide: "left" | "right";
  isGood: boolean;
  coloredPart: string;
  mutedPart: string;
};

export function computeDeltaDisplay(
  value: number,
  avg: number | null,
  higherIsGood: boolean,
  wording: DeltaWording,
  formatMagnitude: (absoluteDelta: number) => string,
  suffix?: string,
): DeltaDisplay | null {
  if (avg === null) return null;

  const delta = value - avg;
  if (delta === 0) {
    return {
      trackFillPercent: 0,
      trackSide: "right",
      isGood: true,
      coloredPart: "",
      mutedPart: wording === "laterEarlierThanUsual" ? "Same as usual" : "Same as your average",
    };
  }

  const isGood = (delta > 0) === higherIsGood;
  // Relative to the average itself (no fixed per-metric scale to compare
  // against) — a delta equal in size to the whole average fills the entire
  // half-track. Clamped so a tiny delta still shows a visible sliver and a
  // huge one never overflows past the track's edge.
  const magnitudeReference = Math.max(Math.abs(avg), 1);
  const trackFillPercent = Math.min(50, Math.max(4, Math.round((Math.abs(delta) / magnitudeReference) * 50)));
  const arrow = delta > 0 ? "▲" : "▼";
  const directionWord =
    wording === "laterEarlierThanUsual" ? (delta > 0 ? "later" : "earlier") : delta > 0 ? "above" : "below";
  const tail = wording === "laterEarlierThanUsual" ? `${directionWord} than usual` : `${directionWord} your average`;

  return {
    trackFillPercent,
    trackSide: delta > 0 ? "right" : "left",
    isGood,
    coloredPart: `${arrow} ${formatMagnitude(Math.abs(delta))}`,
    mutedPart: suffix ? `${tail} · ${suffix}` : tail,
  };
}

// The backend hands over raw ISO instants for pickup times rather than a
// pre-averaged number — averaging a time-of-day needs the device's own
// local timezone (Date.getHours()), which the server doesn't have. These
// two helpers do that local-time math on the client, right where it belongs.
export const minutesSinceLocalMidnight = (iso: string): number => {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
};

export const avgMinutesSinceLocalMidnight = (isoTimestamps: string[]): number | null => {
  if (isoTimestamps.length === 0) return null;
  const total = isoTimestamps.reduce((sum, iso) => sum + minutesSinceLocalMidnight(iso), 0);
  return Math.round(total / isoTimestamps.length);
};

export const formatClockTime = (iso: string): string => {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
};
