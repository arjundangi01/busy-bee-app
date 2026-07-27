import { StyleSheet, Text, View } from "react-native";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { IColorTokens, spacing, useColors } from "@/theme";

type ScreenTimeAppRowProps = {
  appName: string;
  foregroundSeconds: number;
  isBlocked: boolean;
  maxForegroundSeconds: number;
};

// Two-tone, not a rainbow: blocklisted apps render in the existing `danger`
// token, everything else neutral — a meaning, not decoration, matching the
// same red the app already uses for errors.
export function ScreenTimeAppRow({ appName, foregroundSeconds, isBlocked, maxForegroundSeconds }: ScreenTimeAppRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const widthPercent =
    maxForegroundSeconds === 0 ? 0 : Math.max(4, Math.round((foregroundSeconds / maxForegroundSeconds) * 100));

  return (
    <View style={styles.row}>
      <Text style={styles.appName} numberOfLines={1}>
        {appName}
      </Text>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${widthPercent}%`, backgroundColor: isBlocked ? colors.danger : colors.textSecondary }]}
        />
      </View>
      <Text style={styles.duration}>{formatMinutesAsHoursAndMinutes(Math.round(foregroundSeconds / 60))}</Text>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xxs,
    },
    appName: {
      color: colors.text,
      fontSize: 13,
      width: 76,
    },
    track: {
      flex: 1,
      height: 7,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 999,
    },
    duration: {
      color: colors.textMuted,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
      width: 44,
      textAlign: "right",
    },
  });
