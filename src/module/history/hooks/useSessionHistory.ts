import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IPaginatedSessionHistory, ISessionSummary } from "@/types";

export function useSessionHistory() {
  const { data, isLoading, isRefetching, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["history", "sessions"],
      queryFn: async ({ pageParam }: { pageParam: string | null }) => {
        const response = await apiClient.get<IApiResponse<IPaginatedSessionHistory>>("/focus-sessions/history", {
          params: pageParam ? { cursor: pageParam } : undefined,
        });
        return response.data.data;
      },
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    });

  const sessions: ISessionSummary[] = data?.pages.flatMap((page) => page?.items ?? []) ?? [];

  return {
    sessions,
    isLoading,
    isRefetching,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}
