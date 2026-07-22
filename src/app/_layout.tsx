import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { queryClient } from "@/lib/query-client";
import { initPurchases } from "@/lib/purchases";
import { OnboardingPermissionsProvider } from "@/module/onboarding/context/OnboardingPermissionsContext";
import { AuthProvider } from "@/store/auth-store";
import { useColors } from "@/theme";

export default function RootLayout() {
  const colors = useColors();

  useEffect(() => {
    initPurchases();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingPermissionsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
          </Stack>
        </OnboardingPermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
