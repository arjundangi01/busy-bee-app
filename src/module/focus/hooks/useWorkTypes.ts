import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IWorkType } from "@/types";

// Bee's Hive work-type registry — see design-artifacts/evolution/specs/
// 03-companion-work-types.md. Content-driven: new rows appear here with no
// app release needed.
export function useWorkTypes() {
  const query = useQuery({
    queryKey: ["work-types"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IWorkType[]>>("/work-types");
      return response.data.data ?? [];
    },
  });

  return {
    workTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
