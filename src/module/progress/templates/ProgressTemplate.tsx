import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LabelValueRow } from "@/components/content/LabelValueRow";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Sparkline } from "@/module/progress/components/Sparkline";
import { StreakCalendar } from "@/module/progress/components/StreakCalendar";
import { WeeklyBarChart } from "@/module/progress/components/WeeklyBarChart";
import { useProgress } from "@/module/progress/hooks/useProgress";
import { routes } from "@/config/routes";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IFocusWindow } from "@/types";

const NOT_ENOUGH_DATA_YET = "Not enough data yet";

const formatFocusWindow = ({ startHour, endHour }: IFocusWindow): string => {
  const period = (hour: number) => (hour >= 12 ? "pm" : "am");
  const display = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);
  return `${display(startHour)}${period(startHour)}-${display(endHour)}${period(endHour)}`;
};

export function ProgressTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { progress, isLoading, isRefetching, error, refresh } = useProgress();

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
            {formatMinutesAsHoursAndMinutes(progress.timeReclaimedThisWeekMinutes)}{" "}
            <Text style={styles.reclaimedUnit}>this week</Text>
          </Text>
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
          <LabelValueRow label="Distraction attempts" value={`${progress.distractionAttemptsThisWeek} this week`} />
        </StatCard>

        <View style={styles.teaser}>
          <Text style={styles.teaserIcon}>🔒</Text>
          <View style={styles.teaserCopy}>
            <Text style={styles.teaserHeadline}>Advanced analytics</Text>
            <Text style={styles.teaserBody}>
              Hourly breakdowns, distraction-app detail, and coaching insights with Pro.
            </Text>
          </View>
        </View>
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
      marginBottom: spacing.sm,
    },
    reclaimedUnit: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "400",
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
    teaser: {
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: 20,
    },
    teaserIcon: {
      fontSize: 18,
    },
    teaserCopy: {
      flex: 1,
      gap: spacing.xxxs,
    },
    teaserHeadline: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
    },
    teaserBody: {
      color: colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
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
