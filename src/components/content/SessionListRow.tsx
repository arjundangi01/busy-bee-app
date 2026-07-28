import { Pressable, StyleSheet, Text, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";
import { formatSessionDate, formatTimeRange } from "@/lib/utils/format";
import { ISessionSummary } from "@/types";
import { SESSION_ROUGHNESS } from "@/utils/enums";

// design-artifacts/evolution/specs/12-post-session-history-and-roughness.md —
// shared between Evening Review's "Today's sessions" list and the History
// screen, one row per FocusSession. Tapping is real (navigates), but the
// destination is a Track 2/Pro placeholder — the Session Timeline itself
// isn't built yet.
type SessionListRowProps = {
  session: ISessionSummary;
  onPress: (session: ISessionSummary) => void;
  showDate?: boolean;
};

const ROUGHNESS_LABEL: Record<SESSION_ROUGHNESS, string> = {
  [SESSION_ROUGHNESS.CLEAN]: "Clean",
  [SESSION_ROUGHNESS.MIXED]: "Some friction",
  [SESSION_ROUGHNESS.ROUGH]: "Rough",
};

export function SessionListRow({ session, onPress, showDate = false }: SessionListRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  const badgeColor =
    session.roughness === SESSION_ROUGHNESS.ROUGH
      ? colors.danger
      : session.roughness === SESSION_ROUGHNESS.MIXED
        ? colors.warning
        : colors.text;

  const timeRange = formatTimeRange(session.startedAt, session.endedAt);
  const meta = showDate ? `${formatSessionDate(session.startedAt)}, ${timeRange}` : timeRange;
  const roughnessLabel = ROUGHNESS_LABEL[session.roughness];

  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(session)}
      accessibilityRole="button"
      accessibilityLabel={`${session.missionTitle}, ${meta}, ${roughnessLabel}`}
    >
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>
          {session.missionTitle}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={[styles.badge, { borderColor: badgeColor }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{roughnessLabel}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    main: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    meta: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: spacing.xxxs,
      fontVariant: ["tabular-nums"],
    },
    badge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      flexShrink: 0,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    chevron: {
      color: colors.textFaint,
      fontSize: 14,
      flexShrink: 0,
    },
  });
