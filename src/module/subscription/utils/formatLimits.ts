// Formats a real PlanLimits.sessionDurationCapSeconds value for display —
// no assumption baked in that it's always exactly 1 hour, since the value
// comes from the DB and can change without a code deploy.
export const formatDurationCap = (seconds: number): string => {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};
