import { useLocalSearchParams } from "expo-router";
import { PaywallTemplate } from "@/module/subscription/templates/PaywallTemplate";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";

export default function Paywall() {
  const { entry, missionId, reason } = useLocalSearchParams<{
    entry: PAYWALL_ENTRY;
    missionId?: string;
    reason?: "count" | "time";
  }>();

  return <PaywallTemplate entry={entry} missionId={missionId ?? null} reason={reason ?? null} />;
}
