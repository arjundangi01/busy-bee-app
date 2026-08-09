import { HIVE_HUD as HUD } from "@/components/content/companion/hiveHud";
import { WorkTypeScene } from "@/components/content/companion/WorkTypeScene";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { routes } from "@/config/routes";
import { getErrorCode, getErrorMessage } from "@/lib/utils/errors";
import { useBlockingEnforcement } from "@/module/focus/hooks/useBlockingEnforcement";
import {
  fetchActiveFocusSession,
  useFocusSession,
} from "@/module/focus/hooks/useFocusSession";
import { useWorkTypes } from "@/module/focus/hooks/useWorkTypes";
import { FOCUS_SESSION_ERROR_CODE } from "@/module/focus/utils/enums";
import { computeCurrentWorkUnit, getEffectiveDurationCapSeconds } from "@/module/focus/utils/workProgress";
import { useBeeSkins } from "@/module/hive/hooks/useBeeSkins";
import { useHiveThemes } from "@/module/hive/hooks/useHiveThemes";
import { useMission } from "@/module/missions/hooks/useMission";
import { useBlocklist } from "@/module/settings/hooks/useBlocklist";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import { SESSION_END_REASON, TASK_STATUS } from "@/utils/enums";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

const HOLD_DURATION_MS = 1500;

type FocusSessionTemplateProps = {
  missionId: string;
  // Fired once the screen has something real to show — either the scene's
  // work-type data resolved, or the session failed to start at all (nothing
  // left to preload for the error view). HiveEntryReveal holds its cloud
  // reveal open-ish until this fires, so it never uncovers an empty
  // background that then pops the real scene in afterward.
  onSceneReady?: () => void;
};

const formatElapsed = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export function FocusSessionTemplate({
  missionId,
  onSceneReady,
}: FocusSessionTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { mission, completeTask, completingTaskId } = useMission(missionId);
  const { start, end } = useFocusSession();
  const { limits } = useEntitlement();
  const { blockedApps } = useBlocklist();
  const { workTypes } = useWorkTypes();
  const { beeSkins } = useBeeSkins();
  const { hiveThemes } = useHiveThemes();
  const { user } = useAuthStore();
  const selectedSkin =
    beeSkins.find((skin) => skin.id === user?.selectedSkinId) ?? null;
  const selectedTheme =
    hiveThemes.find((theme) => theme.id === user?.selectedThemeId) ?? null;
  // The mission's own chosen focus duration (set on the plan-ready screen),
  // clamped by whatever the caller's plan still allows — not just the raw
  // plan cap, so the countdown (and the hive's fill pacing below) reflects
  // the duration actually picked for this mission, not always the ceiling.
  const missionDurationSeconds = mission?.estimatedMinutes != null ? mission.estimatedMinutes * 60 : null;
  const sessionDurationCapSeconds = getEffectiveDurationCapSeconds(
    limits.sessionDurationCapSeconds,
    missionDurationSeconds,
  );

  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [focusSessionExpiresAt, setFocusSessionExpiresAt] = useState<string | null>(null);
  const [sessionWorkTypeId, setSessionWorkTypeId] = useState<string | null>(
    null,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepComplete, setStepComplete] = useState(false);
  const [exitOverlayOpen, setExitOverlayOpen] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);
  const timeLimitHandledRef = useRef(false);
  const sceneReadyHandledRef = useRef(false);

  const currentTask = mission?.nextTask ?? null;
  const totalSteps = mission?.tasks.length ?? 0;

  // The session's own server-assigned work type (not re-derived from user
  // prefs client-side) — single source of truth, set once start() resolves.
  const sessionWorkType =
    workTypes.find((workType) => workType.id === sessionWorkTypeId) ?? null;
  const currentWorkUnit = sessionWorkType
    ? computeCurrentWorkUnit(elapsedSeconds, sessionWorkType.totalUnits, sessionDurationCapSeconds)
    : 0;

  const { isEnforcementActive, isDistracted } = useBlockingEnforcement({
    focusSessionId,
    missionId,
    blockedPackageNames: blockedApps.map((app) => app.packageName),
    currentStepText: currentTask?.title ?? "",
    currentWorkUnit,
    expiresAt: focusSessionExpiresAt,
  });

  useEffect(() => {
    start(missionId)
      .then((session) => {
        setFocusSessionId(session.id);
        setFocusSessionExpiresAt(session.expiredAt);
        setSessionWorkTypeId(session.workTypeId);
        // Seed from the server's startedAt rather than assuming 0 — matters
        // when adopting an already-running session (see SESSION_ALREADY_ACTIVE
        // below), and is simply more correct for a fresh session too.
        setElapsedSeconds(
          Math.max(
            0,
            Math.round(
              (Date.now() - new Date(session.startedAt).getTime()) / 1000,
            ),
          ),
        );
      })
      .catch(async (error) => {
        const code = getErrorCode(error);

        if (code === FOCUS_SESSION_ERROR_CODE.SESSION_ALREADY_ACTIVE) {
          let active;
          try {
            active = await fetchActiveFocusSession();
          } catch {
            // Backend unreachable right when we need it most: there IS a
            // session (the SESSION_ALREADY_ACTIVE we just caught proves
            // it), we just can't fetch its details to resume the screen
            // properly. Don't strand the user on a dead-end error with no
            // way to reach Exit — BlockingEnforcement.clearActiveSession()
            // needs no session id, so a bare exit control still works even
            // without focusSessionId ever getting set. See
            // handleEarlyExit's own fallback for the other half of this.
            setStartError(
              "Couldn't reach the server to resume your session — you can still exit below.",
            );
            return;
          }
          if (active && active.missionId !== missionId) {
            // The active session belongs to a different mission — send the
            // user to that screen instead of grafting foreign state in here.
            router.replace(routes.focusSession(active.missionId));
            return;
          }
          if (active) {
            setFocusSessionId(active.id);
            setFocusSessionExpiresAt(active.expiredAt);
            setSessionWorkTypeId(active.workTypeId);
            setElapsedSeconds(
              Math.max(
                0,
                Math.round(
                  (Date.now() - new Date(active.startedAt).getTime()) / 1000,
                ),
              ),
            );
            return;
          }
          // The active session ended between the failed start() and this
          // lookup — the original "already active" message would be wrong
          // to show here, since there's no longer an active session at all.
          setStartError("Your session state changed — try starting again.");
          return;
        }

        if (code === FOCUS_SESSION_ERROR_CODE.SESSION_CAP_REACHED) {
          // Tapping Start is a fresh, deliberate action each time — always
          // show the paywall rather than remembering an earlier dismissal.
          router.replace({
            pathname: "/paywall",
            params: { entry: PAYWALL_ENTRY.SESSION_CAP, missionId },
          });
          return;
        }

        setStartError(getErrorMessage(error));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  useEffect(() => {
    if (startError) return;
    const interval = setInterval(
      () => setElapsedSeconds((prev) => prev + 1),
      1000,
    );
    return () => clearInterval(interval);
  }, [startError]);

  useEffect(() => {
    // sessionDurationCapSeconds is null for both Pro (genuinely unlimited)
    // and the brief window before entitlement data loads — either way there's
    // nothing to enforce yet, and real elapsed time never approaches a real
    // cap within that short loading window.
    if (
      sessionDurationCapSeconds === null ||
      !focusSessionId ||
      timeLimitHandledRef.current
    )
      return;
    if (elapsedSeconds < sessionDurationCapSeconds) return;

    timeLimitHandledRef.current = true;
    // The device-local unblock must never depend on this call succeeding —
    // see docs/session-lifecycle-reliability-fixes.md item 5. A failed
    // end() here still gets reconciled later by the backend's own
    // expiredAt/cron backstop once connectivity returns.
    end({
      focusSessionId,
      sessionEndReason: SESSION_END_REASON.TIME_LIMIT_REACHED,
    })
      .catch(() => {})
      .finally(() => {
        BlockingEnforcement.clearActiveSession();
        router.replace({
          pathname: "/paywall",
          params: { entry: PAYWALL_ENTRY.SESSION_TIME_LIMIT },
        });
      });
  }, [sessionDurationCapSeconds, focusSessionId, elapsedSeconds, end]);

  useEffect(() => {
    if (sceneReadyHandledRef.current) return;
    if (startError || sessionWorkType) {
      sceneReadyHandledRef.current = true;
      onSceneReady?.();
    }
  }, [startError, sessionWorkType, onSceneReady]);

  const goToSessionComplete = (
    completedCount: number,
    distractionsBlocked: number,
  ) => {
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

    const nextPending = updated?.tasks.find(
      (task) => task.status === TASK_STATUS.PENDING,
    );
    if (nextPending) {
      setStepComplete(true);
      setTimeout(() => setStepComplete(false), 1200);
      return;
    }

    // Same local-first shape as the auto-end effect above: the backend call
    // is best-effort, the device unblock is not gated on it succeeding.
    let session = null;
    try {
      session = await end({
        focusSessionId,
        sessionEndReason: SESSION_END_REASON.MISSION_COMPLETED,
      });
    } catch {
      // Real blockedAttemptCount is still safely recorded server-side and
      // will be reconciled by the cron backstop — this only degrades the
      // number shown on the very next screen.
    }
    BlockingEnforcement.clearActiveSession();
    goToSessionComplete(newStepsCompleted, session?.blockedAttemptCount ?? 0);
  };

  const handleEarlyExit = async () => {
    // No hard `if (!focusSessionId) return` bail here on purpose: if the
    // backend was unreachable when resuming an already-active session (see
    // the SESSION_ALREADY_ACTIVE catch above), focusSessionId can be null
    // even though a real session — and real device blocking — exists. This
    // is the last-resort escape: clear native blocking and leave, skipping
    // only the backend call we have no session id to make anyway.
    try {
      if (focusSessionId) {
        await end({
          focusSessionId,
          sessionEndReason: SESSION_END_REASON.EARLY_EXIT,
        });
      }
    } catch {
      // Best-effort — see docs/session-lifecycle-reliability-fixes.md item 5.
    }
    BlockingEnforcement.clearActiveSession();
    router.replace(routes.tabs.home());
  };

  if (startError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.startErrorWrap}>
          <Text style={styles.startErrorText}>{startError}</Text>
          <PrimaryButton
            label="Back to Home"
            // Always clears native blocking, whether or not one was
            // actually active — a harmless no-op in the common case, and
            // the only reachable escape when a session exists (proven by
            // SESSION_ALREADY_ACTIVE) but its details couldn't be fetched
            // to reach the normal Exit control. See
            // docs/session-lifecycle-reliability-fixes.md item 5.
            onPress={() => {
              BlockingEnforcement.clearActiveSession();
              router.replace(routes.tabs.home());
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Same copy as before this cycle — only its container moved, from plain
  // stacked chrome into the HUD companion card below.
  const companionCaption = isDistracted
    ? "Bee stopped working — that pulled focus."
    : sessionWorkType
      ? `Filling in ${sessionWorkType.label.toLowerCase()} — right alongside you.`
      : "Working on it too — right alongside you.";

  const progressPercent = sessionWorkType
    ? Math.min((currentWorkUnit / sessionWorkType.totalUnits) * 100, 100)
    : 0;

  return (
    <View style={styles.root}>
      {sessionWorkType && (
        <View style={StyleSheet.absoluteFill}>
          <WorkTypeScene
            workTypeKey={sessionWorkType.key}
            currentUnit={currentWorkUnit}
            totalUnits={sessionWorkType.totalUnits}
            reacting={isDistracted}
            skin={selectedSkin ?? undefined}
            theme={selectedTheme ?? undefined}
          />
        </View>
      )}

      <SafeAreaView
        style={styles.hudSafeArea}
        edges={["top", "bottom"]}
        pointerEvents="box-none"
      >
        <View pointerEvents="box-none">
          <View style={styles.hudTopRow}>
            <View style={styles.hudStatusRow} pointerEvents="box-none">
              <View
                style={[
                  styles.hudStatusPill,
                  isDistracted
                    ? styles.hudStatusPillWarning
                    : styles.hudStatusPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.hudStatusText,
                    isDistracted && styles.hudStatusTextWarning,
                  ]}
                >
                  {isDistracted
                    ? "⚠️ Focus interrupted"
                    : "🔒 Distractions blocked"}
                </Text>
              </View>
            </View>

            {!isEnforcementActive && (
              <Pressable
                onPress={() => BlockingEnforcement.openAccessibilitySettings()}
                style={styles.hudEnforcementWarningRow}
              >
                <Text style={styles.hudEnforcementWarningText}>
                  Blocking permission is off — tap to turn it back on
                </Text>
              </Pressable>
            )}

            <View style={styles.hudTimerRow} pointerEvents="box-none">
              <View style={styles.hudTimerCard}>
                <Text style={styles.hudTimerEyebrow}>
                  {sessionDurationCapSeconds === null
                    ? "Time elapsed"
                    : "Time remaining"}
                </Text>
                <Text style={styles.hudTimerValue}>
                  {sessionDurationCapSeconds === null
                    ? formatElapsed(elapsedSeconds)
                    : formatElapsed(
                        Math.max(sessionDurationCapSeconds - elapsedSeconds, 0),
                      )}
                </Text>
              </View>
            </View>
          </View>

          {stepComplete ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[styles.hudPill, styles.hudTaskPill]}
            >
              <Text style={styles.hudTaskHeadline}>
                Done. That&apos;s one more in the bank.
              </Text>
              <Text style={styles.hudTaskMeta}>
                Step {stepsCompleted} of {totalSteps} · backlog moving
              </Text>
            </Animated.View>
          ) : (
            currentTask && (
              <View style={[styles.hudPill, styles.hudTaskPill]}>
                <Text style={styles.hudEyebrow}>You Doing</Text>
                <Text style={styles.hudTaskText}>{currentTask.title}</Text>
                {totalSteps > 0 && (
                  <View style={styles.hudTaskProgressRow}>
                    <View style={styles.hudTaskProgressTrack}>
                      <View
                        style={[
                          styles.hudTaskProgressFill,
                          { width: `${(stepsCompleted / totalSteps) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.hudTaskProgressLabel}>
                      Step {stepsCompleted + 1} of {totalSteps}
                    </Text>
                  </View>
                )}
              </View>
            )
          )}

          {sessionWorkType && (
            <View style={styles.hudSign}>
              <Text style={styles.hudSignLabel}>
                Building {sessionWorkType.label} — {currentWorkUnit} of{" "}
                {sessionWorkType.totalUnits} cells
              </Text>
              <View style={styles.hudSignBarTrack}>
                <View
                  style={[
                    styles.hudSignBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <View pointerEvents="box-none">
          <View style={styles.hudCompanionRow} pointerEvents="box-none">
            <View style={styles.hudCompanionCard}>
              <CompanionAvatar />
              <View style={styles.hudCompanionTextWrap}>
                <Text style={styles.hudCompanionName}>Bee</Text>
                <Text style={styles.hudCompanionLine}>{companionCaption}</Text>
              </View>
            </View>
          </View>

          <View style={styles.hudFooter}>
            <PrimaryButton
              label="Done — next step"
              onPress={handleDone}
              loading={completingTaskId === currentTask?.id}
              disabled={!currentTask || stepComplete}
            />
            <Pressable
              onPress={() => setExitOverlayOpen(true)}
              hitSlop={8}
              style={styles.exitLink}
            >
              <Text style={styles.hudExitLinkText}>Exit session</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {exitOverlayOpen && (
        <ExitConfirmOverlay
          onKeepGoing={() => setExitOverlayOpen(false)}
          onConfirmedExit={handleEarlyExit}
        />
      )}
    </View>
  );
}

// A small fixed face, matching the sketch's HUD companion avatar — not
// theme-reactive, same fixed-palette exception as the rest of the scene.
function CompanionAvatar() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30">
      <Circle cx={15} cy={15} r={15} fill="#f0a83f" />
      <Circle cx={11} cy={14} r={1.8} fill="#3a2410" />
      <Circle cx={19} cy={14} r={1.8} fill="#3a2410" />
      <Path
        d="M11 19 Q15 22 19 19"
        stroke="#7a4a1a"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type ExitConfirmOverlayProps = {
  onKeepGoing: () => void;
  onConfirmedExit: () => void;
};

function ExitConfirmOverlay({
  onKeepGoing,
  onConfirmedExit,
}: ExitConfirmOverlayProps) {
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
        <Text style={styles.overlayQuestion}>
          Ending now stops the block early.
        </Text>
        <Text style={styles.overlaySubcopy}>
          Your streak isn&apos;t affected — this session just won&apos;t count
          toward today&apos;s backlog.
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
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    hudTopRow: {
      width: "100%",
      gap: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    startErrorWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      paddingHorizontal: spacing.xxl,
    },
    startErrorText: {
      color: colors.danger,
      fontSize: 15,
      textAlign: "center",
    },
    hudSafeArea: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    hudPill: {
      backgroundColor: HUD.pillBg,
      borderWidth: 1,
      borderColor: HUD.pillBorder,
      borderRadius: 14,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    hudTimerRow: {
      alignItems: "flex-end",
    },
    // Bigger and more structured than the other HUD pills — same "eyebrow +
    // one large line" shape as this design system's own Step/Stat Card
    // pattern (see D-Design-System/components/content/02-step-stat-card.md),
    // rather than a small inline pill that's easy to lose against the scene.
    hudTimerCard: {
      backgroundColor: HUD.pillBg,
      borderWidth: 1,
      borderColor: HUD.pillBorder,
      borderRadius: 16,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      alignItems: "flex-end",
      minWidth: 132,
    },
    hudTimerEyebrow: {
      color: HUD.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    hudTimerValue: {
      color: HUD.text,
      fontSize: 24,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      marginTop: 1,
    },
    hudTaskPill: {
      marginTop: spacing.xs,
    },
    hudEyebrow: {
      color: HUD.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    hudTaskText: {
      color: HUD.text,
      fontSize: 10,
      fontWeight: "600",
    },
    // Your own progress, shown the same way the bee's build progress is
    // (label + thin fill bar, same track/fill colors) — so "what you're
    // doing" reads as forward motion, not just a static label.
    hudTaskProgressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    hudTaskProgressTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: HUD.barTrack,
      overflow: "hidden",
    },
    hudTaskProgressFill: {
      height: "100%",
      backgroundColor: HUD.barFill,
      borderRadius: 3,
    },
    hudTaskProgressLabel: {
      color: HUD.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    },
    hudTaskHeadline: {
      color: HUD.text,
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    hudTaskMeta: {
      color: HUD.textSecondary,
      fontSize: 12,
      textAlign: "center",
      marginTop: 2,
    },
    hudSign: {
      alignSelf: "center",
      marginTop: spacing.sm,
      minWidth: 190,
      backgroundColor: HUD.signBg,
      borderWidth: 2,
      borderColor: HUD.signBorder,
      borderRadius: 10,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    hudSignLabel: {
      color: HUD.text,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    hudSignBarTrack: {
      marginTop: spacing.xxs,
      height: 8,
      borderRadius: 5,
      backgroundColor: HUD.barTrack,
      overflow: "hidden",
    },
    hudSignBarFill: {
      height: "100%",
      backgroundColor: HUD.barFill,
      borderRadius: 5,
    },
    hudStatusRow: {
      alignItems: "flex-end",
    },
    hudStatusPill: {
      borderRadius: 999,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderWidth: 1.5,
    },
    // Deliberately more confident than a plain neutral pill — this is the
    // one status the user needs to trust is genuinely on, so it gets a
    // solid gold-tinted fill/border (the same accent used for the bee's own
    // build-progress fill) rather than blending in with every other pill.
    hudStatusPillActive: {
      backgroundColor: "rgba(240,168,63,0.28)",
      borderColor: HUD.barFill,
    },
    hudStatusPillWarning: {
      backgroundColor: "rgba(255,207,138,0.18)",
      borderColor: HUD.warning,
    },
    hudStatusText: {
      color: HUD.text,
      fontSize: 11,
      fontWeight: "700",
    },
    hudStatusTextWarning: {
      color: HUD.warning,
    },
    hudEnforcementWarningRow: {
      alignSelf: "flex-end",
      marginTop: spacing.xxs,
    },
    hudEnforcementWarningText: {
      color: HUD.warning,
      fontSize: 11,
      textDecorationLine: "underline",
    },
    hudCompanionRow: {
      marginTop: spacing.sm,
      alignItems: "flex-start",
    },
    hudCompanionCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: HUD.pillBg,
      borderWidth: 1,
      borderColor: HUD.pillBorder,
      borderRadius: 14,
      paddingVertical: spacing.xxs,
      paddingHorizontal: spacing.xxs,
      paddingRight: spacing.sm,
      maxWidth: 230,
    },
    hudCompanionTextWrap: {
      flexShrink: 1,
    },
    hudCompanionName: {
      color: HUD.text,
      fontSize: 11,
      fontWeight: "700",
    },
    hudCompanionLine: {
      color: HUD.textSecondary,
      fontSize: 10,
      marginTop: 1,
    },
    hudFooter: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    exitLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    hudExitLinkText: {
      color: HUD.textSecondary,
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
