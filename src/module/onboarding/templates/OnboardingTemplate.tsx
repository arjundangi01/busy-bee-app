import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ProgressDots } from "@/module/onboarding/components/ProgressDots";
import { useOnboardingPermissions } from "@/module/onboarding/context/OnboardingPermissionsContext";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";

type OnboardingState = "A" | "B" | "C";

const STATE_INDEX: Record<OnboardingState, number> = { A: 0, B: 1, C: 2 };

export function OnboardingTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [state, setState] = useState<OnboardingState>("A");
  const { setNotificationsGranted } = useOnboardingPermissions();

  const handleAllowNotifications = async () => {
    const result = await Notifications.requestPermissionsAsync();
    setNotificationsGranted(result.status === "granted");
    setState("C");
  };

  const handleSkipNotifications = () => {
    setNotificationsGranted(false);
    setState("C");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Animated.View key={state} entering={FadeIn.duration(300)} style={styles.content}>
        {state === "A" && (
          <View style={styles.centerColumn}>
            <Companion state="greeting" />
            <Text style={styles.headline}>I block distractions and stay with you until it&apos;s done.</Text>
            <Text style={styles.subline}>
              Not motivation. Mechanism. One quick permission and I can actually hold it.
            </Text>
          </View>
        )}

        {state === "B" && (
          <View style={styles.centerColumn}>
            <Pressable style={styles.skipLink} onPress={handleSkipNotifications} hitSlop={12}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
            <Text style={styles.icon}>🔔</Text>
            <Text style={styles.headline}>So I can show up outside the app too.</Text>
            <View style={styles.whyBox}>
              <Text style={styles.whyText}>
                Notifications let your companion stay visible while you work, and send a gentle nudge if a
                session needs your attention — never marketing, just the job.
              </Text>
            </View>
          </View>
        )}

        {state === "C" && (
          <View style={styles.centerColumn}>
            <Companion state="greeting" />
            <Text style={styles.headline}>Set. Let&apos;s find your first mission.</Text>
            <Text style={styles.subline}>No streak yet, no history — that&apos;s normal. This is where it starts.</Text>
          </View>
        )}
      </Animated.View>

      <ProgressDots total={3} current={STATE_INDEX[state]} />

      <View style={styles.footer}>
        {state === "A" && <PrimaryButton label="Show me how" onPress={() => setState("B")} />}
        {state === "B" && <PrimaryButton label="Allow notifications" onPress={handleAllowNotifications} />}
        {state === "C" && (
          <PrimaryButton label="Continue" onPress={() => router.push(routes.auth.signUp())} />
        )}
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
      paddingHorizontal: spacing.lg,
    },
    centerColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingVertical: spacing.xxl,
    },
    skipLink: {
      position: "absolute",
      top: spacing.md,
      right: 0,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    icon: {
      fontSize: 32,
    },
    headline: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    subline: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: "center",
    },
    whyBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.md,
    },
    whyText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 19,
    },
    ceilingNote: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
  });
