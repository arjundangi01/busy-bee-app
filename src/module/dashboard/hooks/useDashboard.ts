import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IDashboard } from "@/types";

export function useDashboard() {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IDashboard>>("/dashboard");
      return response.data.data;
    },
  });

  return {
    dashboard: data ?? null,
    isLoading,
    isRefetching,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
