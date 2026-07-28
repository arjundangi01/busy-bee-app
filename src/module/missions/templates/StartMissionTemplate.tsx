import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useNavigation } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { FocusTimerDial, formatDuration } from "@/module/missions/components/FocusTimerDial";
import { IDraftStep, MissionPathList } from "@/module/missions/components/MissionPathList";
import { MinuteStepper } from "@/module/missions/components/MinuteStepper";
import { useCreateMission } from "@/module/missions/hooks/useCreateMission";
import { useMissionPlan } from "@/module/missions/hooks/useMissionPlan";
import { MISSION_ERROR_CODE } from "@/module/missions/utils/enums";
import { getMissionCapStatus } from "@/module/missions/utils/planLimits";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { routes } from "@/config/routes";
import { getErrorCode, getErrorMessage } from "@/lib/utils/errors";
import { IColorTokens, spacing, useColors } from "@/theme";

type FlowState = "input" | "thinking" | "ready" | "error";

const MIN_FOCUS_MINUTES = 5;
// Ceiling used when the caller's plan has no hard cap (Pro) — the picker
// still needs some usable upper bound even though the plan itself doesn't.
const UNCAPPED_MAX_MINUTES = 8 * 60;
const DEFAULT_NEW_STEP_MINUTES = 15;
const UNCAPPED_MAX_STEP_MINUTES = 8 * 60;

export function StartMissionTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [state, setState] = useState<FlowState>("input");
  const [taskText, setTaskText] = useState("");
  const [steps, setSteps] = useState<IDraftStep[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(MIN_FOCUS_MINUTES);
  const [startError, setStartError] = useState<string | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepMinutes, setNewStepMinutes] = useState(DEFAULT_NEW_STEP_MINUTES);
  // Holds whatever navigation action (back button, hardware back, swipe-
  // back gesture) tried to leave this screen while there was a plan worth
  // losing — non-null means "show the confirm dialog." Typed as unknown
  // rather than importing @react-navigation/native's NavigationAction type
  // directly, since that package isn't a declared dependency of this app;
  // it's only ever replayed verbatim via navigation.dispatch, never
  // inspected.
  const [pendingLeaveAction, setPendingLeaveAction] = useState<unknown>(null);
  const nextStepIdRef = useRef(0);

  const navigation = useNavigation();
  const { plan, error: planError } = useMissionPlan();
  const { create, isLoading: isCreating, addExtraTask, finalizeOrder } = useCreateMission();
  const { isPro, limits } = useEntitlement();

  const capMinutes =
    limits.sessionDurationCapSeconds !== null
      ? Math.floor(limits.sessionDurationCapSeconds / 60)
      : UNCAPPED_MAX_MINUTES;

  const totalStepMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);

  // Free plan's cap is worth surfacing on its own, not just implied by the
  // dial's max — and needs its own copy when a task's real estimate ran
  // past it, so the clamp doesn't read as the AI just being wrong.
  const estimateExceedsCap = !isPro && totalStepMinutes > capMinutes;
  const timerHint = isPro
    ? `Adjustable up to ${formatDuration(capMinutes)}`
    : estimateExceedsCap
      ? `This one runs longer than the free ${formatDuration(capMinutes)} limit — capped for now.`
      : `Free plan — sessions cap at ${formatDuration(capMinutes)}.`;

  const { isAtTaskCap, isAtCap, remainingMinutesBudget } = getMissionCapStatus(
    steps.length,
    totalStepMinutes,
    limits,
    isPro,
  );
  const addStepMax = isPro ? UNCAPPED_MAX_STEP_MINUTES : Math.max(5, remainingMinutesBudget ?? UNCAPPED_MAX_STEP_MINUTES);

  // Intercepts every way this screen can be left — the header back button
  // (it calls router.back(), which dispatches the same GO_BACK action),
  // Android's hardware back, and iOS's swipe-back gesture all go through
  // this one event, so one listener covers all three. Only fires once a
  // plan exists (state "input" has nothing to lose yet).
  //
  // handleStart's own router.replace() into the focus session fires this
  // exact same event — that's a real, intentional forward navigation on
  // success, not a "leave" to confirm, so it sets skipLeaveConfirmRef right
  // before navigating to let that one removal through untouched.
  const skipLeaveConfirmRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      if (steps.length === 0 || skipLeaveConfirmRef.current) return;
      event.preventDefault();
      setPendingLeaveAction(event.data.action);
    });
    return unsubscribe;
  }, [navigation, steps.length]);

  const confirmLeave = () => {
    if (pendingLeaveAction) {
      navigation.dispatch(pendingLeaveAction as Parameters<typeof navigation.dispatch>[0]);
    }
    setPendingLeaveAction(null);
  };

  const cancelLeave = () => setPendingLeaveAction(null);

  const makeStepId = () => {
    nextStepIdRef.current += 1;
    return `draft-${nextStepIdRef.current}`;
  };

  const requestPlan = async () => {
    setState("thinking");
    try {
      const result = await plan({ taskText: taskText.trim() });
      const initialSteps: IDraftStep[] = [
        { id: makeStepId(), title: result.nextStep, minutes: result.nextStepMinutes, isAiGenerated: true },
        ...result.remainingSteps.map((title, index) => ({
          id: makeStepId(),
          title,
          minutes: result.remainingStepsMinutes[index],
          isAiGenerated: true,
        })),
      ];
      setSteps(initialSteps);
      setIsAddingStep(false);
      setStartError(null);
      // Seeded from the AI's own realistic estimate, then user-adjustable —
      // never a flat default.
      setFocusMinutes(Math.min(capMinutes, Math.max(MIN_FOCUS_MINUTES, result.estimatedMinutes)));
      setState("ready");
    } catch {
      setState("error");
    }
  };

  const goToTaskLimitPaywall = (reason: "count" | "time") => {
    router.push({
      pathname: "/paywall",
      params: { entry: PAYWALL_ENTRY.MISSION_TASK_LIMIT, reason },
    });
  };

  const renameStep = (index: number, title: string) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, title } : step)));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const openAddStep = () => {
    if (isAtCap) {
      goToTaskLimitPaywall(isAtTaskCap ? "count" : "time");
      return;
    }
    setNewStepTitle("");
    setNewStepMinutes(Math.min(DEFAULT_NEW_STEP_MINUTES, addStepMax));
    setIsAddingStep(true);
  };

  const confirmAddStep = () => {
    const title = newStepTitle.trim();
    if (title.length === 0) return;
    setSteps((prev) => [...prev, { id: makeStepId(), title, minutes: newStepMinutes, isAiGenerated: false }]);
    setIsAddingStep(false);
    setNewStepTitle("");
  };

  const handleStart = async () => {
    if (steps.length === 0) return;
    setStartError(null);

    const aiSteps = steps.filter((step) => step.isAiGenerated);
    const userSteps = steps.filter((step) => !step.isAiGenerated);

    try {
      const mission = await create({
        taskText: taskText.trim(),
        nextStep: aiSteps[0].title,
        nextStepMinutes: aiSteps[0].minutes,
        remainingSteps: aiSteps.slice(1).map((step) => step.title),
        remainingStepsMinutes: aiSteps.slice(1).map((step) => step.minutes),
        focusMinutes,
      });

      const persistedIdByDraftId = new Map<string, string>();
      aiSteps.forEach((step, index) => persistedIdByDraftId.set(step.id, mission.tasks[index].id));

      let latestMission = mission;
      for (const step of userSteps) {
        latestMission = await addExtraTask({ missionId: mission.id, title: step.title, estimatedMinutes: step.minutes });
        persistedIdByDraftId.set(step.id, latestMission.tasks[latestMission.tasks.length - 1].id);
      }

      // Only needed if a user-added step ended up somewhere other than
      // "appended at the end" — reordering among only-AI steps is already
      // reflected correctly by aiSteps' own order above.
      if (userSteps.length > 0) {
        await finalizeOrder({
          missionId: mission.id,
          taskIds: steps.map((step) => persistedIdByDraftId.get(step.id)!),
        });
      }

      skipLeaveConfirmRef.current = true;
      router.replace(routes.focusSession(mission.id));
    } catch (error) {
      const code = getErrorCode(error);
      if (code === MISSION_ERROR_CODE.TASK_LIMIT_REACHED) {
        goToTaskLimitPaywall("count");
        return;
      }
      if (code === MISSION_ERROR_CODE.TIME_BUDGET_EXCEEDED) {
        goToTaskLimitPaywall("time");
        return;
      }
      setStartError(getErrorMessage(error));
    }
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

          {state === "ready" && steps.length > 0 && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultSection}>
              <Text style={styles.resultTitle}>{taskText}</Text>

              <StatCard>
                <Text style={styles.stepEyebrow}>Start with</Text>
                <Text style={styles.stepText}>{steps[0].title}</Text>
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
                <Text style={styles.pathSummary}>
                  {steps.length} {steps.length === 1 ? "step" : "steps"} · about {totalStepMinutes} min
                </Text>

                <MissionPathList steps={steps} onRename={renameStep} onMoveUp={(i) => moveStep(i, -1)} onMoveDown={(i) => moveStep(i, 1)} />

                {isAddingStep ? (
                  <View style={styles.addForm}>
                    <TextInput
                      value={newStepTitle}
                      onChangeText={setNewStepTitle}
                      placeholder="What's the next step?"
                      placeholderTextColor={colors.textFaint}
                      style={styles.addInput}
                      autoFocus
                    />
                    <View style={styles.addFormRow}>
                      <MinuteStepper valueMinutes={newStepMinutes} onChange={setNewStepMinutes} maxMinutes={addStepMax} />
                      <View style={styles.addFormActions}>
                        <Pressable onPress={() => setIsAddingStep(false)} hitSlop={8} style={styles.addCancel}>
                          <Text style={styles.addCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={confirmAddStep}
                          disabled={newStepTitle.trim().length === 0}
                          hitSlop={8}
                          style={[styles.addConfirm, newStepTitle.trim().length === 0 && styles.addConfirmDisabled]}
                        >
                          <Text style={styles.addConfirmText}>Add</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={openAddStep}
                    style={[styles.addStepRow, isAtCap && styles.addStepRowLocked]}
                    accessibilityRole="button"
                    accessibilityLabel={isAtCap ? "Add step — upgrade to Pro" : "Add step"}
                  >
                    <Text style={[styles.addStepText, isAtCap && styles.addStepTextLocked]}>
                      {isAtCap ? "🔒 Add Step — Upgrade to Pro" : "+ Add step"}
                    </Text>
                  </Pressable>
                )}
              </View>

              {startError && <Text style={styles.errorDetail}>{startError}</Text>}

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

      <ConfirmDialog
        visible={pendingLeaveAction !== null}
        title="Leave without finishing?"
        body="You'll lose this plan and any changes you made to it."
        confirmLabel="Leave"
        cancelLabel="Keep Editing"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
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
    pathSummary: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    addForm: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    addInput: {
      color: colors.text,
      fontSize: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    addFormRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    addFormActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    addCancel: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    addCancelText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    addConfirm: {
      backgroundColor: colors.invertFill,
      borderRadius: 999,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      minWidth: 56,
      alignItems: "center",
    },
    addConfirmDisabled: {
      opacity: 0.4,
    },
    addConfirmText: {
      color: colors.invertText,
      fontSize: 13,
      fontWeight: "700",
    },
    addStepRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 16,
      paddingVertical: spacing.sm,
      alignItems: "center",
      marginTop: spacing.xs,
    },
    addStepRowLocked: {
      borderColor: colors.warning,
      borderStyle: "solid",
      backgroundColor: colors.warningGlow,
    },
    addStepText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    addStepTextLocked: {
      color: colors.warning,
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
