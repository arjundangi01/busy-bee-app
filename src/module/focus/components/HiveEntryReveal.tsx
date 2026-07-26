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
const SWAY_MS = 1800;

// Fixed sky/cloud palette — same bounded, non-theme-reactive color exception
// as the hive workshop scene itself (evolution/specs/08-focus-session-hive-
// world-presence.md's Color & Material section, extended by the 2026-07-26
// "entering a new world" revision): this transition dramatizes leaving the
// rest of the app's monochrome behind, so it deliberately doesn't invert
// for light/dark either.
const SKY = {
  top: "#cfe3ee",
  bottom: "#f6ecd9",
  puffWarm: "#fff6de",
  puffCool: "#eaf3fb",
  text: "#4a3018",
  textSecondary: "#7a5a34",
  barTrack: "rgba(74,48,24,0.14)",
  barFill: "#f0a83f",
};

type Puff = {
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
  tint: "warm" | "cool";
};

// Hand-placed so the puffs collectively cover the full screen at rest (no
// gap for the real scene to show through until they've actually started
// drifting apart), then part outward toward the edges as `progress`
// advances — an aperture opening onto whatever's mounted underneath, not a
// flat color wipe. Positions/drift are percentages/px against an
// absoluteFill parent, so this holds up across device sizes without an
// onLayout measurement pass.
const PUFFS: Puff[] = [
  { left: "8%", top: "10%", size: 190, driftX: -80, driftY: -60, delay: 0, tint: "warm" },
  { left: "60%", top: "2%", size: 230, driftX: 70, driftY: -70, delay: 0.05, tint: "cool" },
  { left: "-8%", top: "46%", size: 250, driftX: -100, driftY: 10, delay: 0.1, tint: "cool" },
  { left: "72%", top: "38%", size: 270, driftX: 100, driftY: 20, delay: 0.04, tint: "warm" },
  { left: "6%", top: "76%", size: 220, driftX: -70, driftY: 80, delay: 0.08, tint: "cool" },
  { left: "58%", top: "80%", size: 240, driftX: 80, driftY: 90, delay: 0.02, tint: "warm" },
  { left: "28%", top: "30%", size: 280, driftX: 15, driftY: -35, delay: 0.12, tint: "cool" },
  { left: "40%", top: "58%", size: 260, driftX: -20, driftY: 45, delay: 0.06, tint: "warm" },
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
    sway.value = withRepeat(withTiming(1, { duration: SWAY_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
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

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0]),
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
  const gradientId = `hesPuff${index}`;
  const tintColor = puff.tint === "warm" ? SKY.puffWarm : SKY.puffCool;

  const style = useAnimatedStyle(() => {
    const t = interpolate(progress.value, [puff.delay, 1], [0, 1], Extrapolation.CLAMP);
    const swayOffset = (sway.value - 0.5) * 14 * (index % 2 === 0 ? 1 : -1);
    return {
      opacity: interpolate(progress.value, [0, 0.55, 1], [1, 0.85, 0]),
      transform: [{ translateX: t * puff.driftX }, { translateY: t * puff.driftY + swayOffset }, { scale: 1 + t * 0.18 }],
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
      <Svg width={puff.size} height={puff.size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={tintColor} stopOpacity={1} />
            <Stop offset="70%" stopColor={tintColor} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={tintColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={48} fill={`url(#${gradientId})`} />
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
// underneath, and this cloud scrim on top. The scrim itself is two things —
// a full-bleed sky-gradient wash (guarantees zero gap at progress=0
// regardless of where individual puffs sit) plus the puffs riding on top
// for texture, motion, and the "parting" read. `progress` drives both at
// once, so nothing here is a static image: puffs drift outward and sway
// continuously (even while held at HOLD_PROGRESS awaiting `ready`), and the
// whole scrim fades as it finishes. See HiveEntryRevealProps.ready for why
// finishing is gated rather than fixed-duration.
