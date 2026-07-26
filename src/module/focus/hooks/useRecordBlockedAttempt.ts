import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IFocusSession } from "@/types";

// Wires design-artifacts/evolution/specs/01-blocked-app-interstitial.md's real
// collision signal into the backend endpoint that already existed but had no
// caller — see FocusSessionsHelpers.recordBlockedAttempt on the backend.
export function useRecordBlockedAttempt() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["focus-sessions", "record-blocked-attempt"],
    mutationFn: async ({ focusSessionId, packageName }: { focusSessionId: string; packageName: string | null }) => {
      const response = await apiClient.post<IApiResponse<IFocusSession>>(
        `/focus-sessions/${focusSessionId}/blocked-attempt`,
        { packageName },
      );
      return response.data.data as IFocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    recordBlockedAttempt: mutation.mutateAsync,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
