import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IMissionTask } from "@/types";
import { TASK_STATUS } from "@/utils/enums";

type TaskRowProps = {
  task: IMissionTask;
  isCompleting: boolean;
  onComplete: () => void;
  isSaving: boolean;
  onRename: (title: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// Editing/reordering can't share the old "whole row is one Pressable for
// complete" shape — the checkbox is now its own tap target, with a separate
// edit affordance and a pair of reorder buttons alongside it.
export function TaskRow({
  task,
  isCompleting,
  onComplete,
  isSaving,
  onRename,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: TaskRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const isDone = task.status === TASK_STATUS.DONE;
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  const startEditing = () => {
    setDraftTitle(task.title);
    setIsEditing(true);
  };

  const confirmEdit = () => {
    const trimmed = draftTitle.trim();
    setIsEditing(false);
    if (trimmed.length > 0 && trimmed !== task.title) {
      onRename(trimmed);
    }
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={isDone ? undefined : onComplete}
        disabled={isDone || isCompleting}
        hitSlop={8}
        style={[styles.checkbox, isDone && styles.checkboxDone]}
        accessibilityRole="button"
        accessibilityLabel={isDone ? "Task complete" : "Mark task complete"}
      >
        {isCompleting ? (
          <ActivityIndicator size="small" color={colors.invertText} />
        ) : (
          isDone && <Text style={styles.check}>✓</Text>
        )}
      </Pressable>

      <View style={styles.textWrap}>
        {isEditing ? (
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            style={styles.editInput}
            autoFocus
            onSubmitEditing={confirmEdit}
            onBlur={confirmEdit}
            returnKeyType="done"
          />
        ) : (
          <Pressable onPress={startEditing} disabled={isSaving} hitSlop={4}>
            <Text style={[styles.title, isDone && styles.titleDone]}>{task.title}</Text>
          </Pressable>
        )}
        {task.estimatedMinutes !== null && (
          <Text style={styles.meta}>{isSaving ? "Saving…" : `${task.estimatedMinutes} min`}</Text>
        )}
      </View>

      {!isEditing && (
        <View style={styles.reorderButtons}>
          <Pressable
            onPress={onMoveUp}
            disabled={!canMoveUp}
            hitSlop={6}
            style={[styles.reorderButton, !canMoveUp && styles.reorderButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Move task up"
          >
            <Text style={styles.reorderGlyph}>▲</Text>
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={!canMoveDown}
            hitSlop={6}
            style={[styles.reorderButton, !canMoveDown && styles.reorderButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Move task down"
          >
            <Text style={styles.reorderGlyph}>▼</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
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
    editInput: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 2,
    },
    meta: {
      color: colors.textFaint,
      fontSize: 12,
    },
    reorderButtons: {
      gap: spacing.xxs,
    },
    reorderButton: {
      width: 24,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    reorderButtonDisabled: {
      opacity: 0.25,
    },
    reorderGlyph: {
      color: colors.textSecondary,
      fontSize: 10,
    },
  });
