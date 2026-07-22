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

type OnboardingState = "A" | "B" | "C" | "D";

const STATE_INDEX: Record<OnboardingState, number> = { A: 0, B: 1, C: 2, D: 3 };

export function OnboardingTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [state, setState] = useState<OnboardingState>("A");
  const { setBackgroundExecutionGranted, setNotificationsGranted } = useOnboardingPermissions();

  const handleAllowBackground = async () => {
    // No managed-Expo API can trigger a real OS "background execution" grant
    // dialog — there is no such single permission on either platform (see
    // 3.1's Technical Notes). Recording affirmative intent here is forward-
    // compatible with whichever real enforcement mechanism gets decided
    // (flagged as Open Item 1 in the DD-001 implementation plan).
    setBackgroundExecutionGranted(true);
    setState("C");
  };

  const handleSkipBackground = () => {
    setBackgroundExecutionGranted(false);
    setState("C");
  };

  const handleAllowNotifications = async () => {
    const result = await Notifications.requestPermissionsAsync();
    setNotificationsGranted(result.status === "granted");
    setState("D");
  };

  const handleSkipNotifications = () => {
    setNotificationsGranted(false);
    setState("D");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Animated.View key={state} entering={FadeIn.duration(300)} style={styles.content}>
        {state === "A" && (
          <View style={styles.centerColumn}>
            <Companion state="greeting" />
            <Text style={styles.headline}>I block distractions and stay with you until it&apos;s done.</Text>
            <Text style={styles.subline}>
              Not motivation. Mechanism. Two quick permissions and I can actually hold it.
            </Text>
          </View>
        )}

        {state === "B" && (
          <View style={styles.centerColumn}>
            <Pressable style={styles.skipLink} onPress={handleSkipBackground} hitSlop={12}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
            <Text style={styles.icon}>🛡️</Text>
            <Text style={styles.headline}>This has to keep working, even locked.</Text>
            <View style={styles.whyBox}>
              <Text style={styles.whyText}>
                Blocking only means something if it survives you locking your phone or switching apps. This
                lets busy-bee keep enforcing in the background.
              </Text>
            </View>
            <Text style={styles.ceilingNote}>
              No blocker is unbeatable — but turning this off mid-session takes a deliberate, multi-step
              action, not one tap.
            </Text>
          </View>
        )}

        {state === "C" && (
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

        {state === "D" && (
          <View style={styles.centerColumn}>
            <Companion state="greeting" />
            <Text style={styles.headline}>Set. Let&apos;s find your first mission.</Text>
            <Text style={styles.subline}>No streak yet, no history — that&apos;s normal. This is where it starts.</Text>
          </View>
        )}
      </Animated.View>

      <ProgressDots total={4} current={STATE_INDEX[state]} />

      <View style={styles.footer}>
        {state === "A" && <PrimaryButton label="Show me how" onPress={() => setState("B")} />}
        {state === "B" && <PrimaryButton label="Allow background access" onPress={handleAllowBackground} />}
        {state === "C" && <PrimaryButton label="Allow notifications" onPress={handleAllowNotifications} />}
        {state === "D" && (
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
