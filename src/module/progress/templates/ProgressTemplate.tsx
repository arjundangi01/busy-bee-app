import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LabelValueRow } from "@/components/content/LabelValueRow";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { DeviceActivityRow } from "@/module/progress/components/DeviceActivityRow";
import { ScreenTimeAppRow } from "@/module/progress/components/ScreenTimeAppRow";
import { Sparkline } from "@/module/progress/components/Sparkline";
import { StreakCalendar } from "@/module/progress/components/StreakCalendar";
import { UsageAccessPrompt } from "@/module/progress/components/UsageAccessPrompt";
import { WeeklyBarChart } from "@/module/progress/components/WeeklyBarChart";
import { useIngestUsageStats } from "@/module/progress/hooks/useIngestUsageStats";
import { useProgress } from "@/module/progress/hooks/useProgress";
import { useUsageAccessStatus } from "@/module/progress/hooks/useUsageAccessStatus";
import {
  avgMinutesSinceLocalMidnight,
  computeDeltaDisplay,
  formatClockTime,
  minutesSinceLocalMidnight,
} from "@/module/progress/utils/deviceActivityDelta";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { routes } from "@/config/routes";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IFocusWindow } from "@/types";

const NOT_ENOUGH_DATA_YET = "Not enough data yet";
const SCREEN_TIME_APP_LIMIT = 5;
// Free-tier locked preview shows these real row labels faded behind the
// lock — the "real shape, not generic decoration" the spec calls for —
// without ever rendering a Free user's actual numbers (or a fabricated
// stand-in) under it.
const DEVICE_ACTIVITY_ROW_LABELS = ["Phone pickups", "Offline time", "First pickup", "Last pickup", "Distractions", "Sleep"];

const formatDurationDelta = (seconds: number): string => formatMinutesAsHoursAndMinutes(Math.round(seconds / 60));

const formatFocusWindow = ({ startHour, endHour }: IFocusWindow): string => {
  const period = (hour: number) => (hour >= 12 ? "pm" : "am");
  const display = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);
  return `${display(startHour)}${period(startHour)}-${display(endHour)}${period(endHour)}`;
};

export function ProgressTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { progress, isLoading, isRefetching, error, refresh } = useProgress();
  const { isPro } = useEntitlement();
  const isUsageAccessGranted = useUsageAccessStatus();
  useIngestUsageStats();

  if (isLoading && !progress) {
    return (
      <SafeAreaView style={styles.centeredSafeArea}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  if (error && !progress) {
    return (
      <SafeAreaView style={styles.centeredSafeArea}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.retryButton}>
          <PrimaryButton label="Retry" onPress={refresh} />
        </View>
      </SafeAreaView>
    );
  }

  if (!progress) {
    return null;
  }

  const screenTimeApps = progress.screenTime?.apps ?? [];
  const screenTimeMaxSeconds = screenTimeApps[0]?.foregroundSeconds ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="tab-root" onAvatarPress={() => router.push(routes.tabs.settings())} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl tintColor={colors.text} refreshing={isRefetching} onRefresh={refresh} />}
      >
        <Text style={styles.pageTitle}>Your Progress</Text>

        <StatCard>
          <Text style={styles.sectionLabel}>Streak</Text>
          <View style={styles.streakHeaderRow}>
            <View>
              <Text style={styles.streakValue}>{progress.currentStreakDays}</Text>
              <Text style={styles.streakSubLabel}>day streak</Text>
            </View>
            <Text style={styles.streakBest}>Best: {progress.bestStreakDays}</Text>
          </View>
          <StreakCalendar cells={progress.streakCalendar} />
        </StatCard>

        <StatCard>
          <Text style={styles.sectionLabel}>Time Reclaimed</Text>
          <Text style={styles.reclaimedValue}>
            {formatMinutesAsHoursAndMinutes(progress.timeReclaimedThisWeekMinutes)} (est.){" "}
            <Text style={styles.reclaimedUnit}>this week</Text>
          </Text>
          <Text style={styles.reclaimedCaption}>Estimated from blocked attempts, not measured time</Text>
          {progress.timeReclaimedByWeekMinutes.length > 0 && (
            <WeeklyBarChart valuesByWeek={progress.timeReclaimedByWeekMinutes} />
          )}
        </StatCard>

        <StatCard>
          <Text style={styles.sectionLabel}>Focus Improving</Text>
          <View style={styles.focusRow}>
            {progress.focusDurationByWeekMinutes.length > 0 && (
              <View style={styles.sparklineWrapper}>
                <Sparkline values={progress.focusDurationByWeekMinutes} />
              </View>
            )}
            <Text style={styles.focusEndValue}>
              {progress.currentAvgFocusMinutes === null ? "—" : `${progress.currentAvgFocusMinutes}m avg`}
            </Text>
          </View>
        </StatCard>

        <StatCard>
          <Text style={styles.sectionLabel}>Your Patterns</Text>
          <LabelValueRow
            label="Best focus window"
            value={progress.bestFocusWindow ? formatFocusWindow(progress.bestFocusWindow) : NOT_ENOUGH_DATA_YET}
          />
          <LabelValueRow label="Toughest day" value={progress.toughestDay ?? NOT_ENOUGH_DATA_YET} />
          <LabelValueRow
            label="Top distraction"
            value={
              progress.topDistraction
                ? `${progress.topDistraction.appName} · ${progress.topDistraction.count}×`
                : NOT_ENOUGH_DATA_YET
            }
          />
          <LabelValueRow
            label="Longest focus"
            value={
              progress.longestFocusMinutes !== null
                ? formatMinutesAsHoursAndMinutes(progress.longestFocusMinutes)
                : NOT_ENOUGH_DATA_YET
            }
          />
        </StatCard>

        <StatCard>
          <Text style={styles.sectionLabel}>Follow-Through</Text>
          <LabelValueRow
            label="Time to start"
            value={progress.timeToStartMinutes !== null ? `${progress.timeToStartMinutes}m avg` : NOT_ENOUGH_DATA_YET}
          />
          <LabelValueRow
            label="Bounce-back rate"
            value={progress.bounceBackRatePercent !== null ? `${progress.bounceBackRatePercent}%` : NOT_ENOUGH_DATA_YET}
          />
          <LabelValueRow label="Sessions ended early" value={`${progress.sessionsEndedEarlyThisWeek} this week`} />
          <LabelValueRow label="Tasks past their time" value={`${progress.tasksPastTheirTime} still open`} />
          <LabelValueRow
            label="Mission completion rate"
            value={
              progress.missionCompletionRatePercent !== null
                ? `${progress.missionCompletionRatePercent}%`
                : NOT_ENOUGH_DATA_YET
            }
          />
          <LabelValueRow
            label="Step completion rate"
            value={
              progress.stepCompletionRatePercent !== null
                ? `${progress.stepCompletionRatePercent}%`
                : NOT_ENOUGH_DATA_YET
            }
          />
        </StatCard>

        {Platform.OS === "android" && (
          <StatCard>
            <Text style={styles.sectionLabel}>Screen Time</Text>
            {isUsageAccessGranted === false ? (
              <UsageAccessPrompt />
            ) : progress.screenTime === null ? (
              <Text style={styles.emptyText}>{NOT_ENOUGH_DATA_YET}</Text>
            ) : (
              <>
                <Text style={styles.reclaimedValue}>
                  {formatMinutesAsHoursAndMinutes(Math.round(progress.screenTime.totalForegroundSeconds / 60))}{" "}
                  <Text style={styles.reclaimedUnit}>today</Text>
                </Text>
                {screenTimeApps.slice(0, SCREEN_TIME_APP_LIMIT).map((app) => (
                  <ScreenTimeAppRow
                    key={app.packageName}
                    appName={app.appName}
                    foregroundSeconds={app.foregroundSeconds}
                    isBlocked={app.isBlocked}
                    maxForegroundSeconds={screenTimeMaxSeconds}
                  />
                ))}
                {screenTimeApps.length > SCREEN_TIME_APP_LIMIT && (
                  <Text style={styles.moreAppsText}>+{screenTimeApps.length - SCREEN_TIME_APP_LIMIT} more</Text>
                )}
                <View style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                  <Text style={styles.legendText}>On your blocklist</Text>
                  <View style={[styles.legendDot, styles.legendDotSpaced, { backgroundColor: colors.textSecondary }]} />
                  <Text style={styles.legendText}>Everything else</Text>
                </View>
              </>
            )}
          </StatCard>
        )}

        {Platform.OS === "android" && !isPro && (
          <Pressable
            onPress={() => router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.ANALYTICS } })}
            style={styles.lockedPanel}
            accessibilityRole="button"
            accessibilityLabel="Locked. Advanced analytics is a Pro feature."
          >
            <View style={styles.lockedPreview} importantForAccessibility="no-hide-descendants">
              <Text style={styles.sectionLabel}>Device Activity</Text>
              {DEVICE_ACTIVITY_ROW_LABELS.map((label) => (
                <Text key={label} style={styles.lockedRowLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.lockedOverlay}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedHeadline}>Advanced analytics</Text>
              <Text style={styles.lockedBody}>Pickups, offline time & sleep, unlocked with Pro</Text>
            </View>
          </Pressable>
        )}

        {Platform.OS === "android" && isPro && (
          <StatCard>
            <Text style={styles.sectionLabel}>Device Activity</Text>
            {isUsageAccessGranted === false ? (
              <UsageAccessPrompt />
            ) : progress.deviceActivity === null ? (
              <Text style={styles.emptyText}>{NOT_ENOUGH_DATA_YET}</Text>
            ) : (
              <>
                <DeviceActivityRow
                  label="Phone pickups"
                  value={`${progress.deviceActivity.pickupCount.value}`}
                  delta={computeDeltaDisplay(
                    progress.deviceActivity.pickupCount.value,
                    progress.deviceActivity.pickupCount.avg7d,
                    false,
                    "aboveBelowAverage",
                    (magnitude) => `${magnitude}`,
                  )}
                />
                <DeviceActivityRow
                  label="Offline time"
                  value={formatDurationDelta(progress.deviceActivity.offlineSeconds.value)}
                  delta={computeDeltaDisplay(
                    progress.deviceActivity.offlineSeconds.value,
                    progress.deviceActivity.offlineSeconds.avg7d,
                    true,
                    "aboveBelowAverage",
                    formatDurationDelta,
                  )}
                />
                {progress.deviceActivity.firstPickupAt && (
                  <DeviceActivityRow
                    label="First pickup"
                    value={formatClockTime(progress.deviceActivity.firstPickupAt)}
                    delta={computeDeltaDisplay(
                      minutesSinceLocalMidnight(progress.deviceActivity.firstPickupAt),
                      avgMinutesSinceLocalMidnight(progress.deviceActivity.priorFirstPickupAts),
                      true,
                      "laterEarlierThanUsual",
                      formatMinutesAsHoursAndMinutes,
                    )}
                  />
                )}
                {progress.deviceActivity.lastPickupAt && (
                  <DeviceActivityRow
                    label="Last pickup"
                    value={formatClockTime(progress.deviceActivity.lastPickupAt)}
                    delta={computeDeltaDisplay(
                      minutesSinceLocalMidnight(progress.deviceActivity.lastPickupAt),
                      avgMinutesSinceLocalMidnight(progress.deviceActivity.priorLastPickupAts),
                      false,
                      "laterEarlierThanUsual",
                      formatMinutesAsHoursAndMinutes,
                    )}
                  />
                )}
                <DeviceActivityRow
                  label="Distractions"
                  value={formatDurationDelta(progress.deviceActivity.distractionsSeconds.value)}
                  delta={computeDeltaDisplay(
                    progress.deviceActivity.distractionsSeconds.value,
                    progress.deviceActivity.distractionsSeconds.avg7d,
                    false,
                    "aboveBelowAverage",
                    formatDurationDelta,
                    "time on blocklisted apps",
                  )}
                />
                <View style={styles.sleepRow}>
                  <View style={styles.headerRowInline}>
                    <Text style={styles.label}>Sleep</Text>
                    <Text style={styles.value}>Not tracked yet</Text>
                  </View>
                  <Text style={styles.sleepCaption}>
                    Needs its own HealthKit/Health Connect integration — not part of this module.
                  </Text>
                </View>
              </>
            )}
          </StatCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centeredSafeArea: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      paddingTop: spacing.md,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: spacing.sm,
    },
    streakHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: spacing.sm,
    },
    streakValue: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    streakSubLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    streakBest: {
      color: colors.textSecondary,
      fontSize: 12,
      fontVariant: ["tabular-nums"],
    },
    reclaimedValue: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      marginBottom: spacing.xxs,
    },
    reclaimedUnit: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "400",
    },
    reclaimedCaption: {
      color: colors.textMuted,
      fontSize: 11,
      marginBottom: spacing.sm,
    },
    focusRow: {
      gap: spacing.xs,
    },
    sparklineWrapper: {
      height: 40,
    },
    focusEndValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    lockedPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      overflow: "hidden",
      minHeight: 96,
    },
    lockedPreview: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    lockedRowLabel: {
      color: colors.text,
      fontSize: 13,
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
      lineHeight: 15,
      textAlign: "center",
    },
    errorText: {
      color: colors.danger,
      fontSize: 15,
      textAlign: "center",
    },
    retryButton: {
      width: "100%",
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    moreAppsText: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: spacing.xxs,
    },
    legendRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 999,
    },
    legendDotSpaced: {
      marginLeft: spacing.sm,
    },
    legendText: {
      color: colors.textMuted,
      fontSize: 10.5,
      marginLeft: spacing.xxs,
    },
    sleepRow: {
      paddingVertical: spacing.sm,
    },
    headerRowInline: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    value: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    sleepCaption: {
      color: colors.textFaint,
      fontSize: 10.5,
      marginTop: spacing.xxs,
    },
  });
