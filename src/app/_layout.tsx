import { useEffect } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
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

// TanStack Query's refetchOnWindowFocus (on by default) is a no-op on React
// Native out of the box — it's wired to the web's visibilitychange event,
// which doesn't exist here. Without this, a query mounted before the app is
// backgrounded (e.g. the Home Dashboard, kept alive underneath the Tabs
// navigator the whole time) never refetches on resume — it just keeps
// showing whatever it last fetched, stale, until something else happens to
// remount or manually invalidate it. This is the officially documented RN
// fix: bridge AppState into focusManager so "app came back to the
// foreground" means the same thing to React Query that "tab became visible"
// means on web.
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  useEffect(() => {
    initPurchases();
    configureGoogleSignIn();

    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
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
