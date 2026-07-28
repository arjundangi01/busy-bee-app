export const formatMinutesAsHoursAndMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

// "9:02 AM – 9:31 AM", or just the start time if the session is still open
// (in practice callers exclude in-progress sessions from these lists, but
// this stays correct either way rather than assuming).
export const formatTimeRange = (startedAtIso: string, endedAtIso: string | null): string => {
  const startLabel = TIME_FORMATTER.format(new Date(startedAtIso));
  if (!endedAtIso) {
    return startLabel;
  }
  return `${startLabel} – ${TIME_FORMATTER.format(new Date(endedAtIso))}`;
};

export const formatSessionDate = (startedAtIso: string): string =>
  new Date(startedAtIso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
