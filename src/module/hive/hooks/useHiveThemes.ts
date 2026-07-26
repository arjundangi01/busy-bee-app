import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IHiveTheme } from "@/types";

// Bee's Hive environment registry — content-driven, same pattern as
// useBeeSkins/useWorkTypes: new rows appear here with no app release needed.
export function useHiveThemes() {
  const query = useQuery({
    queryKey: ["hive-themes"],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IHiveTheme[]>>("/hive-themes");
      return response.data.data ?? [];
    },
  });

  return {
    hiveThemes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
