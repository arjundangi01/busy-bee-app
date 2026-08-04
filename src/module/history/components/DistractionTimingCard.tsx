import { StyleSheet, Text, View } from "react-native";
import { StatCard } from "@/components/content/StatCard";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { ISessionDistractionTiming } from "@/types";
import { SESSION_DISTRACTION_TIMING_TIER } from "@/utils/enums";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/evolution/specs/14-session-timeline.md -- the "distraction
// timing" signal: how far into this session the first blocked attempt fired,
// relative to the session's own length, framed against the user's rolling
// 8-week baseline. Numbers/track colored `text` (typical/later/heldLong) or
// `warning` (earlier) -- reuses SessionListRow's real roughness-badge
// precedent (text/warning/danger), not DeviceActivityRow's binary one, since
// this metric has a genuine "fine, not concerning" middle state the same way
// roughness does. `danger` stays reserved for the roughness badge only.
type DistractionTimingCardProps = {
  timing: ISessionDistractionTiming;
};

export function DistractionTimingCard({ timing }: DistractionTimingCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <StatCard>
      <Text style={styles.label}>Distraction timing</Text>
      {timing.tier === SESSION_DISTRACTION_TIMING_TIER.CLEAN ? (
        <Text style={styles.sentence}>No blocks this session — steadier than your usual session.</Text>
      ) : timing.tier === SESSION_DISTRACTION_TIMING_TIER.BUILDING ? (
        <Text style={styles.buildingNote}>
          Not enough session history yet to compare this to your usual pattern — check back after a few more
          sessions.
        </Text>
      ) : (
        <TimingComparison timing={timing} colors={colors} styles={styles} />
      )}
    </StatCard>
  );
}

type TimingComparisonProps = {
  timing: ISessionDistractionTiming;
  colors: IColorTokens;
  styles: ReturnType<typeof createStyles>;
};

// firstBlockElapsedSeconds/Percent/baselineElapsedPercent are guaranteed
// non-null here -- CLEAN and BUILDING (the two tiers where they can be null)
// are handled by the caller before this renders.
function TimingComparison({ timing, colors, styles }: TimingComparisonProps) {
  const tierColor = timing.tier === SESSION_DISTRACTION_TIMING_TIER.EARLIER ? colors.warning : colors.text;
  const duration = formatMinutesAsHoursAndMinutes(Math.round(timing.firstBlockElapsedSeconds! / 60));
  const percent = Math.round(timing.firstBlockElapsedPercent!);
  const baseline = Math.round(timing.baselineElapsedPercent!);

  return (
    <>
      <Text style={styles.sentence}>
        Stayed focused for <Text style={{ color: tierColor, fontWeight: "700" }}>{duration}</Text>
        {timing.tier === SESSION_DISTRACTION_TIMING_TIER.HELD_LONG ? (
          " — nearly the entire session — before this happened."
        ) : (
          <>
            {" — "}
            <Text style={{ color: tierColor, fontWeight: "700" }}>{percent}%</Text>
            {" of the session — before the first distraction, "}
            {timing.tier === SESSION_DISTRACTION_TIMING_TIER.EARLIER
              ? "earlier"
              : timing.tier === SESSION_DISTRACTION_TIMING_TIER.LATER
                ? "later"
                : "in line with"}
            {timing.tier === SESSION_DISTRACTION_TIMING_TIER.TYPICAL ? "" : " than"} your usual ~{baseline}%.
          </>
        )}
      </Text>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${percent}%`, backgroundColor: tierColor }]} />
        <View style={[styles.trackTick, { left: `${baseline}%` }]} />
      </View>
      <View style={styles.captionRow}>
        <Text style={styles.captionEdge}>Session start</Text>
        <Text style={styles.captionEdge}>Session end</Text>
      </View>
    </>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    label: {
      fontSize: 9.5,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    sentence: {
      fontSize: 12.5,
      color: colors.text,
      lineHeight: 18,
    },
    buildingNote: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
    },
    track: {
      position: "relative",
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceAlt,
      marginTop: spacing.sm,
    },
    trackFill: {
      position: "absolute",
      left: 0,
      height: "100%",
      borderRadius: 2,
    },
    trackTick: {
      position: "absolute",
      marginLeft: -1,
      width: 2,
      height: 10,
      top: -3,
      backgroundColor: colors.textFaint,
    },
    captionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.xxs,
    },
    captionEdge: {
      fontSize: 9.5,
      color: colors.textFaint,
    },
  });
