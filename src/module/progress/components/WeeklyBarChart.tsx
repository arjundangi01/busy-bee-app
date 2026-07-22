import { StyleSheet, Text, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

// Page-scoped, single use (watch-listed). Prior weeks render muted; the most
// recent week renders at full colors.text — identity is carried by fill
// intensity, not a second color (color-accent is reserved for the wordmark,
// Companion, and streak-count stat value only).
type WeeklyBarChartProps = {
  valuesByWeek: number[];
};

const MAX_BAR_HEIGHT = 56;
const MIN_BAR_HEIGHT = 3;

export function WeeklyBarChart({ valuesByWeek }: WeeklyBarChartProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const maxValue = Math.max(...valuesByWeek, 1);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Weekly time reclaimed chart, ${valuesByWeek.length} weeks, most recent week ${valuesByWeek[valuesByWeek.length - 1] ?? 0} minutes`}
    >
      {valuesByWeek.map((value, index) => {
        const isCurrentWeek = index === valuesByWeek.length - 1;
        const height = Math.max(MIN_BAR_HEIGHT, Math.round((value / maxValue) * MAX_BAR_HEIGHT));

        return (
          <View key={index} style={styles.barColumn} importantForAccessibility="no-hide-descendants">
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height }, isCurrentWeek && styles.barCurrent]} />
            </View>
            <Text style={styles.barLabel}>W{index + 1}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.xs,
    },
    barColumn: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xxxs,
    },
    barTrack: {
      height: MAX_BAR_HEIGHT,
      justifyContent: "flex-end",
    },
    bar: {
      width: 10,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      backgroundColor: colors.surfaceAlt,
    },
    barCurrent: {
      backgroundColor: colors.text,
    },
    barLabel: {
      color: colors.textSecondary,
      fontSize: 9,
    },
  });
