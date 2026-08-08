import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils/errors";

export function useDeleteAccount() {
  const mutation = useMutation({
    mutationKey: ["account", "delete"],
    mutationFn: async () => {
      try {
        await apiClient.delete("/account");
      } catch (error) {
        // Already deleted server-side (e.g. from another device, or a
        // retried tap) — the local session is just stale. The end state the
        // user wants (no account) already holds, so treat it as success.
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return;
        }
        throw error;
      }
    },
  });

  return {
    deleteAccount: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
  };
}
