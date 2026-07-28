import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TopBar } from "@/components/navigation/TopBar";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/evolution/specs/12-post-session-history-and-roughness.md —
// Track 1's session rows are tappable and real, but the actual Session
// Timeline (step-by-step + distraction events) is Track 2, not designed or
// built yet. This is a deliberate placeholder, not a stand-in for a missing
// feature that should have shipped — so a row leads somewhere real rather
// than doing nothing.
export function SessionTimelinePlaceholderTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="Session Timeline" onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.headline}>Session Timeline</Text>
        <Text style={styles.body}>
          Step-by-step detail and distraction events for this session are coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.xl,
    },
    lockIcon: {
      fontSize: 24,
      marginBottom: spacing.xs,
    },
    headline: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    body: {
      color: colors.textMuted,
      fontSize: 12.5,
      textAlign: "center",
      lineHeight: 18,
    },
  });
