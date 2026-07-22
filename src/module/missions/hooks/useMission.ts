import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { IApiResponse, IMission } from "@/types";

export function useMission(missionId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["missions", missionId],
    queryFn: async () => {
      const response = await apiClient.get<IApiResponse<IMission>>(`/missions/${missionId}`);
      return response.data.data;
    },
  });

  const completeTaskMutation = useMutation({
    mutationKey: ["missions", missionId, "complete-task"],
    mutationFn: async (taskId: string) => {
      const response = await apiClient.post<IApiResponse<IMission>>(
        `/missions/${missionId}/tasks/${taskId}/complete`,
      );
      return response.data.data;
    },
    onSuccess: (updatedMission) => {
      queryClient.setQueryData(["missions", missionId], updatedMission);
    },
  });

  return {
    mission: query.data ?? null,
    isLoading: query.isLoading,
    error: completeTaskMutation.error
      ? getErrorMessage(completeTaskMutation.error)
      : query.error
        ? getErrorMessage(query.error)
        : null,
    completeTask: (taskId: string) => completeTaskMutation.mutateAsync(taskId).catch(() => undefined),
    completingTaskId: completeTaskMutation.isPending ? (completeTaskMutation.variables ?? null) : null,
    refresh: query.refetch,
  };
}
