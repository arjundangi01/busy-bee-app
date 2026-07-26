import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { STAGE_CANVAS_HEIGHT, STAGE_CANVAS_WIDTH } from "@/components/content/companion/workshopStage";

// Fixed warm-palette workshop backdrop — evolution/specs/
// 08-focus-session-hive-world-presence.md's "Color & Material" exception:
// this scene deliberately doesn't read from useColors()/theme tokens and
// doesn't invert for light/dark, unlike everywhere else in the app.
// Self-scaling (percentage width/height + "slice"), so unlike the cells/
// bee/spark overlaid on top of it, this needs no onLayout math of its own.

// Bee's Hive environment/scene customization (evolution/specs/
// 09-bees-hive-illustrated-redesign.md) — flat hex colors consumed
// directly, no client-side derivation, same precedent as BeeCharacter's
// BeeSkin prop. DEFAULT_THEME is today's original hardcoded palette
// (== the seeded "Golden Hour" row), so "no theme selected" and "Golden
// Hour selected" render pixel-identically.
export type HiveThemePalette = {
  skyTop: string;
  skyBottom: string;
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
  lanternGlow: string;
};

const DEFAULT_THEME: HiveThemePalette = {
  skyTop: "#bfe3f7",
  skyBottom: "#eaf6e0",
  wallTop: "#6b4a2c",
  wallBottom: "#4a3018",
  floorTop: "#8a6238",
  floorBottom: "#5c3f21",
  lanternGlow: "#ffe9ad",
};

type WorkshopEnvironmentProps = {
  // honeycomb-block crate + hex blueprint read as honeycomb-specific set
  // dressing — swapped out for a plainer shelf detail on the flower variant
  // rather than shown a bee tending flowers under honeycomb signage. Full
  // flower-specific set dressing is the same follow-on art pass the spec
  // already scopes the flower structure's fidelity into.
  variant: "honeycomb" | "flower";
  // Undefined falls back to DEFAULT_THEME above — same "undefined = default"
  // convention as BeeCharacter's `skin` prop.
  theme?: HiveThemePalette;
};

export function WorkshopEnvironment({ variant, theme }: WorkshopEnvironmentProps) {
  const t = theme ?? DEFAULT_THEME;
  // Every caller used to render at most one WorkshopEnvironment on screen at
  // a time, so fixed literal gradient ids never collided. The Bee's Hive
  // theme picker now renders several instances simultaneously (a hero
  // preview + multiple theme tiles) — namespace every <Defs> id per
  // instance so react-native-svg can't resolve a `url(#...)` reference
  // against a sibling instance's gradient.
  const uid = useId();

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${STAGE_CANVAS_WIDTH} ${STAGE_CANVAS_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <LinearGradient id={`wsWallGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={t.wallTop} />
          <Stop offset="100%" stopColor={t.wallBottom} />
        </LinearGradient>
        <LinearGradient id={`wsFloorGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={t.floorTop} />
          <Stop offset="100%" stopColor={t.floorBottom} />
        </LinearGradient>
        <LinearGradient id={`wsSkyGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={t.skyTop} />
          <Stop offset="100%" stopColor={t.skyBottom} />
        </LinearGradient>
        <LinearGradient id={`wsCellFlatGrad${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#c99a5c" />
          <Stop offset="100%" stopColor="#8a6337" />
        </LinearGradient>
        <RadialGradient id={`wsLanternGlow${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={t.lanternGlow} stopOpacity={0.9} />
          <Stop offset="100%" stopColor={t.lanternGlow} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* walls + floor */}
      <Rect x={0} y={0} width={STAGE_CANVAS_WIDTH} height={STAGE_CANVAS_HEIGHT} fill={`url(#wsWallGrad${uid})`} />
      <Path d="M0 480 L300 470 L300 650 L0 650 Z" fill={`url(#wsFloorGrad${uid})`} />
      <Path d="M0 480 L300 470" stroke="#3a2712" strokeWidth={3} />
      <G stroke="#5c3f21" strokeWidth={1.5} opacity={0.5}>
        <Path d="M40 650 L46 480" />
        <Path d="M100 650 L104 476" />
        <Path d="M160 650 L162 474" />
        <Path d="M220 650 L220 472" />
        <Path d="M270 650 L266 471" />
      </G>
      <G stroke="#3a2712" strokeWidth={1} opacity={0.35}>
        <Path d="M0 60 H300" />
        <Path d="M0 150 H300" />
        <Path d="M0 240 H300" />
        <Path d="M0 330 H300" />
        <Path d="M0 410 H300" />
      </G>

      {/* window to garden */}
      <G transform="translate(58,150)">
        <Ellipse cx={0} cy={0} rx={52} ry={66} fill={`url(#wsSkyGrad${uid})`} />
        <Circle cx={-18} cy={24} r={16} fill="#6fae55" />
        <Circle cx={10} cy={30} r={20} fill="#5f9948" />
        <Circle cx={-4} cy={10} r={14} fill="#79ba60" />
        <Circle cx={-24} cy={-6} r={4} fill="#f2a6c4" opacity={0.75} />
        <Circle cx={20} cy={-10} r={3.5} fill="#f2a6c4" opacity={0.75} />
        <Ellipse cx={0} cy={0} rx={52} ry={66} fill="none" stroke="#3a2712" strokeWidth={6} />
      </G>
      <G stroke="#4a7a2f" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8}>
        <Path d="M10 90 Q4 130 14 160" />
        <Path d="M110 96 Q118 130 108 158" />
      </G>

      {/* shelf with jars */}
      <Rect x={10} y={330} width={86} height={8} rx={2} fill="#6b4a2c" stroke="#3a2712" strokeWidth={1.5} />
      <G transform="translate(30,300)">
        <Rect x={-14} y={0} width={28} height={30} rx={4} fill="#e0a53e" stroke="#7a4f12" strokeWidth={1.5} />
        <Rect x={-16} y={-6} width={32} height={9} rx={3} fill="#fff6de" stroke="#7a4f12" strokeWidth={1.5} />
      </G>
      <G transform="translate(70,306)">
        <Rect x={-11} y={0} width={22} height={24} rx={3} fill="#d9922f" stroke="#7a4f12" strokeWidth={1.5} />
        <Rect x={-12} y={-5} width={24} height={7} rx={2} fill="#fff6de" stroke="#7a4f12" strokeWidth={1.5} />
      </G>

      {variant === "honeycomb" ? (
        <>
          {/* crate of finished honeycomb blocks */}
          <G transform="translate(232,538)">
            <Rect x={-40} y={0} width={80} height={46} rx={4} fill="#7a5230" stroke="#3a2712" strokeWidth={2} />
            <Rect x={-32} y={-10} width={18} height={18} rx={2} fill={`url(#wsCellFlatGrad${uid})`} stroke="#7a4f12" />
            <Rect x={-10} y={-14} width={18} height={18} rx={2} fill={`url(#wsCellFlatGrad${uid})`} stroke="#7a4f12" />
            <Rect x={12} y={-9} width={18} height={18} rx={2} fill={`url(#wsCellFlatGrad${uid})`} stroke="#7a4f12" />
          </G>

          {/* blueprint on wall */}
          <G transform="translate(238,132) rotate(3)">
            <Rect x={-34} y={-42} width={68} height={84} rx={3} fill="#e7d9b8" stroke="#3a2712" strokeWidth={1.5} />
            <G stroke="#a8895a" strokeWidth={1} opacity={0.8}>
              <Path d="M0,-20 L12,-13 L12,1 L0,8 L-12,1 L-12,-13 Z" fill="none" />
              <Path d="M0,10 L12,17 L12,31 L0,38 L-12,31 L-12,17 Z" fill="none" />
            </G>
          </G>
        </>
      ) : (
        <>
          {/* crate of harvested jars, in place of honeycomb blocks */}
          <G transform="translate(232,538)">
            <Rect x={-40} y={0} width={80} height={46} rx={4} fill="#7a5230" stroke="#3a2712" strokeWidth={2} />
            <Rect x={-26} y={-12} width={20} height={22} rx={4} fill="#e0a53e" stroke="#7a4f12" strokeWidth={1.5} />
            <Rect x={4} y={-12} width={20} height={22} rx={4} fill="#d9922f" stroke="#7a4f12" strokeWidth={1.5} />
          </G>

          {/* pressed-flower sketch on wall, in place of the hex blueprint */}
          <G transform="translate(238,132) rotate(3)">
            <Rect x={-34} y={-42} width={68} height={84} rx={3} fill="#e7d9b8" stroke="#3a2712" strokeWidth={1.5} />
            <G stroke="#a8895a" strokeWidth={1} opacity={0.8}>
              <Circle cx={0} cy={-16} r={12} fill="none" />
              <Circle cx={0} cy={16} r={12} fill="none" />
            </G>
          </G>
        </>
      )}

      {/* hanging lantern (static — ambient flicker deferred to the follow-on art pass) */}
      <G transform="translate(258,64)">
        <Path d="M0 -30 L0 0" stroke="#3a2712" strokeWidth={2} />
        <Circle r={20} fill={`url(#wsLanternGlow${uid})`} />
        <Rect x={-10} y={0} width={20} height={24} rx={4} fill="#2b1d10" stroke="#4a3018" strokeWidth={1.5} />
        <Circle cx={0} cy={12} r={6} fill="#ffe19c" />
      </G>

      {/* platform + ladder the bee stands on */}
      <Ellipse cx={130} cy={470} rx={86} ry={14} fill="#3a2712" opacity={0.4} />
      <Path d="M64 468 L100 500 L100 520 L64 490 Z" fill="#7a5230" stroke="#3a2712" strokeWidth={2} />
      <Path d="M70 472 L94 514 M78 466 L102 508" stroke="#3a2712" strokeWidth={2} />
    </Svg>
  );
}
