import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { DistractionTimingCard } from "@/module/history/components/DistractionTimingCard";
import { useSessionTimeline } from "@/module/history/hooks/useSessionTimeline";
import { buildTimelineEntries } from "@/module/history/utils/buildTimelineEntries";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { formatMinutesAsHoursAndMinutes, formatTimeRange } from "@/lib/utils/format";
import { SESSION_ROUGHNESS } from "@/utils/enums";
import { IColorTokens, spacing, useColors } from "@/theme";

const ROUGHNESS_LABEL: Record<SESSION_ROUGHNESS, string> = {
  [SESSION_ROUGHNESS.CLEAN]: "Clean",
  [SESSION_ROUGHNESS.MIXED]: "Some friction",
  [SESSION_ROUGHNESS.ROUGH]: "Rough",
};

const LOCKED_ROW_LABELS = [
  { label: "Step-by-step timeline", sub: "When each step ran and how long it took" },
  { label: "Distraction events", sub: "Which app, and when, plotted against your steps" },
  { label: "Compared to your baseline", sub: "Whether this session's timing was typical for you" },
];

// design-artifacts/evolution/specs/14-session-timeline.md -- replaces
// SessionTimelinePlaceholderTemplate. Free users see the locked panel below
// (no request made, matches ProgressTemplate's Device Activity precedent);
// the backend independently 403s a non-Pro request to the same endpoint, so
// this isn't the only gate.
export function SessionTimelineTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { isPro } = useEntitlement();
  const { timeline, isLoading, error } = useSessionTimeline(sessionId, isPro);

  const badgeColor = timeline
    ? timeline.roughness === SESSION_ROUGHNESS.ROUGH
      ? colors.danger
      : timeline.roughness === SESSION_ROUGHNESS.MIXED
        ? colors.warning
        : colors.text
    : colors.text;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title={timeline?.missionTitle ?? "Session Timeline"} onBack={() => router.back()} />

      {timeline && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTime}>
            {formatTimeRange(timeline.startedAt, timeline.endedAt)} ·{" "}
            {formatMinutesAsHoursAndMinutes(
              Math.round((new Date(timeline.endedAt).getTime() - new Date(timeline.startedAt).getTime()) / 60000),
            )}
          </Text>
          <View style={[styles.badge, { borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{ROUGHNESS_LABEL[timeline.roughness]}</Text>
          </View>
        </View>
      )}

      {!isPro ? (
        <LockedBody colors={colors} styles={styles} />
      ) : isLoading ? (
        <ActivityIndicator color={colors.text} style={styles.spinner} />
      ) : error || !timeline ? (
        <Text style={styles.error}>{error ?? "This session couldn't be loaded."}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <DistractionTimingCard timing={timeline.distractionTiming} />
          <StatCard>
            <Text style={styles.sectionLabel}>What happened</Text>
            {buildTimelineEntries(timeline).map((entry, index, all) => (
              <TimelineRow key={`${entry.kind}-${entry.time}`} entry={entry} isLast={index === all.length - 1} colors={colors} styles={styles} />
            ))}
          </StatCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function LockedBody({ colors, styles }: { colors: IColorTokens; styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.SESSION_TIMELINE } })}
      style={styles.lockedPanel}
      accessibilityRole="button"
      accessibilityLabel="Locked. Session Timeline is a Pro feature."
    >
      <View style={styles.lockedPreview} importantForAccessibility="no-hide-descendants">
        {LOCKED_ROW_LABELS.map((row) => (
          <View key={row.label}>
            <Text style={styles.lockedRowLabel}>{row.label}</Text>
            <Text style={styles.lockedRowSub}>{row.sub}</Text>
          </View>
        ))}
      </View>
      <View style={styles.lockedOverlay}>
        <Text style={styles.lockedIcon}>🔒</Text>
        <Text style={styles.lockedHeadline}>Session Timeline</Text>
        <Text style={styles.lockedBody}>
          See exactly what happened this session — and how it compares to your usual pattern — with Pro.
        </Text>
      </View>
    </Pressable>
  );
}

type TimelineEntry = ReturnType<typeof buildTimelineEntries>[number];

function TimelineRow({
  entry,
  isLast,
  colors,
  styles,
}: {
  entry: TimelineEntry;
  isLast: boolean;
  colors: IColorTokens;
  styles: ReturnType<typeof createStyles>;
}) {
  const time = new Date(entry.time);
  const timeLabel = time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const isDistraction = entry.kind === "distraction";

  return (
    <View style={styles.tlRow}>
      <Text style={styles.tlTime}>{timeLabel}</Text>
      <View style={styles.tlDotCol}>
        <View
          style={[
            styles.tlDot,
            entry.kind === "sessionStart" || entry.kind === "sessionEnd" ? styles.tlDotBoundary : null,
            isDistraction && { backgroundColor: colors.danger },
          ]}
        />
        {!isLast && <View style={styles.tlLine} />}
      </View>
      <View style={styles.tlBody}>
        {entry.kind === "sessionStart" && <Text style={styles.tlBodyText}>Session started</Text>}
        {entry.kind === "sessionEnd" && (
          <Text style={styles.tlBodyText}>{entry.missionCompleted ? "Mission completed" : "Session ended"}</Text>
        )}
        {entry.kind === "step" && (
          <>
            <Text style={styles.tlBodyText}>{entry.title}</Text>
            <Text style={styles.tlSub}>
              {formatMinutesAsHoursAndMinutes(Math.round(entry.actualSeconds / 60))}
              {entry.estimatedMinutes !== null ? ` (est. ${entry.estimatedMinutes}m)` : ""}
            </Text>
          </>
        )}
        {entry.kind === "distraction" && (
          <>
            <Text style={[styles.tlBodyText, { color: colors.danger, fontWeight: "600" }]}>
              Blocked: {entry.appName}
            </Text>
            {entry.stepTitle && <Text style={styles.tlSub}>during &ldquo;{entry.stepTitle}&rdquo;</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    summaryTime: {
      fontSize: 11,
      color: colors.textSecondary,
      fontVariant: ["tabular-nums"],
    },
    badge: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    sectionLabel: {
      fontSize: 9.5,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    spinner: {
      marginTop: spacing.xl,
    },
    error: {
      color: colors.danger,
      textAlign: "center",
      marginTop: spacing.xl,
      fontSize: 13,
      paddingHorizontal: spacing.lg,
    },
    tlRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    tlTime: {
      fontSize: 10,
      color: colors.textMuted,
      width: 40,
      paddingTop: 1,
      fontVariant: ["tabular-nums"],
    },
    tlDotCol: {
      alignItems: "center",
      width: 8,
    },
    tlDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.text,
      marginTop: 2,
    },
    tlDotBoundary: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textFaint,
    },
    tlLine: {
      width: 1.5,
      flex: 1,
      backgroundColor: colors.border,
      marginTop: 3,
      minHeight: 16,
    },
    tlBody: {
      flex: 1,
      paddingBottom: spacing.sm,
    },
    tlBodyText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: "600",
    },
    tlSub: {
      fontSize: 10.5,
      color: colors.textMuted,
      marginTop: 2,
    },
    lockedPanel: {
      margin: spacing.lg,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      overflow: "hidden",
      minHeight: 260,
    },
    lockedPreview: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    lockedRowLabel: {
      color: colors.text,
      fontSize: 12.5,
      fontWeight: "600",
    },
    lockedRowSub: {
      color: colors.textMuted,
      fontSize: 10.5,
      marginTop: 2,
    },
    lockedOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg + "cc",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xxs,
      paddingHorizontal: spacing.lg,
    },
    lockedIcon: {
      fontSize: 18,
    },
    lockedHeadline: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    lockedBody: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 15,
    },
  });
