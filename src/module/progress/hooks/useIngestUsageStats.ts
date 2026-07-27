import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import * as UsageStats from "../../../../modules/usage-stats";

// Local calendar day, not toISOString().slice() — the native module
// aggregates against the device's own local midnight (Calendar.getInstance()
// default timezone), so the day key posted here must match that, not get
// UTC-shifted near midnight in negative-offset timezones.
const localDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Posts today's on-device usage-stats aggregate once per Progress screen
// visit (design-artifacts/evolution/specs/
// 11-insights-screen-time-and-device-activity.md's "aggregated on-device,
// posted once, not streamed" design). The backend upserts by day, so
// re-running this later the same day only ever refines today's row with a
// more complete running total — never duplicates or streams raw events.
export function useIngestUsageStats() {
  const queryClient = useQueryClient();
  const hasRunRef = useRef(false);

  const mutation = useMutation({
    mutationKey: ["usage-stats", "ingest-daily"],
    mutationFn: async () => {
      const [appUsage, deviceActivity] = await Promise.all([
        UsageStats.getDailyAppUsage(),
        UsageStats.getDailyDeviceActivity(),
      ]);

      await apiClient.post("/usage-stats/daily", {
        date: localDayKey(new Date()),
        appUsage,
        deviceActivity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });

  useEffect(() => {
    if (Platform.OS !== "android" || hasRunRef.current) return;
    hasRunRef.current = true;

    UsageStats.isUsageAccessGranted().then((granted) => {
      if (!granted) return;
      mutation.mutate();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
