import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";
import { useAuthStore } from "@/store/auth-store";
import { IApiResponse, IAuthResult } from "@/types";

type ISignInPayload = {
  email: string;
  password: string;
};

export function useSignIn() {
  const { setSession } = useAuthStore();

  const mutation = useMutation({
    mutationKey: ["auth", "sign-in"],
    mutationFn: async (payload: ISignInPayload) => {
      const response = await apiClient.post<IApiResponse<IAuthResult>>("/auth/sign-in", payload);
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
