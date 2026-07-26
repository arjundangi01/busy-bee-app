import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { HiveEntryReveal } from "@/module/focus/components/HiveEntryReveal";
import { FocusSessionTemplate } from "@/module/focus/templates/FocusSessionTemplate";

export default function FocusSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sceneReady, setSceneReady] = useState(false);

  return (
    <HiveEntryReveal ready={sceneReady}>
      <FocusSessionTemplate missionId={id} onSceneReady={() => setSceneReady(true)} />
    </HiveEntryReveal>
  );
}
