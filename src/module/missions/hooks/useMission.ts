import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IMission } from "@/types";

type IAddTaskPayload = {
  title: string;
  estimatedMinutes: number;
};

type IEditTaskTitlePayload = {
  taskId: string;
  title: string;
};

export function useMission(missionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["missions", missionId],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IMission>>(`/missions/${missionId}`);
      return response.data.data;
    },
  });

  const patchMissionCache = (updatedMission: IMission | null) => {
    queryClient.setQueryData(["missions", missionId], updatedMission);
  };

  const completeTaskMutation = useMutation({
    mutationKey: ["missions", missionId, "complete-task"],
    mutationFn: async (taskId: string) => {
      const response = await apiClient.post<IApiResponse<IMission>>(
        `/missions/${missionId}/tasks/${taskId}/complete`,
      );
      return response.data.data;
    },
    onSuccess: patchMissionCache,
  });

  // Unlike the other mutations here, this one's error is NOT swallowed —
  // MissionDetailTemplate needs to inspect the rejected error's code
  // (TASK_LIMIT_REACHED / TIME_BUDGET_EXCEEDED) to decide whether to route
  // to the paywall instead of showing an inline message, the same way
  // FocusSessionTemplate already does for SESSION_CAP_REACHED.
  const addTaskMutation = useMutation({
    mutationKey: ["missions", missionId, "add-task"],
    mutationFn: async (payload: IAddTaskPayload) => {
      const response = await apiClient.post<IApiResponse<IMission>>(`/missions/${missionId}/tasks`, payload);
      return response.data.data;
    },
    onSuccess: patchMissionCache,
  });

  const editTaskTitleMutation = useMutation({
    mutationKey: ["missions", missionId, "edit-task-title"],
    mutationFn: async ({ taskId, title }: IEditTaskTitlePayload) => {
      const response = await apiClient.patch<IApiResponse<IMission>>(`/missions/${missionId}/tasks/${taskId}`, {
        title,
      });
      return response.data.data;
    },
    onSuccess: patchMissionCache,
  });

  const reorderTasksMutation = useMutation({
    mutationKey: ["missions", missionId, "reorder-tasks"],
    mutationFn: async (taskIds: string[]) => {
      const response = await apiClient.patch<IApiResponse<IMission>>(`/missions/${missionId}/tasks/reorder`, {
        taskIds,
      });
      return response.data.data;
    },
    onSuccess: patchMissionCache,
  });

  const mutationError =
    addTaskMutation.error ?? completeTaskMutation.error ?? editTaskTitleMutation.error ?? reorderTasksMutation.error;

  return {
    mission: query.data ?? null,
    isLoading: query.isLoading,
    error: mutationError ? getErrorMessage(mutationError) : query.error ? getErrorMessage(query.error) : null,
    completeTask: (taskId: string) => completeTaskMutation.mutateAsync(taskId).catch(() => undefined),
    completingTaskId: completeTaskMutation.isPending ? (completeTaskMutation.variables ?? null) : null,
    addTask: (payload: IAddTaskPayload) => addTaskMutation.mutateAsync(payload),
    isAddingTask: addTaskMutation.isPending,
    editTaskTitle: (payload: IEditTaskTitlePayload) => editTaskTitleMutation.mutateAsync(payload).catch(() => undefined),
    savingTaskId: editTaskTitleMutation.isPending ? (editTaskTitleMutation.variables?.taskId ?? null) : null,
    reorderTasks: (taskIds: string[]) => reorderTasksMutation.mutateAsync(taskIds).catch(() => undefined),
    isReordering: reorderTasksMutation.isPending,
    refresh: query.refetch,
  };
}
