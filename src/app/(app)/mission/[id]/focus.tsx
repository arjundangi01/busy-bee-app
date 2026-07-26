import { useLocalSearchParams } from "expo-router";
import { HiveEntryReveal } from "@/module/focus/components/HiveEntryReveal";
import { FocusSessionTemplate } from "@/module/focus/templates/FocusSessionTemplate";

export default function FocusSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <HiveEntryReveal>
      <FocusSessionTemplate missionId={id} />
    </HiveEntryReveal>
  );
}
