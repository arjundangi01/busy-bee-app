import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Companion } from "@/components/content/Companion";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

// One-time just-in-time nudge — design-artifacts/evolution/specs/
// 06-permission-priming.md. Reached only from Home Dashboard's Start tap
// (see HomeTemplate), never shown again after this once it's been displayed.
export function PermissionPrimingTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { submit: updatePreferences } = useUpdatePreferences();

  // Marked on mount, not on a button tap — this screen having been shown at
  // all is what "shown" means, so even a user who backgrounds the app
  // instead of tapping either button doesn't see this again next time.
  useEffect(() => {
    updatePreferences({ accessibilityPrimingShown: true }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const proceed = () => router.replace(routes.startMission());

  const handleTurnOn = () => {
    BlockingEnforcement.openAccessibilitySettings();
    proceed();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Companion state="greeting" captionIsHeadline caption="For your blocking to hold, Bee needs one more permission." />
        <Text style={styles.body}>
          Android requires this to be turned on manually in Settings — there&apos;s no in-app prompt for
          it. Without it, apps you&apos;ve blocked won&apos;t actually be stopped during a session.
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Turn on in Settings" onPress={handleTurnOn} />
        <Pressable onPress={proceed} hitSlop={8} style={styles.skipLink}>
          <Text style={styles.skipLinkText}>Skip for now</Text>
        </Pressable>
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
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    skipLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    skipLinkText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
