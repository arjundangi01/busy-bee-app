import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { spacing, useColors } from "@/theme";
import { BeeCharacter, BeeSkin } from "@/components/content/companion/BeeCharacter";
import type { WorkTypeSceneProps } from "@/components/content/companion/WorkTypeScene";

const FLOWER_SIZE = 22;

export function FlowerFieldScene({ currentUnit, totalUnits, reacting, skin }: WorkTypeSceneProps) {
  const colors = useColors();
  const progress = totalUnits > 0 ? Math.min(currentUnit / totalUnits, 1) : 0;

  return (
    <View style={styles.wrap}>
      <BeeRow progress={progress} reacting={reacting} skin={skin} />
      <View style={styles.row}>
        {Array.from({ length: totalUnits }, (_, index) => (
          <Flower
            key={index}
            bloomed={index < currentUnit}
            petalColor={colors.accent}
            centerColor={colors.text}
            outlineColor={colors.borderSubtle}
          />
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

function Flower({
  bloomed,
  petalColor,
  centerColor,
  outlineColor,
}: {
  bloomed: boolean;
  petalColor: string;
  centerColor: string;
  outlineColor: string;
}) {
  const scale = useSharedValue(bloomed ? 1 : 0.4);
  const opacity = useSharedValue(bloomed ? 1 : 0.4);

  useEffect(() => {
    if (bloomed) {
      scale.value = withSequence(withTiming(1.15, { duration: 180 }), withTiming(1, { duration: 150 }));
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = withTiming(0.4, { duration: 200 });
      opacity.value = withTiming(0.4, { duration: 200 });
    }
  }, [bloomed, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={style}>
      <Svg width={FLOWER_SIZE} height={FLOWER_SIZE} viewBox="0 0 24 24">
        <Circle cx="12" cy="6" r="4" fill={bloomed ? petalColor : "transparent"} stroke={outlineColor} strokeWidth={1} />
        <Circle cx="18" cy="12" r="4" fill={bloomed ? petalColor : "transparent"} stroke={outlineColor} strokeWidth={1} />
        <Circle cx="12" cy="18" r="4" fill={bloomed ? petalColor : "transparent"} stroke={outlineColor} strokeWidth={1} />
        <Circle cx="6" cy="12" r="4" fill={bloomed ? petalColor : "transparent"} stroke={outlineColor} strokeWidth={1} />
        <Circle cx="12" cy="12" r="3" fill={bloomed ? centerColor : "transparent"} opacity={0.9} />
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xxxs,
    maxWidth: 160,
  },
});
