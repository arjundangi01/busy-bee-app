import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { useCreateMission } from "@/module/missions/hooks/useCreateMission";
import { useMissionPlan } from "@/module/missions/hooks/useMissionPlan";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IMissionPlan } from "@/types";

type FlowState = "input" | "thinking" | "ready" | "error";

export function StartMissionTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [state, setState] = useState<FlowState>("input");
  const [taskText, setTaskText] = useState("");
  const [planResult, setPlanResult] = useState<IMissionPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(false);

  const { plan, error: planError } = useMissionPlan();
  const { create, isLoading: isCreating } = useCreateMission();

  const requestPlan = async () => {
    setState("thinking");
    try {
      const result = await plan({ taskText: taskText.trim() });
      setPlanResult(result);
      setShowFullPlan(false);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  const handleStart = async () => {
    if (!planResult) return;
    const mission = await create({
      taskText: taskText.trim(),
      nextStep: planResult.nextStep,
      remainingSteps: planResult.remainingSteps,
    });
    router.replace(routes.focusSession(mission.id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title="New Mission" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.View key={state} entering={FadeIn.duration(250)} style={styles.content}>
          {state === "input" && (
            <View style={styles.inputSection}>
              <Text style={styles.prompt}>What&apos;s the task?</Text>
              <TextField
                placeholder="e.g. Clean up the deck out back"
                value={taskText}
                onChangeText={setTaskText}
                autoFocus
              />
              <Text style={styles.helper}>Just the task — I&apos;ll figure out where to start.</Text>
            </View>
          )}

          {state === "thinking" && (
            <View style={styles.thinkingSection}>
              <GlowOrb size={64} />
              <Text style={styles.thinkingStatus}>Finding your next smallest step…</Text>
            </View>
          )}

          {state === "error" && (
            <View style={styles.thinkingSection}>
              <Text style={styles.errorHeadline}>Couldn&apos;t reach the planning service.</Text>
              {planError && <Text style={styles.errorDetail}>{planError}</Text>}
            </View>
          )}

          {state === "ready" && planResult && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>{taskText}</Text>

              <StatCard>
                <Text style={styles.stepEyebrow}>Start with</Text>
                <Text style={styles.stepText}>{planResult.nextStep}</Text>
              </StatCard>

              {planResult.remainingSteps.length > 0 && (
                <>
                  <Pressable onPress={() => setShowFullPlan((prev) => !prev)} hitSlop={8}>
                    <Text style={styles.planToggle}>
                      {showFullPlan
                        ? "Hide full plan ‹"
                        : `View full plan (${planResult.remainingSteps.length + 1} steps) ›`}
                    </Text>
                  </Pressable>
                  {showFullPlan && (
                    <View style={styles.planList}>
                      <Text style={[styles.planItem, styles.planItemCurrent]}>{planResult.nextStep}</Text>
                      {planResult.remainingSteps.map((step, index) => (
                        <Text key={index} style={styles.planItem}>
                          {step}
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}

              <View style={styles.companionLine}>
                <Companion state="mentioned" caption="Working alongside you for this one." />
              </View>
            </View>
          )}
        </Animated.View>

        <View style={styles.footer}>
          {state === "input" && (
            <PrimaryButton label="Continue" onPress={requestPlan} disabled={taskText.trim().length === 0} />
          )}
          {state === "error" && <PrimaryButton label="Retry" onPress={requestPlan} />}
          {state === "ready" && (
            <>
              <PrimaryButton label="Start" onPress={handleStart} loading={isCreating} />
              <Pressable onPress={requestPlan} hitSlop={8} style={styles.retryLink}>
                <Text style={styles.retryText}>Not quite — try again</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
    },
    inputSection: {
      gap: spacing.sm,
    },
    prompt: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    helper: {
      color: colors.textFaint,
      fontSize: 12,
    },
    thinkingSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    thinkingStatus: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    errorHeadline: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    errorDetail: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
    resultSection: {
      gap: spacing.lg,
    },
    resultTitle: {
      color: colors.textMuted,
      fontSize: 12,
    },
    stepEyebrow: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    stepText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      marginTop: spacing.xxs,
    },
    planToggle: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    planList: {
      gap: spacing.xs,
    },
    planItem: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    planItemCurrent: {
      color: colors.text,
      fontWeight: "600",
    },
    companionLine: {
      alignItems: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    retryLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    retryText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
