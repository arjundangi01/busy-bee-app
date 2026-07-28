import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatDuration } from "@/module/missions/components/FocusTimerDial";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

const HOLD_REPEAT_DELAY_MS = 400;
const HOLD_REPEAT_INTERVAL_MS = 120;
const STEP_MINUTES = 5;

type MinuteStepperProps = {
  valueMinutes: number;
  onChange: (minutes: number) => void;
  maxMinutes: number;
  minMinutes?: number;
};

// A smaller sibling of FocusTimerDial's stepper — same hold-to-repeat
// interaction idiom, just sized for an inline "add task" row rather than a
// full-screen focus-duration moment. A task's estimate doesn't need the
// dial's tiered step sizing (5/15/30min); a flat 5-minute step is granular
// enough for the smaller range this is used at.
export function MinuteStepper({ valueMinutes, onChange, maxMinutes, minMinutes = 5 }: MinuteStepperProps) {
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
    const next = Math.min(maxMinutes, Math.max(minMinutes, current + direction * STEP_MINUTES));
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
    <View style={styles.row}>
      <Pressable
        onPressIn={() => !atMin && startHold(-1)}
        onPressOut={clearHold}
        disabled={atMin}
        hitSlop={8}
        style={({ pressed }) => [styles.button, atMin && styles.buttonDisabled, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Decrease time estimate"
      >
        <Text style={styles.glyph}>−</Text>
      </Pressable>

      <Text style={styles.value}>{formatDuration(valueMinutes)}</Text>

      <Pressable
        onPressIn={() => !atMax && startHold(1)}
        onPressOut={clearHold}
        disabled={atMax}
        hitSlop={8}
        style={({ pressed }) => [styles.button, atMax && styles.buttonDisabled, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Increase time estimate"
      >
        <Text style={styles.glyph}>+</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    button: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      opacity: 0.6,
    },
    buttonDisabled: {
      opacity: 0.3,
    },
    glyph: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
    },
    value: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      minWidth: 52,
      textAlign: "center",
    },
  });
