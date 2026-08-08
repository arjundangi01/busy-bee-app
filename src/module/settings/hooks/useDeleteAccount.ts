import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";

export function useDeleteAccount() {
  const mutation = useMutation({
    mutationKey: ["account", "delete"],
    mutationFn: async () => {
      await apiClient.delete("/account");
    },
  });

  return {
    deleteAccount: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
