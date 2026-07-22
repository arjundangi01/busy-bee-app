import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme";
import { IMissionTask } from "@/types";
import { TASK_STATUS } from "@/utils/enums";

type TaskRowProps = {
  task: IMissionTask;
  isCompleting: boolean;
  onComplete: () => void;
};

export function TaskRow({ task, isCompleting, onComplete }: TaskRowProps) {
  const isDone = task.status === TASK_STATUS.DONE;

  return (
    <Pressable style={styles.row} onPress={isDone ? undefined : onComplete} disabled={isDone || isCompleting}>
      <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
        {isCompleting ? (
          <ActivityIndicator size="small" color={colors.invertText} />
        ) : (
          isDone && <Text style={styles.check}>✓</Text>
        )}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, isDone && styles.titleDone]}>{task.title}</Text>
        {task.estimatedMinutes !== null && <Text style={styles.meta}>{task.estimatedMinutes} min</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  check: {
    color: colors.invertText,
    fontSize: 14,
    fontWeight: "700",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  titleDone: {
    color: colors.textFaint,
    textDecorationLine: "line-through",
  },
  meta: {
    color: colors.textFaint,
    fontSize: 12,
  },
});
