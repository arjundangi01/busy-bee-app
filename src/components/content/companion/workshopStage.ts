import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

// Shared nominal design canvas both HoneycombScene and FlowerFieldScene lay
// their structure out against (evolution/specs/08-focus-session-hive-world-
// presence.md) — matches the motion sketch's own 300x650 phone mockup.
export const STAGE_CANVAS_WIDTH = 300;
export const STAGE_CANVAS_HEIGHT = 650;

export type CellPosition = { x: number; y: number };

// The shared platform (see WorkshopEnvironment) both HoneycombScene and
// FlowerFieldScene stand the bee on — kept in one place so the bee lands in
// the same screen position regardless of work type, rather than each scene
// guessing its own coordinates.
export const BEE_STAGE_ANCHOR = { left: 48, top: 296, width: 132 };

// Generic column-based hex/brick layout: N items arranged into `columns`
// vertical columns, with alternate columns offset by half a row so they
// interlock like a real honeycomb instead of a plain grid. Reused by both
// scenes (12-cell honeycomb wall, 10-bloom flower bed today) — the actual
// work-type registry is admin-content-driven and totalUnits genuinely
// varies per type, so this can't be a hardcoded fixed-position list.
export function getCellLayout(
  count: number,
  config: { originX: number; originY: number; columns: number; colSpacing: number; rowSpacing: number },
): CellPosition[] {
  const { originX, originY, columns, colSpacing, rowSpacing } = config;
  const positions: CellPosition[] = [];
  for (let index = 0; index < count; index += 1) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const colOffset = col - (columns - 1) / 2;
    const zigzag = Math.abs(colOffset) % 2 === 1 ? rowSpacing / 2 : 0;
    positions.push({
      x: originX + colOffset * colSpacing,
      y: originY + row * rowSpacing + zigzag,
    });
  }
  return positions;
}

// Measures the stage's actual on-screen size, then computes the
// "cover"/slice scale+offset needed to map a point in the STAGE_CANVAS_*
// coordinate space to real screen pixels — the same fit react-native-svg's
// own `preserveAspectRatio="xMidYMid slice"` uses internally for the
// self-scaling background Svg, kept in sync here so the bee, the current-
// cell pulse, and the milestone spark (all plain composited Views, per this
// codebase's "never animate SVG props directly" convention — see
// BeeCharacter.tsx) land in exactly the same place the background art was
// scaled/cropped to, on any real device size, edge-to-edge with no gaps.
export function useWorkshopStageLayout() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  if (!size) {
    return { onLayout, ready: false as const, toScreen: (point: CellPosition) => point, scale: 1 };
  }

  const scale = Math.max(size.width / STAGE_CANVAS_WIDTH, size.height / STAGE_CANVAS_HEIGHT);
  const offsetX = (size.width - STAGE_CANVAS_WIDTH * scale) / 2;
  const offsetY = (size.height - STAGE_CANVAS_HEIGHT * scale) / 2;

  const toScreen = (point: CellPosition): CellPosition => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale,
  });

  return { onLayout, ready: true as const, toScreen, scale };
}
