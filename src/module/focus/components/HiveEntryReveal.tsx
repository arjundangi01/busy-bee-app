import { ReactNode, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { spacing } from "@/theme";

const FLOOR_MS = 900;
const HOLD_PROGRESS = 0.72;
const FINISH_MS = 450;
const MAX_WAIT_MS = 3200;
const SWAY_MS = 2600;

// Fixed cloud palette — same bounded, non-theme-reactive color exception as
// the hive workshop scene itself (evolution/specs/08-focus-session-hive-
// world-presence.md's Color & Material section, extended by the 2026-07-26
// "entering a new world" revision). Lightened tints of the app's own real
// bee/accent gold (`theme/colors.ts`'s `accentGradient`: #f0cb7a / #d4a943 /
// #a67b1f) — not an unrelated sky-blue — per the user's explicit "our bee
// theme color, light weight" direction, and the same reason it doesn't
// invert for light/dark: it's dramatizing leaving the rest of the app's
// monochrome behind, not sitting inside it.
const SKY = {
  top: "#fdf1d8",
  bottom: "#f6db9f",
  puffHighlight: "#fffaf0",
  puffShadowA: "#f0cb7a",
  puffShadowB: "#d9a94a",
  text: "#4a3018",
  textSecondary: "#8a6a3a",
  barTrack: "rgba(74,48,24,0.16)",
  barFill: "#d4a943",
};

type Puff = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  phase: number;
  tint: "a" | "b";
};

// Hand-placed so the puffs collectively cover the full screen at rest (no
// gap for the real scene to show through until they've actually started
// drifting apart), then part outward toward the edges as `progress`
// advances — an aperture opening onto whatever's mounted underneath, not a
// flat color wipe. Positions/drift are percentages/px against an
// absoluteFill parent, so this holds up across device sizes without an
// onLayout measurement pass. `phase` staggers each puff's idle bob so a
// hold (waiting on `ready`) still reads as alive, not frozen.
const PUFFS: Puff[] = [
  { left: "8%", top: "10%", size: 210, driftX: -95, driftY: -70, delay: 0, phase: 0, tint: "a" },
  { left: "60%", top: "2%", size: 250, driftX: 85, driftY: -85, delay: 0.05, phase: 0.9, tint: "b" },
  { left: "-8%", top: "46%", size: 270, driftX: -120, driftY: 15, delay: 0.1, phase: 1.8, tint: "b" },
  { left: "72%", top: "38%", size: 290, driftX: 120, driftY: 25, delay: 0.04, phase: 2.7, tint: "a" },
  { left: "6%", top: "76%", size: 240, driftX: -85, driftY: 95, delay: 0.08, phase: 3.6, tint: "b" },
  { left: "58%", top: "80%", size: 260, driftX: 95, driftY: 105, delay: 0.02, phase: 4.5, tint: "a" },
  { left: "28%", top: "30%", size: 300, driftX: 20, driftY: -45, delay: 0.12, phase: 5.4, tint: "b" },
  { left: "40%", top: "58%", size: 280, driftX: -25, driftY: 55, delay: 0.06, phase: 6.3, tint: "a" },
];

type HiveEntryRevealProps = {
  children: ReactNode;
  // Signals that whatever is mounted underneath (real data, not a
  // placeholder) is actually ready to be looked at — the clouds hold just
  // short of fully open until this flips true, so parting them never
  // uncovers an empty background that then pops the real scene in after.
  // Capped by MAX_WAIT_MS regardless, so a slow/failed load can't strand
  // the user behind clouds forever.
  ready: boolean;
};

export function HiveEntryReveal({ children, ready }: HiveEntryRevealProps) {
  const progress = useSharedValue(0);
  const sway = useSharedValue(0);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    progress.value = withTiming(1, { duration: FINISH_MS, easing: Easing.out(Easing.cubic) });
  };

  useEffect(() => {
    progress.value = withTiming(HOLD_PROGRESS, { duration: FLOOR_MS, easing: Easing.out(Easing.cubic) });
    // Continuous 0→1 sweep (not a reversing ping-pong) so per-puff phase
    // offsets read as smooth circular bobbing via sin/cos, not a jittery
    // reversal every cycle.
    sway.value = withRepeat(withTiming(1, { duration: SWAY_MS, easing: Easing.linear }), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const timeout = setTimeout(finish, MAX_WAIT_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fully opaque (not just "mostly") for the entire hold + most of the
  // reveal — real HUD content underneath must not be readable at all until
  // this actually starts dismissing. HOLD_PROGRESS (0.72) sits well inside
  // the flat "1" segment below, so a long wait on `ready` never leaves the
  // screen sitting at some partially-see-through opacity in the meantime.
  // The puffs' own drift/sway (not this layer's opacity) is what should
  // read as "the clouds are moving" during that wait.
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.84, 1], [1, 1, 0]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 0.85], [1, 1, 0]),
  }));

  const barFillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value / HOLD_PROGRESS, 1) * 100}%`,
  }));

  return (
    <View style={styles.outer}>
      {/* Mounted from the first frame, same as before — nothing pops in
          after the clouds clear, they just stop hiding what's already
          there. */}
      <View style={StyleSheet.absoluteFill}>{children}</View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, scrimStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="hesSky" cx="50%" cy="38%" r="75%">
              <Stop offset="0%" stopColor={SKY.bottom} />
              <Stop offset="100%" stopColor={SKY.top} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#hesSky)" />
        </Svg>

        {PUFFS.map((puff, index) => (
          <CloudPuff key={index} puff={puff} progress={progress} sway={sway} index={index} />
        ))}

        <View style={styles.centerWrap}>
          <Animated.View style={textStyle}>
            <Text style={styles.headline}>Entering the hive</Text>
            <Text style={styles.subcopy}>Your bee&apos;s warming up the workshop.</Text>
          </Animated.View>
          <Animated.View style={[styles.barTrack, textStyle]}>
            <Animated.View style={[styles.barFill, barFillStyle]} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

function CloudPuff({
  puff,
  progress,
  sway,
  index,
}: {
  puff: Puff;
  progress: SharedValue<number>;
  sway: SharedValue<number>;
  index: number;
}) {
  const shadowId = `hesPuffShadow${index}`;
  const highlightId = `hesPuffHighlight${index}`;
  const shadowTint = puff.tint === "a" ? SKY.puffShadowA : SKY.puffShadowB;

  const style = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [puff.delay, 1], [0, 1], Extrapolation.CLAMP);
    const angle = sway.value * Math.PI * 2 + puff.phase;
    const swayX = Math.sin(angle) * 9;
    const swayY = Math.cos(angle) * 7;
    return {
      opacity: interpolate(progress.value, [0, 0.7, 1], [1, 0.92, 0]),
      transform: [
        { translateX: t * puff.driftX + swayX },
        { translateY: t * puff.driftY + swayY },
        { scale: 1 + t * 0.2 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.puffWrap,
        {
          left: puff.left,
          top: puff.top,
          width: puff.size,
          height: puff.size,
          marginLeft: -puff.size / 2,
          marginTop: -puff.size / 2,
        },
        style,
      ]}
    >
      {/* Two offset blobs (a warm-gold "shadow" underneath a bright "highlight")
          instead of one flat gradient circle — gives each puff real
          dimensionality so it reads as a distinct cloud shape, not a haze
          that blends into the sky wash behind it. */}
      <Svg width={puff.size} height={puff.size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={shadowId} cx="55%" cy="60%" r="55%">
            <Stop offset="0%" stopColor={shadowTint} stopOpacity={0.85} />
            <Stop offset="65%" stopColor={shadowTint} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={shadowTint} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={highlightId} cx="42%" cy="38%" r="52%">
            <Stop offset="0%" stopColor={SKY.puffHighlight} stopOpacity={1} />
            <Stop offset="60%" stopColor={SKY.puffHighlight} stopOpacity={0.85} />
            <Stop offset="100%" stopColor={SKY.puffHighlight} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={53} cy={57} r={45} fill={`url(#${shadowId})`} />
        <Circle cx={45} cy={41} r={42} fill={`url(#${highlightId})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  puffWrap: {
    position: "absolute",
  },
  centerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  headline: {
    color: SKY.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  subcopy: {
    color: SKY.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xxs,
  },
  barTrack: {
    marginTop: spacing.xl,
    width: 160,
    height: 6,
    borderRadius: 3,
    backgroundColor: SKY.barTrack,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: SKY.barFill,
    borderRadius: 3,
  },
});

// Two layers, always overlapping: the real content (children, absoluteFill)
// underneath, and this cloud scrim on top. The scrim itself is three things
// — a full-bleed honey-gradient wash (guarantees zero gap at progress=0
// regardless of where individual puffs sit), the puffs riding on top for
// texture/dimensionality, and the center text/bar. `progress` drives all of
// it, but on different curves: puffs drift/sway continuously (even while
// held at HOLD_PROGRESS awaiting `ready`) so there's always visible motion,
// while the whole layer's own opacity stays high until late so that motion
// is actually perceptible instead of washing to transparent immediately.
// See HiveEntryRevealProps.ready for why finishing is gated rather than
// fixed-duration.
