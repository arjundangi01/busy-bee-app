import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { FocusTimerDial, formatDuration } from "@/module/missions/components/FocusTimerDial";
import { MissionPathList } from "@/module/missions/components/MissionPathList";
import { useCreateMission } from "@/module/missions/hooks/useCreateMission";
import { useMissionPlan } from "@/module/missions/hooks/useMissionPlan";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IMissionPlan } from "@/types";

type FlowState = "input" | "thinking" | "ready" | "error";

const MIN_FOCUS_MINUTES = 5;
// Ceiling used when the caller's plan has no hard cap (Pro) — the picker
// still needs some usable upper bound even though the plan itself doesn't.
const UNCAPPED_MAX_MINUTES = 8 * 60;

export function StartMissionTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [state, setState] = useState<FlowState>("input");
  const [taskText, setTaskText] = useState("");
  const [planResult, setPlanResult] = useState<IMissionPlan | null>(null);
  const [showFullPlan, setShowFullPlan] = useState(true);
  const [focusMinutes, setFocusMinutes] = useState(MIN_FOCUS_MINUTES);

  const { plan, error: planError } = useMissionPlan();
  const { create, isLoading: isCreating } = useCreateMission();
  const { isPro, limits } = useEntitlement();

  const capMinutes =
    limits.sessionDurationCapSeconds !== null
      ? Math.floor(limits.sessionDurationCapSeconds / 60)
      : UNCAPPED_MAX_MINUTES;

  // Free plan's cap is worth surfacing on its own, not just implied by the
  // dial's max — and needs its own copy when a task's real estimate ran
  // past it, so the clamp doesn't read as the AI just being wrong.
  const estimateExceedsCap = !isPro && (planResult?.estimatedMinutes ?? 0) > capMinutes;
  const timerHint = isPro
    ? `Adjustable up to ${formatDuration(capMinutes)}`
    : estimateExceedsCap
      ? `This one runs longer than the free ${formatDuration(capMinutes)} limit — capped for now.`
      : `Free plan — sessions cap at ${formatDuration(capMinutes)}.`;

  const requestPlan = async () => {
    setState("thinking");
    try {
      const result = await plan({ taskText: taskText.trim() });
      setPlanResult(result);
      setShowFullPlan(true);
      // Seeded from the AI's own realistic estimate, then user-adjustable —
      // never a flat default.
      setFocusMinutes(Math.min(capMinutes, Math.max(MIN_FOCUS_MINUTES, result.estimatedMinutes)));
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
      nextStepMinutes: planResult.nextStepMinutes,
      remainingSteps: planResult.remainingSteps,
      remainingStepsMinutes: planResult.remainingStepsMinutes,
      focusMinutes,
    });
    router.replace(routes.focusSession(mission.id));
  };

  const totalSteps = planResult ? planResult.remainingSteps.length + 1 : 0;

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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultSection}>
              <Text style={styles.resultTitle}>{taskText}</Text>

              <StatCard>
                <Text style={styles.stepEyebrow}>Start with</Text>
                <Text style={styles.stepText}>{planResult.nextStep}</Text>
              </StatCard>

              <FocusTimerDial
                valueMinutes={focusMinutes}
                onChange={setFocusMinutes}
                maxMinutes={capMinutes}
                minMinutes={MIN_FOCUS_MINUTES}
                hint={timerHint}
                hintEmphasis={!isPro}
              />

              <View>
                <View style={styles.pathHeader}>
                  <Text style={styles.pathSummary}>
                    {totalSteps} {totalSteps === 1 ? "step" : "steps"} · about {planResult.estimatedMinutes} min
                  </Text>
                  {planResult.remainingSteps.length > 0 && (
                    <Pressable onPress={() => setShowFullPlan((prev) => !prev)} hitSlop={8}>
                      <Text style={styles.planToggle}>{showFullPlan ? "Hide path ‹" : "View path ›"}</Text>
                    </Pressable>
                  )}
                </View>

                {planResult.remainingSteps.length > 0 && showFullPlan && (
                  <MissionPathList steps={[planResult.nextStep, ...planResult.remainingSteps]} />
                )}
              </View>

              <View style={styles.companionLine}>
                <Companion state="mentioned" caption="Working alongside you for this one." />
              </View>
            </ScrollView>
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
      color: colors.textSecondary,
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
      paddingBottom: spacing.lg,
    },
    resultTitle: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    stepEyebrow: {
      color: colors.textSecondary,
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
    pathHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    pathSummary: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    planToggle: {
      color: colors.textSecondary,
      fontSize: 12,
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
