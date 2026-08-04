import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IPaginatedSessionHistory, ISessionSummary } from "@/types";

// Home's "Recent sessions" glimpse — the most recent sessions overall (any
// day), not just today's. Reuses the existing /focus-sessions/history
// endpoint with a small limit instead of dashboard.today.sessions, which is
// filtered to the current calendar day only and would stay empty on a day
// with no session yet even when past history exists.
export function useRecentSessions(limit: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["focus-sessions", "recent", limit],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IPaginatedSessionHistory>>("/focus-sessions/history", {
        params: { limit },
      });
      return response.data.data;
    },
  });

  const sessions: ISessionSummary[] = data?.items ?? [];

  return {
    sessions,
    isLoading,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
