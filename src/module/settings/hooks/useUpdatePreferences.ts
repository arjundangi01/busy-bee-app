import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { useAuthStore } from "@/store/auth-store";
import { IApiResponse, IAuthResult } from "@/types";

type IUpdatePreferencesPayload = {
  pushNotificationsEnabled?: boolean;
  eodNudgeEnabled?: boolean;
};

export function useUpdatePreferences() {
  const { updateUser } = useAuthStore();

  const mutation = useMutation({
    mutationKey: ["auth", "update-preferences"],
    mutationFn: async (payload: IUpdatePreferencesPayload) => {
      const response = await apiClient.patch<IApiResponse<IAuthResult>>("/auth/me", payload);
      return response.data.data as IAuthResult;
    },
    onSuccess: (result) => updateUser(result.user),
  });

  return {
    submit: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
