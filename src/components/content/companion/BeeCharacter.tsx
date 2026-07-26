import { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { useColors } from "@/theme";

// design-artifacts/D-Design-System/components/content/01-companion-presence-element.md
// The bee illustration itself — a single reusable character, not a
// per-screen duplicate. Rendered inside Companion (idle/greeting/etc, no
// work scene) and inside the full-screen hive-workshop scene
// (evolution/specs/08-focus-session-hive-world-presence.md) via the
// `working` pose. Only the wrapping Views are animated (transform/opacity),
// never the SVG shapes' own props — matches the pattern already used for
// Companion's glow (react-native-reanimated driving a View, react-native-svg
// staying static beneath it).
export type BeeCharacterMode = "idle" | "active" | "distracted" | "celebrate";

export type BeeSkin = {
  bodyPrimary: string;
  bodySecondary: string;
  stripe: string;
};

type BeeCharacterProps = {
  mode: BeeCharacterMode;
  size?: number;
  // Defaults to the theme's accent gradient — overridden by a selected
  // appearance skin (see Bee customization tab).
  skin?: BeeSkin;
  // Selects the standing, hard-hat, hammer-swinging pose used by the
  // full-screen hive-workshop scene instead of the compact round body used
  // everywhere else (Bee's Hive skin picker, Companion's non-work states).
  // Orthogonal to `mode`, which still drives the shared bob/wing/droop
  // animation semantics for either pose — "distracted" only ever pairs with
  // `working` today (the compact pose has no caller that needs it).
  working?: boolean;
};

const DEFAULT_SIZE = 40;

// Fixed warm-palette constants for the `working` pose only — this scene is a
// deliberate, bounded exception to the app's theme-reactive "Premium Black &
// White" tokens (see the spec's Color & Material section) and must not
// invert for light/dark theme, unlike the compact pose below which uses
// useColors() throughout.
const WORKSHOP = {
  outline: "#3a2712",
  wing: "#fff6de",
  hatFill: "#ffcf3f",
  hammerHead: "#8a6337",
  hammerHandle: "#4a2c12",
  dropMaterial: "#8a7a5a",
  shadow: "#000000",
};

const WORKING_VIEWBOX_W = 160;
const WORKING_VIEWBOX_H = 200;
// Shoulder pivot the hammer arm rotates around, in the working viewBox's
// local coordinate space.
const SHOULDER = { x: 106, y: 96 };
const ARM_SPAN = 50;

export function BeeCharacter({ mode, size = DEFAULT_SIZE, skin, working = false }: BeeCharacterProps) {
  const colors = useColors();
  // The working pose's default (no skin selected) still can't be
  // theme-reactive — colors.accentGradient/colors.text would otherwise flip
  // this scene's bee between light/dark theme, which the fixed-palette
  // exception explicitly rules out.
  const resolvedSkin: BeeSkin = skin ?? (working
    ? { bodyPrimary: "#e0a53e", bodySecondary: "#ffe9ad", stripe: WORKSHOP.outline }
    : { bodyPrimary: colors.accentGradient[0], bodySecondary: colors.accentGradient[2], stripe: colors.text });
  const isDistracted = mode === "distracted";
  const isLively = mode === "active" || mode === "celebrate";

  const bob = useSharedValue(0);
  const wingFlutter = useSharedValue(0);
  const droop = useSharedValue(0);
  const armAngle = useSharedValue(-52);
  const dropOpacity = useSharedValue(0);
  const dropOffsetY = useSharedValue(0);
  const wasDistractedRef = useRef(false);

  useEffect(() => {
    bob.value = isDistracted
      ? withTiming(0, { duration: 300 })
      : withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [isDistracted, bob]);

  useEffect(() => {
    wingFlutter.value = isDistracted
      ? withTiming(0.15, { duration: 300 })
      : withRepeat(
          withTiming(1, { duration: isLively ? 90 : 220, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
  }, [isDistracted, isLively, wingFlutter]);

  useEffect(() => {
    droop.value = withTiming(isDistracted ? 1 : 0, { duration: 350 });
  }, [isDistracted, droop]);

  // Ambient hammer loop never stops on its own — a real work-unit completion
  // is expressed by the honeycomb wall (cell fill + spark), not by changing
  // this loop's pace, per the spec's "ambient vs milestone" split. Only a
  // real distraction collision interrupts it.
  useEffect(() => {
    if (!working) return;
    if (isDistracted) {
      armAngle.value = withTiming(62, { duration: 350 });
    } else {
      armAngle.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 260, easing: Easing.out(Easing.quad) }),
          withTiming(20, { duration: 90 }),
          withTiming(-52, { duration: 300, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    }
  }, [working, isDistracted, armAngle]);

  // One-shot "drop what it's carrying" beat, fired only on the transition
  // into distraction — never replayed on re-renders while already stopped.
  useEffect(() => {
    if (!working) return;
    if (isDistracted && !wasDistractedRef.current) {
      dropOpacity.value = 1;
      dropOffsetY.value = 0;
      dropOpacity.value = withDelay(150, withTiming(0, { duration: 500 }));
      dropOffsetY.value = withDelay(150, withTiming(34, { duration: 650, easing: Easing.in(Easing.quad) }));
    }
    wasDistractedRef.current = isDistracted;
  }, [working, isDistracted, dropOpacity, dropOffsetY]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * (working ? 3 : 4) },
      { rotate: `${(working ? 0 : droop.value) * 18}deg` },
    ],
    opacity: 1 - droop.value * (working ? 0.25 : 0.35),
  }));

  const leftWingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.55 + wingFlutter.value * 0.45 }],
    opacity: working ? 1 - droop.value * 0.7 : 1,
  }));

  const rightWingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.55 + wingFlutter.value * 0.45 }],
    opacity: working ? 1 - droop.value * 0.7 : 1,
  }));

  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armAngle.value}deg` }],
  }));

  const dropStyle = useAnimatedStyle(() => ({
    opacity: dropOpacity.value,
    transform: [{ translateY: dropOffsetY.value }, { rotate: "-30deg" }],
  }));

  const wingColor = isDistracted ? colors.textFaint : colors.textSecondary;
  // The working pose conveys distraction through motion/opacity (droop,
  // stopped wings, dropped material — see bodyStyle/leftWingStyle above),
  // never a recolor — a theme-token gray swap here would also make the
  // scene react to light/dark theme, which the fixed-palette exception
  // rules out. The compact pose (Bee's Hive, non-work Companion states)
  // keeps the original theme-reactive recolor.
  const bodyFill = !working && isDistracted ? colors.textFaint : resolvedSkin.bodyPrimary;
  const stripeFill = !working && isDistracted ? colors.textMuted : resolvedSkin.stripe;

  if (working) {
    const scale = size / WORKING_VIEWBOX_W;
    const height = size * (WORKING_VIEWBOX_H / WORKING_VIEWBOX_W);
    const wingSize = 46 * scale;

    return (
      <View style={{ width: size, height, alignItems: "center", justifyContent: "flex-start" }}>
        <Animated.View style={[{ position: "absolute", left: (30 - 8) * scale, top: 58 * scale }, leftWingStyle]}>
          <Svg width={wingSize} height={wingSize * 0.65} viewBox="0 0 46 30">
            <Ellipse cx="23" cy="15" rx="20" ry="12" fill={WORKSHOP.wing} opacity={0.65} stroke={WORKSHOP.outline} strokeWidth={1.2} />
          </Svg>
        </Animated.View>
        <Animated.View style={[{ position: "absolute", left: (78 + 8) * scale, top: 58 * scale }, rightWingStyle]}>
          <Svg width={wingSize} height={wingSize * 0.65} viewBox="0 0 46 30">
            <Ellipse cx="23" cy="15" rx="20" ry="12" fill={WORKSHOP.wing} opacity={0.65} stroke={WORKSHOP.outline} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        <Animated.View style={bodyStyle}>
          <Svg width={size} height={height} viewBox={`0 0 ${WORKING_VIEWBOX_W} ${WORKING_VIEWBOX_H}`}>
            <Ellipse cx={80} cy={188} rx={30} ry={7} fill={WORKSHOP.shadow} opacity={0.18} />

            {/* legs */}
            <Path d="M70 148 L61 186 M92 148 L101 186" stroke={WORKSHOP.outline} strokeWidth={5} strokeLinecap="round" fill="none" />

            {/* antennae */}
            <Path d="M66 58 Q56 42 48 36" stroke={stripeFill} strokeWidth={2.6} strokeLinecap="round" fill="none" />
            <Circle cx={48} cy={36} r={3} fill={stripeFill} />
            <Path d="M94 58 Q104 42 112 36" stroke={stripeFill} strokeWidth={2.6} strokeLinecap="round" fill="none" />
            <Circle cx={112} cy={36} r={3} fill={stripeFill} />

            {/* hard hat */}
            <Path d="M46 62 Q80 18 114 62 Z" fill={WORKSHOP.hatFill} stroke={WORKSHOP.outline} strokeWidth={3} />
            <Rect x={40} y={56} width={80} height={13} rx={6.5} fill={WORKSHOP.hatFill} stroke={WORKSHOP.outline} strokeWidth={3} />

            {/* body */}
            <Ellipse cx={80} cy={112} rx={32} ry={38} fill={bodyFill} stroke={WORKSHOP.outline} strokeWidth={3} />
            <Path d="M50 96 Q80 106 110 96 L110 106 Q80 116 50 106 Z" fill={stripeFill} opacity={0.85} />
            <Path d="M48 126 Q80 136 112 126 L112 136 Q80 146 48 136 Z" fill={stripeFill} opacity={0.85} />
            <Circle cx={68} cy={102} r={3.6} fill={WORKSHOP.outline} opacity={isDistracted ? 0.4 : 0.9} />
            <Circle cx={92} cy={102} r={3.6} fill={WORKSHOP.outline} opacity={isDistracted ? 0.4 : 0.9} />
            <Path d="M70 116 Q80 121 90 116" stroke={WORKSHOP.outline} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.6} />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: "absolute",
              left: (SHOULDER.x - ARM_SPAN) * scale,
              top: (SHOULDER.y - ARM_SPAN) * scale,
              width: ARM_SPAN * 2 * scale,
              height: ARM_SPAN * 2 * scale,
            },
            armStyle,
          ]}
        >
          <Svg width={ARM_SPAN * 2 * scale} height={ARM_SPAN * 2 * scale} viewBox={`0 0 ${ARM_SPAN * 2} ${ARM_SPAN * 2}`}>
            <Path
              d={`M${ARM_SPAN} ${ARM_SPAN} L${ARM_SPAN + 30} ${ARM_SPAN - 26}`}
              stroke={WORKSHOP.hammerHandle}
              strokeWidth={7}
              strokeLinecap="round"
            />
            <Rect
              x={ARM_SPAN + 16}
              y={ARM_SPAN - 46}
              width={20}
              height={28}
              rx={3}
              fill={WORKSHOP.hammerHead}
              stroke={WORKSHOP.outline}
              strokeWidth={2.5}
              transform={`rotate(24 ${ARM_SPAN + 26} ${ARM_SPAN - 32})`}
            />
          </Svg>
        </Animated.View>

        <Animated.View
          style={[
            { position: "absolute", left: (SHOULDER.x + 32) * scale, top: (SHOULDER.y - 4) * scale },
            dropStyle,
          ]}
        >
          <Svg width={16 * scale} height={20 * scale} viewBox="0 0 16 20">
            <Rect x={2} y={2} width={12} height={16} rx={2} fill={WORKSHOP.dropMaterial} />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ width: size * 1.6, height: size * 1.4, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", left: size * 0.05 }, leftWingStyle]}>
        <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 40 40">
          <Ellipse cx="20" cy="20" rx="16" ry="10" fill={wingColor} opacity={0.55} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", right: size * 0.05 }, rightWingStyle]}>
        <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 40 40">
          <Ellipse cx="20" cy="20" rx="16" ry="10" fill={wingColor} opacity={0.55} />
        </Svg>
      </Animated.View>

      <Animated.View style={bodyStyle}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Path d="M42 30 L36 16" stroke={stripeFill} strokeWidth={3} strokeLinecap="round" />
          <Path d="M58 30 L64 16" stroke={stripeFill} strokeWidth={3} strokeLinecap="round" />
          <Circle cx="36" cy="16" r="2.5" fill={stripeFill} />
          <Circle cx="64" cy="16" r="2.5" fill={stripeFill} />
          <Ellipse cx="50" cy="52" rx="30" ry="26" fill={bodyFill} />
          <Path d="M25 42 Q50 34 75 42 L75 50 Q50 42 25 50 Z" fill={stripeFill} opacity={0.85} />
          <Path d="M25 62 Q50 54 75 62 L75 70 Q50 62 25 70 Z" fill={stripeFill} opacity={0.85} />
          <Circle cx="40" cy="46" r="3" fill={colors.bg} opacity={isDistracted ? 0.4 : 0.9} />
          <Circle cx="60" cy="46" r="3" fill={colors.bg} opacity={isDistracted ? 0.4 : 0.9} />
        </Svg>
      </Animated.View>
    </View>
  );
}
