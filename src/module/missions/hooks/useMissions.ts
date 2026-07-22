import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IMission } from "@/types";

export function useMissions() {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IMission[]>>("/missions");
      return response.data.data ?? [];
    },
  });

  return {
    missions: data ?? [],
    isLoading,
    isRefetching,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
