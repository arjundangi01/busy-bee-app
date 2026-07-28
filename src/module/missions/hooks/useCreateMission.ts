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

type IAddExtraTaskPayload = {
  missionId: string;
  title: string;
  estimatedMinutes: number;
};

type IFinalizeOrderPayload = {
  missionId: string;
  taskIds: string[];
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

  // Used right after create() to add any steps the user added in the
  // pre-start editor that weren't part of the AI's own plan — reuses the
  // same real, capped endpoint Mission Detail's "Add Task" already hits, so
  // a Free user can't sidestep the mission-level cap just by padding the
  // plan before hitting Start.
  const addExtraTaskMutation = useMutation({
    mutationKey: ["missions", "create", "add-extra-task"],
    mutationFn: async ({ missionId, title, estimatedMinutes }: IAddExtraTaskPayload) => {
      const response = await apiClient.post<IApiResponse<IMission>>(`/missions/${missionId}/tasks`, {
        title,
        estimatedMinutes,
      });
      return response.data.data as IMission;
    },
  });

  // Applies the user's final arranged order once the mission and any extra
  // tasks all exist — reuses the same reorder endpoint Mission Detail uses,
  // only needed when a user-added step ended up interleaved with the AI's
  // own steps rather than simply appended at the end.
  const finalizeOrderMutation = useMutation({
    mutationKey: ["missions", "create", "finalize-order"],
    mutationFn: async ({ missionId, taskIds }: IFinalizeOrderPayload) => {
      const response = await apiClient.patch<IApiResponse<IMission>>(`/missions/${missionId}/tasks/reorder`, {
        taskIds,
      });
      return response.data.data as IMission;
    },
  });

  return {
    create: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    addExtraTask: addExtraTaskMutation.mutateAsync,
    finalizeOrder: finalizeOrderMutation.mutateAsync,
  };
}
