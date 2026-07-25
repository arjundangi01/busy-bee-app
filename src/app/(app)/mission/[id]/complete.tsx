import { useLocalSearchParams } from "expo-router";
import { SessionCompleteTemplate } from "@/module/focus/templates/SessionCompleteTemplate";

export default function SessionCompleteScreen() {
  const { id, timeFocused, stepsCompleted, totalSteps, distractionsBlocked } = useLocalSearchParams<{
    id: string;
    timeFocused: string;
    stepsCompleted: string;
    totalSteps: string;
    distractionsBlocked: string;
  }>();

  return (
    <SessionCompleteTemplate
      missionId={id}
      timeFocusedMinutes={Number(timeFocused)}
      stepsCompleted={Number(stepsCompleted)}
      totalSteps={Number(totalSteps)}
      distractionsBlocked={Number(distractionsBlocked)}
    />
  );
}
