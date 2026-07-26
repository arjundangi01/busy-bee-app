import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IFocusSession } from "@/types";
import { SESSION_END_REASON } from "@/utils/enums";

// Imperative one-off read (not a rendered useQuery) — used from
// FocusSessionTemplate's start() error handler to resolve which session/
// mission a SESSION_ALREADY_ACTIVE rejection refers to, the same way
// wasPaywallDismissedToday() is called imperatively from that same handler.
export async function fetchActiveFocusSession(): Promise<IFocusSession | null> {
  const response = await apiClient.get<IApiResponse<IFocusSession | null>>("/focus-sessions/active");
  return response.data.data;
}

export function useFocusSession() {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationKey: ["focus-sessions", "start"],
    mutationFn: async (missionId: string) => {
      const response = await apiClient.post<IApiResponse<IFocusSession>>("/focus-sessions", { missionId });
      return response.data.data as IFocusSession;
    },
  });

  const endMutation = useMutation({
    mutationKey: ["focus-sessions", "end"],
    mutationFn: async ({
      focusSessionId,
      sessionEndReason,
    }: {
      focusSessionId: string;
      sessionEndReason: SESSION_END_REASON;
    }) => {
      const response = await apiClient.post<IApiResponse<IFocusSession>>(
        `/focus-sessions/${focusSessionId}/end`,
        { sessionEndReason },
      );
      return response.data.data as IFocusSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    start: startMutation.mutateAsync,
    end: endMutation.mutateAsync,
    error: startMutation.error
      ? getErrorMessage(startMutation.error)
      : endMutation.error
        ? getErrorMessage(endMutation.error)
        : null,
  };
}
