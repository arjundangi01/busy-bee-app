import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { spacing, useColors } from "@/theme";
import { BeeCharacter, BeeSkin } from "@/components/content/companion/BeeCharacter";
import type { WorkTypeSceneProps } from "@/components/content/companion/WorkTypeScene";

const HEX_PATH = "M12 1 L21.5 6.5 L21.5 17.5 L12 23 L2.5 17.5 L2.5 6.5 Z";
const CELL_SIZE = 22;

export function HoneycombScene({ currentUnit, totalUnits, reacting, skin }: WorkTypeSceneProps) {
  const colors = useColors();
  const progress = totalUnits > 0 ? Math.min(currentUnit / totalUnits, 1) : 0;

  return (
    <View style={styles.wrap}>
      <BeeRow progress={progress} reacting={reacting} skin={skin} />
      <View style={styles.grid}>
        {Array.from({ length: totalUnits }, (_, index) => (
          <HexCell key={index} filled={index < currentUnit} borderColor={colors.borderSubtle} fillColor={colors.accent} />
        ))}
      </View>
    </View>
  );
}

function BeeRow({ progress, reacting, skin }: { progress: number; reacting: boolean; skin?: BeeSkin }) {
  const translate = useSharedValue(progress);
  useEffect(() => {
    translate.value = withTiming(progress, { duration: 400 });
  }, [progress, translate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translate.value * 120 - 60 }],
  }));

  return (
    <Animated.View style={[styles.beeRow, style]}>
      <BeeCharacter mode={reacting ? "distracted" : "active"} size={34} skin={skin} />
    </Animated.View>
  );
}

function HexCell({ filled, borderColor, fillColor }: { filled: boolean; borderColor: string; fillColor: string }) {
  const scale = useSharedValue(filled ? 1 : 0.85);
  const opacity = useSharedValue(filled ? 1 : 0.5);

  useEffect(() => {
    scale.value = withTiming(filled ? 1 : 0.85, { duration: 300 });
    opacity.value = withTiming(filled ? 1 : 0.5, { duration: 300 });
  }, [filled, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={CELL_SIZE} height={CELL_SIZE} viewBox="0 0 24 24">
        <Path d={HEX_PATH} fill={filled ? fillColor : "transparent"} stroke={borderColor} strokeWidth={1.5} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  beeRow: {
    height: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xxxs,
    maxWidth: 160,
  },
});
