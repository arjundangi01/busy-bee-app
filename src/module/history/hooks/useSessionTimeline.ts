import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, ISessionTimeline } from "@/types";

// design-artifacts/evolution/specs/14-session-timeline.md -- `enabled` lets
// the template skip the request entirely for a Free user (who already knows
// from useEntitlement they'll see the locked panel, not the real data) --
// the backend would 403 it anyway, but there's no reason to make the call.
export function useSessionTimeline(focusSessionId: string, enabled: boolean) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["history", "sessions", focusSessionId, "timeline"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<ISessionTimeline>>(
        `/focus-sessions/${focusSessionId}/timeline`,
      );
      return response.data.data;
    },
    enabled,
  });

  return {
    timeline: data ?? null,
    isLoading,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
