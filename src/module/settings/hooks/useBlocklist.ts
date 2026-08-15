import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IBlockedApp } from "@/types";

export type IBlocklistAppPayload = Pick<IBlockedApp, "packageName" | "appName">;

const BLOCKLIST_QUERY_KEY = ["settings", "blocklist"];

export function useBlocklist(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BLOCKLIST_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IBlockedApp[]>>("/blocklist");
      return response.data.data ?? [];
    },
    enabled: options?.enabled ?? true,
  });

  // Refetch on settle rather than writing the mutation's own response into the
  // cache directly — three mutations (add/remove/seed-defaults) can be
  // in flight at once here (unlike useMission's single completeTask), and
  // trusting response arrival order to "just work" lets a slower response
  // silently stomp a faster, more recent one. Refetching after every
  // settle always converges on the server's actual current state.
  const invalidateBlocklist = () =>
    queryClient.invalidateQueries({ queryKey: BLOCKLIST_QUERY_KEY });

  const addMutation = useMutation({
    mutationKey: ["blocklist", "add"],
    mutationFn: async (payload: IBlocklistAppPayload) => {
      const response = await apiClient.post<IApiResponse<IBlockedApp[]>>("/blocklist", payload);
      return response.data.data;
    },
    onSettled: invalidateBlocklist,
  });

  const removeMutation = useMutation({
    mutationKey: ["blocklist", "remove"],
    mutationFn: async (packageName: string) => {
      const response = await apiClient.delete<IApiResponse<IBlockedApp[]>>(
        `/blocklist/${encodeURIComponent(packageName)}`,
      );
      return response.data.data;
    },
    onSettled: invalidateBlocklist,
  });

  const seedDefaultsMutation = useMutation({
    mutationKey: ["blocklist", "seed-defaults"],
    mutationFn: async (defaults: IBlocklistAppPayload[]) => {
      const response = await apiClient.post<IApiResponse<IBlockedApp[]>>(
        "/blocklist/seed-defaults",
        defaults,
      );
      return response.data.data;
    },
    onSettled: invalidateBlocklist,
  });

  const mutationError = addMutation.error ?? removeMutation.error ?? seedDefaultsMutation.error;

  return {
    blockedApps: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
    mutationError: mutationError ? getErrorMessage(mutationError) : null,
    addApp: addMutation.mutateAsync,
    removeApp: removeMutation.mutateAsync,
    seedDefaults: seedDefaultsMutation.mutateAsync,
    // Package name currently being added/removed, if any — lets the caller
    // disable just that row's Toggle instead of a blanket `isAdding`/
    // `isRemoving` boolean that can't tell which row is in flight.
    pendingAddPackageName: addMutation.isPending ? addMutation.variables?.packageName : undefined,
    pendingRemovePackageName: removeMutation.isPending ? removeMutation.variables : undefined,
    isSeedingDefaults: seedDefaultsMutation.isPending,
  };
}
