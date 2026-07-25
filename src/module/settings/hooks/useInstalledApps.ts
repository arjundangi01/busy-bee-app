import { useQuery } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/utils/errors";
import { getInstalledApps } from "../../../../modules/installed-apps";

export type { InstalledApp } from "../../../../modules/installed-apps";

export function useInstalledApps() {
  const query = useQuery({
    queryKey: ["settings", "installed-apps"],
    // Throws in Expo Go / any build predating the native module — caught here,
    // surfaced as a plain error string, never crashes the screen.
    queryFn: getInstalledApps,
    retry: false,
  });

  return {
    apps: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  };
}
