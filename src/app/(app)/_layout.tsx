import { Stack } from "expo-router";
import { useColors } from "@/theme";

export default function AppLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
    </Stack>
  );
}
