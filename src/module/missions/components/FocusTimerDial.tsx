import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

const HOLD_REPEAT_DELAY_MS = 400;
const HOLD_REPEAT_INTERVAL_MS = 120;

type FocusTimerDialProps = {
  valueMinutes: number;
  onChange: (minutes: number) => void;
  maxMinutes: number;
  minMinutes?: number;
  // Caller-supplied so the free-tier/clamped-estimate copy can live where
  // that context (isPro, the AI's raw estimate) already is — this component
  // stays a dumb stepper otherwise.
  hint: string;
  hintEmphasis?: boolean;
};

function stepFor(minutes: number): number {
  if (minutes < 60) return 5;
  if (minutes < 120) return 15;
  return 30;
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

// Digital-readout-plus-stepper shape borrowed from a shared Opal reference
// screenshot, reskinned to this app's monochrome design system — no accent
// color here, that's reserved for exactly three places elsewhere (wordmark,
// Companion, streak count). Single display doubles as both the "clock" and
// the stepper's value, unlike Opal's two separate readouts, since there's no
// live pre-start countdown animation here worth duplicating the number for.
export function FocusTimerDial({
  valueMinutes,
  onChange,
  maxMinutes,
  minMinutes = 5,
  hint,
  hintEmphasis,
}: FocusTimerDialProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  const valueRef = useRef(valueMinutes);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    valueRef.current = valueMinutes;
  }, [valueMinutes]);

  const clearHold = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
      holdInterval.current = null;
    }
  };

  useEffect(() => {
    return () => clearHold();
  }, []);

  const stepOnce = (direction: 1 | -1) => {
    const current = valueRef.current;
    const next = Math.min(maxMinutes, Math.max(minMinutes, current + direction * stepFor(current)));
    valueRef.current = next;
    onChange(next);
  };

  const startHold = (direction: 1 | -1) => {
    stepOnce(direction);
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(() => stepOnce(direction), HOLD_REPEAT_INTERVAL_MS);
    }, HOLD_REPEAT_DELAY_MS);
  };

  const atMin = valueMinutes <= minMinutes;
  const atMax = valueMinutes >= maxMinutes;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPressIn={() => !atMin && startHold(-1)}
          onPressOut={clearHold}
          disabled={atMin}
          hitSlop={8}
          style={({ pressed }) => [styles.stepperButton, atMin && styles.stepperButtonDisabled, pressed && styles.stepperButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Decrease focus time"
        >
          <Text style={styles.stepperGlyph}>−</Text>
        </Pressable>

        <View style={styles.readout}>
          <Text style={styles.readoutEyebrow}>Focus for</Text>
          <Text style={styles.readoutValue}>{formatDuration(valueMinutes)}</Text>
        </View>

        <Pressable
          onPressIn={() => !atMax && startHold(1)}
          onPressOut={clearHold}
          disabled={atMax}
          hitSlop={8}
          style={({ pressed }) => [styles.stepperButton, atMax && styles.stepperButtonDisabled, pressed && styles.stepperButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Increase focus time"
        >
          <Text style={styles.stepperGlyph}>+</Text>
        </Pressable>
      </View>

      {hintEmphasis ? (
        <View style={styles.hintTag}>
          <Text style={styles.hintTagText}>{hint}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      gap: spacing.xs,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    readout: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minWidth: 168,
      alignItems: "center",
    },
    readoutEyebrow: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    readoutValue: {
      color: colors.text,
      fontSize: 30,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      marginTop: spacing.xxxs,
    },
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperButtonPressed: {
      opacity: 0.6,
    },
    stepperButtonDisabled: {
      opacity: 0.3,
    },
    stepperGlyph: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    hint: {
      color: colors.textFaint,
      fontSize: 11,
    },
    hintTag: {
      backgroundColor: colors.warningGlow,
      borderRadius: radius.pill,
      paddingVertical: spacing.xxs,
      paddingHorizontal: spacing.sm,
      maxWidth: 260,
    },
    hintTagText: {
      color: colors.warning,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
  });
