import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IMissionPlan } from "@/types";

type IPlanMissionPayload = {
  taskText: string;
};

export function useMissionPlan() {
  const mutation = useMutation({
    mutationKey: ["missions", "plan"],
    mutationFn: async (payload: IPlanMissionPayload) => {
      const response = await apiClient.post<IApiResponse<IMissionPlan>>("/missions/plan", payload);
      return response.data.data as IMissionPlan;
    },
  });

  return {
    plan: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
}
