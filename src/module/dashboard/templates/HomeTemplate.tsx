import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { SessionListRow } from "@/components/content/SessionListRow";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PermissionGapsSection } from "@/module/dashboard/components/PermissionGapsSection";
import { useDashboard } from "@/module/dashboard/hooks/useDashboard";
import { useRecentSessions } from "@/module/dashboard/hooks/useRecentSessions";
import { useAccessibilityStatus } from "@/module/focus/hooks/useAccessibilityStatus";
import { ScreenTimeAppRow } from "@/module/progress/components/ScreenTimeAppRow";
import { UsageAccessPrompt } from "@/module/progress/components/UsageAccessPrompt";
import { useIngestUsageStats } from "@/module/progress/hooks/useIngestUsageStats";
import { useProgress } from "@/module/progress/hooks/useProgress";
import { useUsageAccessStatus } from "@/module/progress/hooks/useUsageAccessStatus";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { ISessionSummary, ITrendDay } from "@/types";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const getWeekdayLabel = (dateKey: string): string => WEEKDAY_LABELS[new Date(`${dateKey}T00:00:00Z`).getUTCDay()];
const NOT_ENOUGH_DATA_YET = "Not enough data yet";
const SCREEN_TIME_APP_LIMIT = 5;
const RECENT_SESSIONS_LIMIT = 2;

export function HomeTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { dashboard, isLoading, isRefetching, error, refresh } = useDashboard();
  const { sessions: recentSessions, isLoading: isLoadingRecentSessions } = useRecentSessions(RECENT_SESSIONS_LIMIT);
  const { user } = useAuthStore();
  const { progress, isLoading: isProgressLoading } = useProgress();
  const isUsageAccessGranted = useUsageAccessStatus();
  const { isSyncing: isSyncingUsageStats } = useIngestUsageStats(isUsageAccessGranted);
  const screenTimeApps = progress?.screenTime?.apps ?? [];
  const screenTimeMaxSeconds = screenTimeApps[0]?.foregroundSeconds ?? 0;

  // Same isAccessibilityServiceEnabled check FocusSessionTemplate does while
  // it's mounted — surfaced here too because a session can now stay active
  // while you're away from that screen (e.g. in Settings editing the
  // blocklist), and the permission being revoked mid-session would otherwise
  // go unnoticed until you happen to navigate back into it. Also doubles as
  // the gate for the Start CTA below and for PermissionGapsSection's rows.
  const isAccessibilityGranted = useAccessibilityStatus();
  const permissionsGranted =
    Platform.OS !== "android" || (isAccessibilityGranted === true && isUsageAccessGranted === true);

  // One-time just-in-time permission nudge (design-artifacts/evolution/specs/
  // 06-permission-priming.md) — routes through it instead of straight to
  // Start Mission Flow only the first time, only on Android, and only if the
  // permission isn't already granted some other way (e.g. via 5.1 Settings).
  const handleStart = () => {
    if (dashboard?.activeSession) {
      router.push(routes.focusSession(dashboard.activeSession.missionId));
      return;
    }
    if (Platform.OS === "android" && user && !user.accessibilityPrimingShown && isAccessibilityGranted === false) {
      router.push(routes.permissionPriming());
      return;
    }
    router.push(routes.startMission());
  };

  const handleSessionPress = (session: ISessionSummary) => {
    router.push(routes.sessionTimeline(session.id));
  };

  if (isLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.centeredSafeArea}>
        <ActivityIndicator color={colors.text} />
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={styles.centeredSafeArea}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.retryButton}>
          <PrimaryButton label="Retry" onPress={refresh} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="tab-root" onAvatarPress={() => router.push(routes.tabs.settings())} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl tintColor={colors.text} refreshing={isRefetching} onRefresh={refresh} />}
      >
        {dashboard && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.body}>
            <Pressable
              style={styles.companionStrip}
              onPress={() => router.push(routes.beesHive())}
              accessibilityRole="button"
              accessibilityLabel="Open Bee's Hive"
            >
              <Companion state="idle" caption="At rest — ready when you are." />
            </Pressable>

            {dashboard.activeSession && (
              <Pressable
                onPress={() => router.push(routes.focusSession(dashboard.activeSession!.missionId))}
                accessibilityRole="button"
                accessibilityLabel="Resume your focus session in progress"
              >
                <StatCard style={styles.activeSessionCard}>
                  <Text style={styles.activeSessionHeadline}>Focus session in progress</Text>
                  <Text style={styles.activeSessionMeta}>Tap to resume</Text>
                  {isAccessibilityGranted === false && (
                    <Text style={styles.activeSessionWarning}>
                      Blocking permission is off — resume to fix it
                    </Text>
                  )}
                </StatCard>
              </Pressable>
            )}

            <View style={styles.statRow}>
              <View style={styles.statTile} accessible accessibilityLabel={`${dashboard.streakDays} day streak`}>
                <Text style={[styles.statValue, styles.statValueAccent]}>{dashboard.streakDays}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statTile} accessible accessibilityLabel={`${dashboard.backlogCount} backlog`}>
                <Text style={styles.statValue}>{dashboard.backlogCount}</Text>
                <Text style={styles.statLabel}>Backlog</Text>
              </View>
              <View
                style={styles.statTile}
                accessible
                accessibilityLabel={`${formatMinutesAsHoursAndMinutes(dashboard.timeReclaimedMinutes)} reclaimed`}
              >
                <Text style={styles.statValue}>{formatMinutesAsHoursAndMinutes(dashboard.timeReclaimedMinutes)}</Text>
                <Text style={styles.statLabel}>Reclaimed</Text>
              </View>
            </View>

            <View style={styles.trendSection}>
              <Text style={styles.trendLabel}>This week</Text>
              <View style={styles.trendRow}>
                {dashboard.trend.map((day: ITrendDay) => (
                  <View key={day.date} style={styles.trendCell}>
                    <View
                      style={[
                        styles.trendBar,
                        day.status === "hit" && styles.trendBarHit,
                        day.status === "today" && styles.trendBarToday,
                      ]}
                    />
                    <Text style={styles.trendDayLabel}>{getWeekdayLabel(day.date)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <PermissionGapsSection />

            <Pressable
              onPress={() => router.push(routes.eveningReview())}
              accessibilityRole="button"
              accessibilityLabel="See today's evening review"
            >
              <StatCard>
                <Text style={styles.todayHeadline}>Yesterday&apos;s a blank — today&apos;s wide open.</Text>
                <Text style={styles.todayMeta}>
                  {dashboard.today.sessionsCompleted} sessions · {dashboard.today.minutesFocused}m focused
                  today · {dashboard.today.tasksWaiting} flexible tasks waiting
                  {dashboard.today.roughSessionCount > 0 && (
                    <Text style={styles.roughFlag}> · {dashboard.today.roughSessionCount} rough</Text>
                  )}
                </Text>
              </StatCard>
            </Pressable>

            {!isLoadingRecentSessions && recentSessions.length > 0 && (
              <StatCard>
                <Text style={styles.sectionLabel}>Recent sessions</Text>
                {recentSessions.map((session) => (
                  <SessionListRow key={session.id} session={session} onPress={handleSessionPress} showDate />
                ))}
                <Pressable
                  style={styles.seeAllRow}
                  onPress={() => router.push(routes.history())}
                  accessibilityRole="button"
                  accessibilityLabel="See all sessions"
                >
                  <Text style={styles.seeAllLabel}>See all</Text>
                  <Text style={styles.seeAllArrow}>→</Text>
                </Pressable>
              </StatCard>
            )}

            <StatCard>
              <View style={styles.signalRow}>
                <Text style={styles.signalIcon}>◷</Text>
                <Text style={styles.signal}>
                  {dashboard.isColdStart || !dashboard.patternSignal
                    ? "Patterns will show up here after a few sessions."
                    : dashboard.patternSignal}
                </Text>
              </View>
            </StatCard>

            {Platform.OS === "android" && (
              <StatCard>
                <Text style={styles.sectionLabel}>Screen Time</Text>
                {isUsageAccessGranted === null || isProgressLoading ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : isUsageAccessGranted === false ? (
                  <UsageAccessPrompt />
                ) : !progress || progress.screenTime === null ? (
                  isSyncingUsageStats ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : (
                    <Text style={styles.emptyText}>{NOT_ENOUGH_DATA_YET}</Text>
                  )
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
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.ctaWrapper}>
        {dashboard?.activeSession || permissionsGranted ? (
          <PrimaryButton label="Start" onPress={handleStart} />
        ) : (
          <PrimaryButton label="Allow permissions to start" onPress={handleStart} disabled />
        )}
      </View>
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
      paddingBottom: spacing.md,
    },
    body: {
      gap: spacing.md,
    },
    companionStrip: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    statTile: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xxxs,
    },
    statValue: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    statValueAccent: {
      color: colors.accent,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    trendSection: {
      gap: spacing.xs,
    },
    trendLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    trendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    trendCell: {
      alignItems: "center",
      gap: spacing.xxxs,
    },
    trendBar: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: colors.surfaceAlt,
    },
    trendBarHit: {
      backgroundColor: colors.text,
    },
    trendBarToday: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.text,
    },
    trendDayLabel: {
      color: colors.textSecondary,
      fontSize: 9,
    },
    activeSessionCard: {
      borderColor: colors.accent,
    },
    activeSessionHeadline: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    activeSessionMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: spacing.xxxs,
    },
    activeSessionWarning: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: "600",
      marginTop: spacing.xxs,
    },
    todayHeadline: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },
    todayMeta: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: spacing.xxxs,
      fontVariant: ["tabular-nums"],
    },
    roughFlag: {
      color: colors.danger,
      fontWeight: "600",
    },
    seeAllRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing.sm,
      marginTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    seeAllLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    seeAllArrow: {
      color: colors.textMuted,
      fontSize: 12,
    },
    signalRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    signalIcon: {
      color: colors.textMuted,
      fontSize: 14,
    },
    signal: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 12,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      marginBottom: spacing.sm,
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
    ctaWrapper: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      paddingTop: spacing.xs,
    },
    errorText: {
      color: colors.danger,
      fontSize: 15,
      textAlign: "center",
    },
    retryButton: {
      width: "100%",
    },
  });
