import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { queryClient } from "@/lib/query-client";
import { configureGoogleSignIn } from "@/lib/googleAuth";
import { initPurchases } from "@/lib/purchases";
import { OnboardingPermissionsProvider } from "@/module/onboarding/context/OnboardingPermissionsContext";
import { AuthProvider } from "@/store/auth-store";
import { ThemeProvider, useColors } from "@/theme";

function RootNavigator() {
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

export default function RootLayout() {
  useEffect(() => {
    initPurchases();
    configureGoogleSignIn();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnboardingPermissionsProvider>
            <RootNavigator />
          </OnboardingPermissionsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
