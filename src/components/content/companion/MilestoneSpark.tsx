import { useEffect, useRef, useState } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import type { CellPosition } from "@/components/content/companion/workshopStage";

// One-shot spark burst fired at the position of whichever cell/bloom just
// completed — the visibly-distinct "milestone beat" layered on top of the
// bee's continuous ambient motion (evolution/specs/08-focus-session-hive-
// world-presence.md). Shared between HoneycombScene and FlowerFieldScene —
// the burst itself isn't structure-specific, only its trigger position is.
export function MilestoneSpark({
  currentUnit,
  positions,
  toScreen,
}: {
  currentUnit: number;
  positions: CellPosition[];
  toScreen: (point: CellPosition) => CellPosition;
}) {
  const prevUnitRef = useRef(currentUnit);
  const [burstAt, setBurstAt] = useState<CellPosition | null>(null);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (currentUnit > prevUnitRef.current) {
      const completedIndex = prevUnitRef.current;
      const position = positions[completedIndex];
      if (position) {
        setBurstAt(toScreen(position));
        opacity.value = 1;
        scale.value = 0.4;
        opacity.value = withTiming(0, { duration: 550 });
        scale.value = withTiming(1.7, { duration: 550, easing: Easing.out(Easing.quad) });
      }
    }
    prevUnitRef.current = currentUnit;
    // toScreen/positions/opacity/scale are stable-enough refs for this
    // one-shot-on-advance effect; re-running on every scale/opacity
    // identity change would break the "only fire on real advance" guard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUnit]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!burstAt) return null;

  return (
    <Animated.View style={[{ position: "absolute", left: burstAt.x - 16, top: burstAt.y - 16 }, style]}>
      <Svg width={32} height={32} viewBox="0 0 32 32">
        <Path d="M16,4 L18,10" stroke="#fff6de" strokeWidth={2} strokeLinecap="round" />
        <Path d="M16,4 L14,10" stroke="#fff6de" strokeWidth={2} strokeLinecap="round" />
        <Path d="M26,16 L20,17" stroke="#fff6de" strokeWidth={2} strokeLinecap="round" />
        <Path d="M6,16 L12,17" stroke="#fff6de" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
