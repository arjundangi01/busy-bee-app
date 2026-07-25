import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IBankedWork } from "@/types";

// Bee's Hive gallery data — real, server-aggregated totals across every
// ended session (see backend WorkTypeHelpers.getBanked), not a locally
// tracked count that could drift from what actually got recorded.
export function useBankedWork() {
  const query = useQuery({
    queryKey: ["work-types", "banked"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IBankedWork[]>>("/work-types/banked");
      return response.data.data ?? [];
    },
  });

  return {
    bankedWork: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
