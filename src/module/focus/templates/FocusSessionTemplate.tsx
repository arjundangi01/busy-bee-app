import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { StatCard } from "@/components/content/StatCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useMission } from "@/module/missions/hooks/useMission";
import { useFocusSession } from "@/module/focus/hooks/useFocusSession";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";
import { SESSION_END_REASON, TASK_STATUS } from "@/utils/enums";

const HOLD_DURATION_MS = 1500;

type FocusSessionTemplateProps = {
  missionId: string;
};

const formatElapsed = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export function FocusSessionTemplate({ missionId }: FocusSessionTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { mission, completeTask, completingTaskId } = useMission(missionId);
  const { start, end } = useFocusSession();

  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepComplete, setStepComplete] = useState(false);
  const [exitOverlayOpen, setExitOverlayOpen] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);

  useEffect(() => {
    start(missionId).then((session) => setFocusSessionId(session.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTask = mission?.nextTask ?? null;
  const totalSteps = mission?.tasks.length ?? 0;

  const goToSessionComplete = (completedCount: number, distractionsBlocked: number) => {
    router.replace({
      pathname: "/mission/[id]/complete",
      params: {
        id: missionId,
        timeFocused: String(Math.round(elapsedSeconds / 60)),
        stepsCompleted: String(completedCount),
        totalSteps: String(totalSteps),
        distractionsBlocked: String(distractionsBlocked),
      },
    });
  };

  const handleDone = async () => {
    if (!currentTask || !focusSessionId) return;
    const updated = await completeTask(currentTask.id);
    const newStepsCompleted = stepsCompleted + 1;
    setStepsCompleted(newStepsCompleted);

    const nextPending = updated?.tasks.find((task) => task.status === TASK_STATUS.PENDING);
    if (nextPending) {
      setStepComplete(true);
      setTimeout(() => setStepComplete(false), 1200);
      return;
    }

    const session = await end({ focusSessionId, sessionEndReason: SESSION_END_REASON.MISSION_COMPLETED });
    goToSessionComplete(newStepsCompleted, session.blockedAttemptCount);
  };

  const handleEarlyExit = async () => {
    if (!focusSessionId) return;
    await end({ focusSessionId, sessionEndReason: SESSION_END_REASON.EARLY_EXIT });
    router.replace(routes.tabs.home());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.elapsed}>{formatElapsed(elapsedSeconds)} elapsed</Text>
      </View>

      <View style={styles.blockedBadge}>
        <Text style={styles.blockedBadgeLabel}>🔒 Distractions blocked</Text>
      </View>

      <View style={styles.body}>
        {stepComplete ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.stepCompleteWrap}>
            <Text style={styles.stepCompleteHeadline}>Done. That&apos;s one more in the bank.</Text>
            <Text style={styles.stepCompleteMeta}>
              Step {stepsCompleted} of {totalSteps} · backlog moving
            </Text>
          </Animated.View>
        ) : (
          currentTask && (
            <StatCard>
              <Text style={styles.stepEyebrow}>Doing</Text>
              <Text style={styles.stepText}>{currentTask.title}</Text>
            </StatCard>
          )
        )}

        <View style={styles.companionWrap}>
          <Companion state="at-work" caption="Working on it too — right alongside you." />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Done — next step"
          onPress={handleDone}
          loading={completingTaskId === currentTask?.id}
          disabled={!currentTask || stepComplete}
        />
        <Pressable onPress={() => setExitOverlayOpen(true)} hitSlop={8} style={styles.exitLink}>
          <Text style={styles.exitLinkText}>Exit session</Text>
        </Pressable>
      </View>

      {exitOverlayOpen && (
        <ExitConfirmOverlay
          onKeepGoing={() => setExitOverlayOpen(false)}
          onConfirmedExit={handleEarlyExit}
        />
      )}
    </SafeAreaView>
  );
}

type ExitConfirmOverlayProps = {
  onKeepGoing: () => void;
  onConfirmedExit: () => void;
};

function ExitConfirmOverlay({ onKeepGoing, onConfirmedExit }: ExitConfirmOverlayProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const fill = useSharedValue(0);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  const startHold = () => {
    fill.value = withTiming(1, { duration: HOLD_DURATION_MS }, (finished) => {
      if (finished) runOnJS(onConfirmedExit)();
    });
  };

  const cancelHold = () => {
    fill.value = withTiming(0, { duration: 150 });
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.overlayCard}>
        <Text style={styles.overlayQuestion}>Ending now stops the block early.</Text>
        <Text style={styles.overlaySubcopy}>
          Your streak isn&apos;t affected — this session just won&apos;t count toward today&apos;s backlog.
        </Text>

        <Pressable
          onPressIn={startHold}
          onPressOut={cancelHold}
          style={styles.holdControl}
          accessibilityRole="button"
          accessibilityLabel="Hold to end session"
          accessibilityHint="Press and hold for one and a half seconds to end the session early"
        >
          <Animated.View style={[styles.holdFill, fillStyle]} />
          <Text style={styles.holdLabel}>Hold to end session</Text>
        </Pressable>

        <PrimaryButton label="Keep going" onPress={onKeepGoing} />
      </View>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    elapsed: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
    },
    blockedBadge: {
      alignSelf: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: spacing.xxs,
      paddingHorizontal: spacing.sm,
      marginTop: spacing.md,
    },
    blockedBadgeLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      justifyContent: "center",
      gap: spacing.xl,
    },
    stepCompleteWrap: {
      alignItems: "center",
      gap: spacing.xs,
    },
    stepCompleteHeadline: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    stepCompleteMeta: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    stepEyebrow: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    stepText: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      marginTop: spacing.xxs,
    },
    companionWrap: {
      alignItems: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    exitLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    exitLinkText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxl,
    },
    overlayCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: spacing.xxl,
      gap: spacing.md,
    },
    overlayQuestion: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    overlaySubcopy: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
    },
    holdControl: {
      height: 52,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    holdFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.accentGlow,
    },
    holdLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
  });
