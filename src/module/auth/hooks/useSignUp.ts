import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { useAuthStore } from "@/store/auth-store";
import { IApiResponse, IAuthResult } from "@/types";

type ISignUpPayload = {
  name: string;
  email: string;
  password: string;
  backgroundExecutionGranted: boolean | null;
  notificationsGranted: boolean | null;
};

export function useSignUp() {
  const { setSession } = useAuthStore();

  const mutation = useMutation({
    mutationKey: ["auth", "sign-up"],
    mutationFn: async (payload: ISignUpPayload) => {
      const response = await apiClient.post<IApiResponse<IAuthResult>>("/auth/sign-up", payload);
      return response.data.data as IAuthResult;
    },
    onSuccess: (result) => setSession(result),
  });

  return {
    submit: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
