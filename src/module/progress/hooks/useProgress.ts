import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IProgress } from "@/types";

export function useProgress() {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IProgress>>("/progress");
      return response.data.data;
    },
  });

  return {
    progress: data ?? null,
    isLoading,
    isRefetching,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
