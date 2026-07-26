import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
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

const HEX_PATH = "M0,-26 L22.5,-13 L22.5,13 L0,26 L-22.5,13 L-22.5,-13 Z";

const LAYOUT_CONFIG = { originX: 196, originY: 205, columns: 3, colSpacing: 46, rowSpacing: 42 };

// Full-screen hive workshop — evolution/specs/08-focus-session-hive-world-
// presence.md v3. Renders as: a self-scaling static environment/wall/cell
// layer (react-native-svg's own "slice" fit — see WorkshopEnvironment),
// with the current cell's pulsing ring, the milestone spark, and the bee
// composited on top as separately-animated Views positioned via
// useWorkshopStageLayout so they land exactly where the background art was
// scaled/cropped to, on any real device size.
export function HoneycombScene({ currentUnit, totalUnits, reacting, skin }: WorkTypeSceneProps) {
  const stage = useWorkshopStageLayout();
  const positions = getCellLayout(totalUnits, LAYOUT_CONFIG);
  const hasCurrentCell = currentUnit < totalUnits;
  const currentPosition = hasCurrentCell ? positions[currentUnit] : null;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={stage.onLayout}>
      <WorkshopEnvironment variant="honeycomb" />
      <HoneycombWall positions={positions} currentUnit={currentUnit} totalUnits={totalUnits} />

      {stage.ready && currentPosition && (
        <CurrentCellPulse screenPosition={stage.toScreen(currentPosition)} scale={stage.scale} />
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

// Static (non-animated) halo + per-cell base fill state — react-native-svg
// scales this itself via preserveAspectRatio, same as WorkshopEnvironment,
// so it needs no onLayout math of its own. Re-renders (immediate color
// swap, no transition) whenever currentUnit advances; the milestone spark
// overlay is what actually carries the "just completed" feedback.
function HoneycombWall({
  positions,
  currentUnit,
  totalUnits,
}: {
  positions: CellPosition[];
  currentUnit: number;
  totalUnits: number;
}) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${STAGE_CANVAS_WIDTH} ${STAGE_CANVAS_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <RadialGradient id="hcCellGlow" cx="35%" cy="30%" r="75%">
          <Stop offset="0%" stopColor="#fff0b8" />
          <Stop offset="55%" stopColor="#f0a83f" />
          <Stop offset="100%" stopColor="#a5660f" />
        </RadialGradient>
        <LinearGradient id="hcCellFlat" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#c99a5c" />
          <Stop offset="100%" stopColor="#8a6337" />
        </LinearGradient>
        <RadialGradient id="hcHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ffcf6b" stopOpacity={0.5} />
          <Stop offset="100%" stopColor="#ffcf6b" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse
        cx={LAYOUT_CONFIG.originX}
        cy={LAYOUT_CONFIG.originY + ((Math.ceil(totalUnits / LAYOUT_CONFIG.columns) - 1) * LAYOUT_CONFIG.rowSpacing) / 2}
        rx={LAYOUT_CONFIG.colSpacing * 2.2}
        ry={LAYOUT_CONFIG.colSpacing * 2.2}
        fill="url(#hcHalo)"
      />

      {positions.map((position, index) => {
        const isFilled = index < currentUnit;
        const isCurrent = index === currentUnit;
        const fill = isFilled ? "url(#hcCellGlow)" : isCurrent ? "url(#hcCellFlat)" : "rgba(255,255,255,0.08)";
        return (
          <G key={index} transform={`translate(${position.x},${position.y})`}>
            <Path
              d={HEX_PATH}
              fill={fill}
              stroke={isFilled || isCurrent ? "#7a4f12" : "#8a6a44"}
              strokeWidth={isFilled || isCurrent ? 2 : 1.5}
              strokeDasharray={isFilled || isCurrent ? undefined : "4 4"}
            />
          </G>
        );
      })}
    </Svg>
  );
}

function CurrentCellPulse({ screenPosition, scale }: { screenPosition: CellPosition; scale: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.5,
  }));

  const size = 60 * scale;

  return (
    <Animated.View style={[{ position: "absolute", left: screenPosition.x - size / 2, top: screenPosition.y - size / 2 }, style]}>
      <Svg width={size} height={size} viewBox="-30 -30 60 60">
        <Path d={HEX_PATH} fill="none" stroke="#fff6de" strokeWidth={3} />
      </Svg>
    </Animated.View>
  );
}

