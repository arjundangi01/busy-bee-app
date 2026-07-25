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
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useDashboard } from "@/module/dashboard/hooks/useDashboard";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { ITrendDay } from "@/types";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function HomeTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { dashboard, isLoading, isRefetching, error, refresh } = useDashboard();
  const { user } = useAuthStore();

  // One-time just-in-time permission nudge (design-artifacts/evolution/specs/
  // 06-permission-priming.md) — routes through it instead of straight to
  // Start Mission Flow only the first time, only on Android, and only if the
  // permission isn't already granted some other way (e.g. via 5.1 Settings).
  const handleStart = async () => {
    if (Platform.OS === "android" && user && !user.accessibilityPrimingShown) {
      const isEnabled = await BlockingEnforcement.isAccessibilityServiceEnabled();
      if (!isEnabled) {
        router.push(routes.permissionPriming());
        return;
      }
    }
    router.push(routes.startMission());
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
                {dashboard.trend.map((day: ITrendDay, index: number) => (
                  <View key={day.date} style={styles.trendCell}>
                    <View
                      style={[
                        styles.trendBar,
                        day.status === "hit" && styles.trendBarHit,
                        day.status === "today" && styles.trendBarToday,
                      ]}
                    />
                    <Text style={styles.trendDayLabel}>{DAY_LABELS[index % 7]}</Text>
                  </View>
                ))}
              </View>
            </View>

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
                </Text>
              </StatCard>
            </Pressable>

            <Text style={styles.signal}>
              {dashboard.isColdStart || !dashboard.patternSignal
                ? "Patterns will show up here after a few sessions."
                : dashboard.patternSignal}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.ctaWrapper}>
        <PrimaryButton label="Start" onPress={handleStart} />
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
    signal: {
      color: colors.textSecondary,
      fontSize: 11,
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
