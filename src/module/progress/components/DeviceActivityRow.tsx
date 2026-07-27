import { StyleSheet, Text, View } from "react-native";
import { DeltaDisplay } from "@/module/progress/utils/deviceActivityDelta";
import { IColorTokens, spacing, useColors } from "@/theme";

type DeviceActivityRowProps = {
  label: string;
  value: string;
  delta: DeltaDisplay | null;
  isLast?: boolean;
};

// The "vs your average" centered track (design-artifacts/evolution/specs/
// sketches/insights-accuracy-and-distraction-detail-sketch.html's
// avg-track) — a fixed center tick (= your average), a short fill toward
// left/right showing today's position. Color is metric-aware (delta.isGood)
// but only ever the existing `text` (good) or `danger` (bad) tokens — no
// new color token.
export function DeviceActivityRow({ label, value, delta, isLast }: DeviceActivityRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const fillColor = delta ? (delta.isGood ? colors.text : colors.danger) : colors.textSecondary;

  return (
    <View style={[styles.row, !isLast && styles.rowWithBorder]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {delta && (
        <>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { backgroundColor: fillColor, width: `${delta.trackFillPercent}%` },
                delta.trackSide === "right" ? styles.trackFillFromCenter : styles.trackFillToCenter,
              ]}
            />
            <View style={styles.trackTick} />
          </View>
          <Text style={styles.caption}>
            {delta.coloredPart ? <Text style={[styles.captionColored, { color: fillColor }]}>{delta.coloredPart} </Text> : null}
            {delta.mutedPart}
          </Text>
        </>
      )}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      paddingVertical: spacing.sm,
    },
    rowWithBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: spacing.xxs,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    value: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceAlt,
      position: "relative",
    },
    trackFill: {
      position: "absolute",
      top: 0,
      height: "100%",
      borderRadius: 2,
    },
    trackFillFromCenter: {
      left: "50%",
    },
    trackFillToCenter: {
      right: "50%",
    },
    trackTick: {
      position: "absolute",
      top: -3,
      left: "50%",
      marginLeft: -1,
      width: 2,
      height: 10,
      backgroundColor: colors.textFaint,
    },
    caption: {
      fontSize: 10.5,
      color: colors.textFaint,
      marginTop: spacing.xs,
    },
    captionColored: {
      fontWeight: "700",
    },
  });
