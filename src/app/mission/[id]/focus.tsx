import { useLocalSearchParams } from "expo-router";
import { FocusSessionTemplate } from "@/module/focus/templates/FocusSessionTemplate";

export default function FocusSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FocusSessionTemplate missionId={id} />;
}
