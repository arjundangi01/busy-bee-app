import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { useColors } from "@/theme";

export default function Index() {
  const { isBootstrapping, user } = useAuthStore();
  const colors = useColors();

  if (isBootstrapping) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href={routes.onboarding.welcome()} />;
  }

  return <Redirect href={routes.tabs.home()} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
