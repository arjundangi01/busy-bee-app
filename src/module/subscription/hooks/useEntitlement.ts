import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, ISubscriptionStatus } from "@/types";

export function useEntitlement() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<ISubscriptionStatus>>("/subscription/status");
      return response.data.data;
    },
  });

  return {
    isPro: data?.isPro ?? false,
    isLoading,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
