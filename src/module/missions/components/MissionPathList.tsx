import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

export type IDraftStep = {
  id: string;
  title: string;
  minutes: number;
  // False for anything added via the editor's own "+ Add step" (as opposed
  // to what the AI's plan originally returned) — travels with the step
  // object, not its position, so reordering never confuses provenance. See
  // StartMissionTemplate's handleStart for why this distinction matters.
  isAiGenerated: boolean;
};

type MissionPathListProps = {
  steps: IDraftStep[];
  onRename: (index: number, title: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

type PlanStepRowProps = {
  step: IDraftStep;
  index: number;
  isCurrent: boolean;
  isLast: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function PlanStepRow({
  step,
  index,
  isCurrent,
  isLast,
  canMoveUp,
  canMoveDown,
  onRename,
  onMoveUp,
  onMoveDown,
}: PlanStepRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(step.title);

  const startEditing = () => {
    setDraftTitle(step.title);
    setIsEditing(true);
  };

  const confirmEdit = () => {
    const trimmed = draftTitle.trim();
    setIsEditing(false);
    if (trimmed.length > 0 && trimmed !== step.title) {
      onRename(trimmed);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.markerColumn}>
        <View style={[styles.marker, isCurrent && styles.markerCurrent]}>
          <Text style={[styles.markerText, isCurrent && styles.markerTextCurrent]}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

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
          <Pressable onPress={startEditing} hitSlop={4}>
            <Text style={[styles.stepText, isCurrent && styles.stepTextCurrent]}>{step.title}</Text>
          </Pressable>
        )}
        <Text style={styles.stepMeta}>{step.minutes} min</Text>
      </View>

      {!isEditing && (
        <View style={styles.controls}>
          <Pressable
            onPress={startEditing}
            hitSlop={8}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Rename step"
          >
            <Text style={styles.editIcon}>✎</Text>
          </Pressable>
          <View style={styles.reorderButtons}>
            <Pressable
              onPress={onMoveUp}
              disabled={!canMoveUp}
              hitSlop={6}
              style={[styles.reorderButton, !canMoveUp && styles.reorderButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Move step up"
            >
              <Text style={styles.reorderGlyph}>▲</Text>
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={!canMoveDown}
              hitSlop={6}
              style={[styles.reorderButton, !canMoveDown && styles.reorderButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Move step down"
            >
              <Text style={styles.reorderGlyph}>▼</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// Always visible (not tucked behind a collapsed toggle) so the path to
// completion — and the ability to fix it up — is clear the moment the plan
// is ready. Numbered, connected markers with the current (first) step
// picked out from the rest, same visual language as before; now each row is
// editable (tap to rename) and reorderable (▲▼), matching the same
// interaction idiom TaskRow already established for the post-creation list.
export function MissionPathList({ steps, onRename, onMoveUp, onMoveDown }: MissionPathListProps) {
  return (
    <View>
      {steps.map((step, index) => (
        <PlanStepRow
          key={step.id}
          step={step}
          index={index}
          isCurrent={index === 0}
          isLast={index === steps.length - 1}
          canMoveUp={index > 0}
          canMoveDown={index < steps.length - 1}
          onRename={(title) => onRename(index, title)}
          onMoveUp={() => onMoveUp(index)}
          onMoveDown={() => onMoveDown(index)}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    markerColumn: {
      alignItems: "center",
      width: 22,
    },
    marker: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    markerCurrent: {
      backgroundColor: colors.invertFill,
      borderColor: colors.invertFill,
    },
    markerText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },
    markerTextCurrent: {
      color: colors.invertText,
    },
    connector: {
      width: 1,
      flex: 1,
      minHeight: spacing.sm,
      backgroundColor: colors.border,
    },
    textWrap: {
      flex: 1,
      paddingBottom: spacing.sm,
      gap: 2,
    },
    stepText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    stepTextCurrent: {
      color: colors.text,
      fontWeight: "600",
    },
    editInput: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 2,
    },
    stepMeta: {
      color: colors.textFaint,
      fontSize: 11,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    editButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    editIcon: {
      color: colors.textSecondary,
      fontSize: 14,
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
