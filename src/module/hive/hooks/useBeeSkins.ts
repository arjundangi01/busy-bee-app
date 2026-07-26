import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IBeeSkin } from "@/types";

// Bee's Hive appearance registry — content-driven, same pattern as
// useWorkTypes: new rows appear here with no app release needed.
export function useBeeSkins() {
  const query = useQuery({
    queryKey: ["bee-skins"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IBeeSkin[]>>("/bee-skins");
      return response.data.data ?? [];
    },
  });

  return {
    beeSkins: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
