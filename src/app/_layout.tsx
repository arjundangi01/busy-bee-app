import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { queryClient } from "@/lib/query-client";
import { configureGoogleSignIn } from "@/lib/googleAuth";
import { initPurchases } from "@/lib/purchases";
import { OnboardingPermissionsProvider } from "@/module/onboarding/context/OnboardingPermissionsContext";
import { AuthProvider, useAuthStore } from "@/store/auth-store";
import { ThemeProvider, useColors } from "@/theme";

function RootNavigator() {
  const colors = useColors();
  const { user } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Guards gate entire route groups. When `user` flips, the losing
          group unmounts so its history is gone too — that's what stops
          "back" from re-entering onboarding/auth after sign-in, and what
          makes sign-out fall straight through to the auth group. */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
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
