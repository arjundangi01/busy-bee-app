import { useLocalSearchParams } from "expo-router";
import { PaywallTemplate } from "@/module/subscription/templates/PaywallTemplate";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";

export default function Paywall() {
  const { entry, missionId } = useLocalSearchParams<{ entry: PAYWALL_ENTRY; missionId?: string }>();

  return <PaywallTemplate entry={entry} missionId={missionId ?? null} />;
}
