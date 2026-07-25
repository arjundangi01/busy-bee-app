import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Stop, Circle } from "react-native-svg";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/D-Design-System/components/content/01-companion-presence-element.md
// One component with a `state` prop, never a separate component per pose.
// `distracted` (7th state) added for design-artifacts/evolution/specs/
// 03-companion-work-types.md — triggered only by a real blocked-attempt
// collision, never by ordinary backgrounding.
export type CompanionState =
  | "idle"
  | "mentioned"
  | "at-work"
  | "celebratory"
  | "reflective"
  | "greeting"
  | "distracted";

export type CompanionWorkProgress = {
  currentUnit: number;
  totalUnits: number;
};

type CompanionProps = {
  state: CompanionState;
  caption?: string;
  // Greeting's caption doubles as the page headline (color-text), every
  // other caption is secondary (color-text-secondary).
  captionIsHeadline?: boolean;
  // Only meaningful for "at-work"/"distracted" — renders the current work
  // type's unit progress as a row of pips beneath the presence circle. A
  // real illustration per work type (honeycomb cells, flowers) is a
  // content/asset pass, not built this cycle — see 03-companion-work-types.md.
  workProgress?: CompanionWorkProgress;
};

const SIZE_BY_STATE: Record<CompanionState, number> = {
  idle: 56,
  greeting: 56,
  reflective: 56,
  "at-work": 64,
  distracted: 64,
  celebratory: 56,
  mentioned: 24,
};

export function Companion({ state, caption, captionIsHeadline, workProgress }: CompanionProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const size = SIZE_BY_STATE[state];
  const isAtWork = state === "at-work";
  const isDistracted = state === "distracted";
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (isAtWork) {
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = 0;
    }
  }, [isAtWork, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isAtWork ? 0.4 + pulse.value * 0.3 : isDistracted ? 0.2 : 0.45,
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  return (
    <View style={state === "mentioned" ? styles.inlineWrapper : styles.wrapper}>
      <View style={{ width: size * 1.7, height: size * 1.7, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 },
            // Distracted renders in a flat, muted tone rather than the warm
            // accent glow — a visual "paused," not a color swap that could
            // read as an error/danger state.
            isDistracted && { backgroundColor: colors.textFaint },
          ]}
        />
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="companionGradient" cx="35%" cy="30%" r="75%">
              <Stop offset="0%" stopColor={isDistracted ? colors.textMuted : colors.accentGradient[0]} />
              <Stop offset="55%" stopColor={isDistracted ? colors.textFaint : colors.accentGradient[1]} />
              <Stop offset="100%" stopColor={isDistracted ? colors.textFaint : colors.accentGradient[2]} />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="48" fill="url(#companionGradient)" />
        </Svg>
      </View>
      {caption && (
        <Text style={[styles.caption, captionIsHeadline ? styles.captionHeadline : styles.captionDefault]}>
          {caption}
        </Text>
      )}
      {workProgress && (
        <View style={styles.progressRow}>
          {Array.from({ length: workProgress.totalUnits }, (_, index) => (
            <View
              key={index}
              style={[
                styles.progressPip,
                index < workProgress.currentUnit
                  ? { backgroundColor: colors.accent }
                  : { backgroundColor: colors.borderSubtle },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "center",
      gap: spacing.xs,
    },
    inlineWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    glow: {
      position: "absolute",
      backgroundColor: colors.accentGlow,
    },
    caption: {
      textAlign: "center",
    },
    captionDefault: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    captionHeadline: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    progressRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xxxs,
      maxWidth: 160,
    },
    progressPip: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
  });
