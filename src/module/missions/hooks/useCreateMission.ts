import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IMission } from "@/types";

type ICreateMissionPayload = {
  taskText: string;
  nextStep: string;
  nextStepMinutes: number;
  remainingSteps: string[];
  remainingStepsMinutes: number[];
  focusMinutes: number;
};

export function useCreateMission() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["missions", "create"],
    mutationFn: async (payload: ICreateMissionPayload) => {
      const response = await apiClient.post<IApiResponse<IMission>>("/missions", payload);
      return response.data.data as IMission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    create: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
