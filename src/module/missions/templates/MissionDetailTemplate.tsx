import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BackButton } from "@/components/ui/BackButton";
import { formatDuration } from "@/module/missions/components/FocusTimerDial";
import { MinuteStepper } from "@/module/missions/components/MinuteStepper";
import { TaskRow } from "@/module/missions/components/TaskRow";
import { useMission } from "@/module/missions/hooks/useMission";
import { MISSION_ERROR_CODE } from "@/module/missions/utils/enums";
import { getMissionCapStatus } from "@/module/missions/utils/planLimits";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { getErrorCode, getErrorMessage } from "@/lib/utils/errors";
import { IColorTokens, spacing, useColors } from "@/theme";

type MissionDetailTemplateProps = {
  missionId: string;
};

const DEFAULT_NEW_TASK_MINUTES = 15;
// Plain UI ceiling for Pro (no real cap) — mirrors StartMissionTemplate's
// own UNCAPPED_MAX_MINUTES reasoning: the stepper still needs *a* usable
// upper bound even though nothing enforces it for Pro.
const UNCAPPED_MAX_TASK_MINUTES = 8 * 60;

export function MissionDetailTemplate({ missionId }: MissionDetailTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { isPro, limits } = useEntitlement();
  const {
    mission,
    isLoading,
    error,
    completeTask,
    completingTaskId,
    addTask,
    isAddingTask,
    editTaskTitle,
    savingTaskId,
    reorderTasks,
    isReordering,
  } = useMission(missionId);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMinutes, setNewTaskMinutes] = useState(DEFAULT_NEW_TASK_MINUTES);
  const [addError, setAddError] = useState<string | null>(null);

  const totalMinutesUsed = mission?.tasks.reduce((sum, task) => sum + (task.estimatedMinutes ?? 0), 0) ?? 0;
  const { isAtTaskCap, isAtCap, remainingMinutesBudget } = getMissionCapStatus(
    mission?.tasks.length ?? 0,
    totalMinutesUsed,
    limits,
    isPro,
  );
  const stepperMax = isPro ? UNCAPPED_MAX_TASK_MINUTES : Math.max(5, remainingMinutesBudget ?? UNCAPPED_MAX_TASK_MINUTES);
  const isLocked = mission?.hasActiveSession ?? false;

  const goToTaskLimitPaywall = (reason: "count" | "time") => {
    router.push({
      pathname: "/paywall",
      params: { entry: PAYWALL_ENTRY.MISSION_TASK_LIMIT, missionId, reason },
    });
  };

  const openAddTask = () => {
    if (isAtCap) {
      goToTaskLimitPaywall(isAtTaskCap ? "count" : "time");
      return;
    }
    setNewTaskTitle("");
    setNewTaskMinutes(Math.min(DEFAULT_NEW_TASK_MINUTES, stepperMax));
    setAddError(null);
    setIsAdding(true);
  };

  const confirmAddTask = async () => {
    const title = newTaskTitle.trim();
    if (title.length === 0) return;

    try {
      await addTask({ title, estimatedMinutes: newTaskMinutes });
      setIsAdding(false);
      setNewTaskTitle("");
    } catch (addTaskError) {
      const code = getErrorCode(addTaskError);
      if (code === MISSION_ERROR_CODE.TASK_LIMIT_REACHED) {
        goToTaskLimitPaywall("count");
        return;
      }
      if (code === MISSION_ERROR_CODE.TIME_BUDGET_EXCEEDED) {
        goToTaskLimitPaywall("time");
        return;
      }
      setAddError(getErrorMessage(addTaskError));
    }
  };

  const moveTask = (index: number, direction: -1 | 1) => {
    if (!mission) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mission.tasks.length) return;

    const taskIds = mission.tasks.map((task) => task.id);
    [taskIds[index], taskIds[newIndex]] = [taskIds[newIndex], taskIds[index]];
    reorderTasks(taskIds);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      {isLoading && !mission && <ActivityIndicator color={colors.text} style={styles.spinner} />}

      {error && !mission && <Text style={styles.error}>{error}</Text>}

      {mission && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.subtitle}>
            {mission.progressPercent}% complete
            {mission.estimatedMinutes !== null ? ` · ${mission.estimatedMinutes} min focus session` : ""}
          </Text>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${mission.progressPercent}%` }]} />
          </View>

          {!isPro && (limits.maxTasksPerMission !== null || limits.maxMissionMinutes !== null) && (
            <View style={[styles.budgetRow, isAtCap && styles.budgetRowAtCap]}>
              <Text style={[styles.budgetText, isAtCap && styles.budgetTextAtCap]}>
                {limits.maxTasksPerMission !== null
                  ? `${mission.tasks.length} of ${limits.maxTasksPerMission} tasks`
                  : `${mission.tasks.length} tasks`}
                {limits.maxMissionMinutes !== null
                  ? ` · ${formatDuration(totalMinutesUsed)} of ${formatDuration(limits.maxMissionMinutes)} used`
                  : ""}
              </Text>
            </View>
          )}

          <View style={styles.tasks}>
            {mission.tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                isCompleting={completingTaskId === task.id}
                onComplete={() => completeTask(task.id)}
                isSaving={savingTaskId === task.id}
                onRename={(title) => editTaskTitle({ taskId: task.id, title })}
                canMoveUp={index > 0}
                canMoveDown={index < mission.tasks.length - 1}
                onMoveUp={() => moveTask(index, -1)}
                onMoveDown={() => moveTask(index, 1)}
                isLocked={isLocked}
              />
            ))}
          </View>

          {isReordering && <Text style={styles.reorderingHint}>Saving new order…</Text>}

          {isLocked ? (
            <View style={styles.addTaskRow}>
              <Text style={styles.addTaskText}>Editing is locked while a focus session is in progress</Text>
            </View>
          ) : isAdding ? (
            <View style={styles.addForm}>
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="What's the next step?"
                placeholderTextColor={colors.textFaint}
                style={styles.addInput}
                autoFocus
              />
              <View style={styles.addFormRow}>
                <MinuteStepper valueMinutes={newTaskMinutes} onChange={setNewTaskMinutes} maxMinutes={stepperMax} />
                <View style={styles.addFormActions}>
                  <Pressable onPress={() => setIsAdding(false)} hitSlop={8} style={styles.addCancel}>
                    <Text style={styles.addCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmAddTask}
                    disabled={newTaskTitle.trim().length === 0 || isAddingTask}
                    hitSlop={8}
                    style={[styles.addConfirm, newTaskTitle.trim().length === 0 && styles.addConfirmDisabled]}
                  >
                    {isAddingTask ? (
                      <ActivityIndicator size="small" color={colors.invertText} />
                    ) : (
                      <Text style={styles.addConfirmText}>Add</Text>
                    )}
                  </Pressable>
                </View>
              </View>
              {addError && <Text style={styles.error}>{addError}</Text>}
            </View>
          ) : (
            <Pressable
              onPress={openAddTask}
              style={[styles.addTaskRow, isAtCap && styles.addTaskRowLocked]}
              accessibilityRole="button"
              accessibilityLabel={isAtCap ? "Add task — upgrade to Pro" : "Add task"}
            >
              <Text style={[styles.addTaskText, isAtCap && styles.addTaskTextLocked]}>
                {isAtCap ? "🔒 Add Task — Upgrade to Pro" : "+ Add Task"}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    spinner: {
      marginTop: spacing.xl,
    },
    error: {
      color: colors.danger,
      textAlign: "center",
      marginTop: spacing.xl,
      fontSize: 13,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
      marginVertical: spacing.sm,
    },
    fill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    budgetRow: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 999,
      paddingVertical: spacing.xxs,
      paddingHorizontal: spacing.sm,
      alignSelf: "flex-start",
    },
    budgetRowAtCap: {
      backgroundColor: colors.warningGlow,
    },
    budgetText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    budgetTextAtCap: {
      color: colors.warning,
    },
    tasks: {
      marginTop: spacing.sm,
    },
    reorderingHint: {
      color: colors.textFaint,
      fontSize: 11,
    },
    addForm: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
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
    addTaskRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 16,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    addTaskRowLocked: {
      borderColor: colors.warning,
      borderStyle: "solid",
      backgroundColor: colors.warningGlow,
    },
    addTaskText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    addTaskTextLocked: {
      color: colors.warning,
    },
  });
