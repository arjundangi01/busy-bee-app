import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IFocusSession } from "@/types";
import { SESSION_END_REASON } from "@/utils/enums";

export function useFocusSession() {
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
