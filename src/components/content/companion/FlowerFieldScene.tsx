import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from "react-native-svg";
import { BeeCharacter } from "@/components/content/companion/BeeCharacter";
import { MilestoneSpark } from "@/components/content/companion/MilestoneSpark";
import { WorkshopEnvironment } from "@/components/content/companion/WorkshopEnvironment";
import {
  BEE_STAGE_ANCHOR,
  CellPosition,
  getCellLayout,
  STAGE_CANVAS_HEIGHT,
  STAGE_CANVAS_WIDTH,
  useWorkshopStageLayout,
} from "@/components/content/companion/workshopStage";
import type { WorkTypeSceneProps } from "@/components/content/companion/WorkTypeScene";

const LAYOUT_CONFIG = { originX: 196, originY: 290, columns: 5, colSpacing: 30, rowSpacing: 64 };

// Full-screen hive workshop, flower-collecting variant — same environment
// shell, bee, and milestone-beat treatment as HoneycombScene, with a garden
// planter box in place of the honeycomb wall. Per evolution/specs/
// 08-focus-session-hive-world-presence.md, flower-specific art fidelity
// (a distinct bloom illustration, its own structure metaphor) is scoped as
// follow-on work — this pass gives it the same full-screen/HUD/motion
// treatment as Honeycomb rather than leaving it on the old small fill-grid.
export function FlowerFieldScene({ currentUnit, totalUnits, reacting, skin }: WorkTypeSceneProps) {
  const stage = useWorkshopStageLayout();
  const positions = getCellLayout(totalUnits, LAYOUT_CONFIG);
  const hasCurrentBloom = currentUnit < totalUnits;
  const currentPosition = hasCurrentBloom ? positions[currentUnit] : null;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={stage.onLayout}>
      <WorkshopEnvironment variant="flower" />
      <FlowerBed positions={positions} currentUnit={currentUnit} totalUnits={totalUnits} />

      {stage.ready && currentPosition && (
        <CurrentBloomPulse screenPosition={stage.toScreen(currentPosition)} scale={stage.scale} />
      )}

      {stage.ready && <MilestoneSpark currentUnit={currentUnit} positions={positions} toScreen={stage.toScreen} />}

      {stage.ready &&
        (() => {
          const beeScreenPosition = stage.toScreen({ x: BEE_STAGE_ANCHOR.left, y: BEE_STAGE_ANCHOR.top });
          return (
            <View style={{ position: "absolute", left: beeScreenPosition.x, top: beeScreenPosition.y }}>
              <BeeCharacter
                working
                mode={reacting ? "distracted" : "active"}
                size={BEE_STAGE_ANCHOR.width * stage.scale}
                skin={skin}
              />
            </View>
          );
        })()}
    </View>
  );
}

function FlowerBed({
  positions,
  currentUnit,
  totalUnits,
}: {
  positions: CellPosition[];
  currentUnit: number;
  totalUnits: number;
}) {
  const rows = Math.ceil(totalUnits / LAYOUT_CONFIG.columns);
  const boxTop = LAYOUT_CONFIG.originY - 34;
  const boxHeight = (rows - 1) * LAYOUT_CONFIG.rowSpacing + 68;
  const boxWidth = LAYOUT_CONFIG.columns * LAYOUT_CONFIG.colSpacing + 30;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${STAGE_CANVAS_WIDTH} ${STAGE_CANVAS_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id="ffBloomGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#f4a97a" />
          <Stop offset="100%" stopColor="#d9723f" />
        </LinearGradient>
        <LinearGradient id="ffPlanterGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7a5230" />
          <Stop offset="100%" stopColor="#4a3018" />
        </LinearGradient>
      </Defs>

      <Rect
        x={LAYOUT_CONFIG.originX - boxWidth / 2}
        y={boxTop}
        width={boxWidth}
        height={boxHeight}
        rx={10}
        fill="url(#ffPlanterGrad)"
        stroke="#3a2712"
        strokeWidth={2}
      />

      {positions.map((position, index) => {
        const isBloomed = index < currentUnit;
        const isCurrent = index === currentUnit;
        return (
          <G key={index} transform={`translate(${position.x},${position.y})`}>
            {isBloomed || isCurrent ? (
              <Bloom opacity={isBloomed ? 1 : 0.6} />
            ) : (
              <Circle r={4} fill="none" stroke="#a68a5c" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

function Bloom({ opacity }: { opacity: number }) {
  return (
    <G opacity={opacity}>
      <Circle cx={0} cy={-9} r={7} fill="url(#ffBloomGrad)" stroke="#7a3f1f" strokeWidth={1} />
      <Circle cx={8} cy={4} r={7} fill="url(#ffBloomGrad)" stroke="#7a3f1f" strokeWidth={1} />
      <Circle cx={-8} cy={4} r={7} fill="url(#ffBloomGrad)" stroke="#7a3f1f" strokeWidth={1} />
      <Circle cx={0} cy={9} r={7} fill="url(#ffBloomGrad)" stroke="#7a3f1f" strokeWidth={1} />
      <Circle cx={0} cy={0} r={6} fill="#fff6de" opacity={0.95} />
    </G>
  );
}

function CurrentBloomPulse({ screenPosition, scale }: { screenPosition: CellPosition; scale: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.5,
  }));

  const size = 44 * scale;

  return (
    <Animated.View
      style={[{ position: "absolute", left: screenPosition.x - size / 2, top: screenPosition.y - size / 2 }, style]}
    >
      <Svg width={size} height={size} viewBox="-22 -22 44 44">
        <Circle r={16} fill="none" stroke="#fff6de" strokeWidth={2.5} />
      </Svg>
    </Animated.View>
  );
}
