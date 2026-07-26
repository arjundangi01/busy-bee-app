import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { useColors } from "@/theme";

// design-artifacts/D-Design-System/components/content/01-companion-presence-element.md
// The bee illustration itself — a single reusable character, not a
// per-screen duplicate. Rendered inside Companion (idle/greeting/etc, no
// work scene) and inside WorkTypeScene (at-work/distracted, positioned
// alongside a HoneycombScene/FlowerFieldScene). Only the wrapping Views are
// animated (transform/opacity), never the SVG shapes' own props — matches
// the pattern already used for Companion's glow (react-native-reanimated
// driving a View, react-native-svg staying static beneath it).
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
};

const DEFAULT_SIZE = 40;

export function BeeCharacter({ mode, size = DEFAULT_SIZE, skin }: BeeCharacterProps) {
  const colors = useColors();
  const resolvedSkin: BeeSkin = skin ?? {
    bodyPrimary: colors.accentGradient[0],
    bodySecondary: colors.accentGradient[2],
    stripe: colors.text,
  };
  const isDistracted = mode === "distracted";
  const isLively = mode === "active" || mode === "celebrate";

  const bob = useSharedValue(0);
  const wingFlutter = useSharedValue(0);
  const droop = useSharedValue(0);

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

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * 4 },
      { rotate: `${droop.value * 18}deg` },
    ],
    opacity: 1 - droop.value * 0.35,
  }));

  const leftWingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.55 + wingFlutter.value * 0.45 }],
  }));

  const rightWingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 0.55 + wingFlutter.value * 0.45 }],
  }));

  const wingColor = isDistracted ? colors.textFaint : colors.textSecondary;
  const bodyFill = isDistracted ? colors.textFaint : resolvedSkin.bodyPrimary;
  const stripeFill = isDistracted ? colors.textMuted : resolvedSkin.stripe;

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
