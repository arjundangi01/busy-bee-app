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
    status: data?.status ?? null,
    expiresAt: data?.expiresAt ?? null,
    // null means "not loaded yet" here, same as "unlimited" would mean once
    // loaded — callers must gate cap-dependent behavior on isLoading too.
    limits: data?.limits ?? { dailySessionCap: null, sessionDurationCapSeconds: null },
    isLoading,
    error: error ? getErrorMessage(error) : null,
    refresh: refetch,
  };
}
