import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Companion } from "@/components/content/Companion";
import { LabelValueRow } from "@/components/content/LabelValueRow";
import { StatCard } from "@/components/content/StatCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TopBar } from "@/components/navigation/TopBar";
import { useDashboard } from "@/module/dashboard/hooks/useDashboard";
import { routes } from "@/config/routes";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { IColorTokens, spacing, useColors } from "@/theme";

type IEveningReviewState = "default" | "zero-backlog" | "no-sessions";

const getState = (sessionsCompleted: number, backlogCount: number): IEveningReviewState => {
  if (sessionsCompleted === 0) {
    return "no-sessions";
  }
  return backlogCount === 0 ? "zero-backlog" : "default";
};

const getHeadline = (state: IEveningReviewState): string =>
  state === "zero-backlog" ? "Full clear today." : "Today, in numbers.";

const getStatusText = (state: IEveningReviewState, backlogCount: number): string => {
  if (state === "no-sessions") {
    return "No sessions today — tomorrow's a clean slate.";
  }
  if (state === "zero-backlog") {
    return "Zero backlog. That's the whole job.";
  }
  return `${backlogCount} ${backlogCount === 1 ? "task carries" : "tasks carry"} to tomorrow — no penalty, just tomorrow's start.`;
};

export function EveningReviewTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { dashboard, isLoading, error, refresh } = useDashboard();

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

  if (!dashboard) {
    return null;
  }

  const state = getState(dashboard.today.sessionsCompleted, dashboard.backlogCount);
  const trailingDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title="Today" trailingDate={trailingDate} onBack={() => router.push(routes.tabs.home())} />
      <View style={styles.content}>
        <View style={styles.companionZone}>
          <Companion state="reflective" />
          <Text style={styles.headline}>{getHeadline(state)}</Text>
        </View>

        <StatCard>
          <LabelValueRow label="Sessions completed" value={`${dashboard.today.sessionsCompleted}`} />
          <LabelValueRow
            label="Time focused"
            value={formatMinutesAsHoursAndMinutes(dashboard.today.minutesFocused)}
          />
          <LabelValueRow label="Backlog remaining" value={`${dashboard.backlogCount}`} />
        </StatCard>

        <Text style={styles.statusText}>{getStatusText(state, dashboard.backlogCount)}</Text>

        <View style={styles.spacer} />

        <View style={styles.ctaWrapper}>
          <PrimaryButton label="See your trend" onPress={() => router.push(routes.tabs.progress())} />
          <Text style={styles.ctaSubcaption}>Streak, time reclaimed, focus over time</Text>
        </View>
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
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    companionZone: {
      alignItems: "center",
      gap: spacing.sm,
      paddingTop: spacing.xl,
    },
    headline: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
    },
    statusText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      paddingTop: spacing.md,
    },
    spacer: {
      flex: 1,
    },
    ctaWrapper: {
      alignItems: "center",
      gap: spacing.xs,
      paddingBottom: spacing.sm,
    },
    ctaSubcaption: {
      color: colors.textSecondary,
      fontSize: 11,
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
  });
