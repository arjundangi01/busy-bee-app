import { useLocalSearchParams } from "expo-router";
import { MissionDetailTemplate } from "@/module/missions/templates/MissionDetailTemplate";

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MissionDetailTemplate missionId={id} />;
}
