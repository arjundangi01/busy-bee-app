import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IFocusSession } from "@/types";
import { SESSION_END_REASON } from "@/utils/enums";

// Imperative one-off read (not a rendered useQuery) — used from
// FocusSessionTemplate's start() error handler to resolve which session/
// mission a SESSION_ALREADY_ACTIVE rejection refers to.
export async function fetchActiveFocusSession(): Promise<IFocusSession | null> {
  const response = await apiClient.get<IApiResponse<IFocusSession | null>>("/focus-sessions/active");
  return response.data.data;
}

// Same imperative-function shape as fetchActiveFocusSession above — used
// from auth-store's signOut() to best-effort end a still-active session
// outside of any component render, not just from useFocusSession's own
// mutation (which wraps this for the in-screen Done/Early Exit/time-limit
// paths).
export async function endFocusSession(
  focusSessionId: string,
  sessionEndReason: SESSION_END_REASON,
): Promise<IFocusSession> {
  const response = await apiClient.post<IApiResponse<IFocusSession>>(`/focus-sessions/${focusSessionId}/end`, {
    sessionEndReason,
  });
  return response.data.data as IFocusSession;
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
    mutationFn: ({
      focusSessionId,
      sessionEndReason,
    }: {
      focusSessionId: string;
      sessionEndReason: SESSION_END_REASON;
    }) => endFocusSession(focusSessionId, sessionEndReason),
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
