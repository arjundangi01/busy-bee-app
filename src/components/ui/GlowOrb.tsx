import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { IColorTokens, useColors } from "@/theme";

type GlowOrbProps = {
  size?: number;
};

export function GlowOrb({ size = 96 }: GlowOrbProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.25,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  return (
    <View style={[styles.wrapper, { width: size * 1.8, height: size * 1.8 }]}>
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8 },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          coreStyle,
          { width: size, height: size, borderRadius: size * 0.32 },
        ]}
      >
        <View style={[styles.face, { borderRadius: size * 0.32 }]} />
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    wrapper: {
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    glow: {
      position: "absolute",
      backgroundColor: colors.accentGlow,
    },
    core: {
      backgroundColor: colors.accentGradient[1],
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate: "45deg" }],
      borderWidth: 1,
      borderColor: colors.accent,
    },
    face: {
      width: "70%",
      height: "70%",
      backgroundColor: colors.accentGradient[0],
    },
  });
