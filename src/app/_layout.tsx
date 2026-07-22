import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { queryClient } from "@/lib/query-client";
import { OnboardingAnswersProvider } from "@/module/onboarding/context/OnboardingAnswersContext";
import { AuthProvider } from "@/store/auth-store";
import { useColors } from "@/theme";

export default function RootLayout() {
  const colors = useColors();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingAnswersProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </OnboardingAnswersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
