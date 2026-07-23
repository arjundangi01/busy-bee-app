import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { signInWithGoogle } from "@/lib/googleAuth";
import { getErrorMessage } from "@/lib/utils/errors";
import { useAuthStore } from "@/store/auth-store";
import { IApiResponse, IAuthResult } from "@/types";

type IGoogleAuthPayload = {
  backgroundExecutionGranted: boolean | null;
  notificationsGranted: boolean | null;
};

export function useGoogleAuth() {
  const { setSession } = useAuthStore();

  const mutation = useMutation({
    mutationKey: ["auth", "google"],
    mutationFn: async (payload: IGoogleAuthPayload) => {
      const idToken = await signInWithGoogle();
      if (!idToken) {
        return null;
      }
      const response = await apiClient.post<IApiResponse<IAuthResult>>("/auth/google", {
        idToken,
        ...payload,
      });
      return response.data.data;
    },
    onSuccess: (result) => {
      if (result) setSession(result);
    },
  });

  return {
    submit: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
