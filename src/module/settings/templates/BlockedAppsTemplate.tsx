import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { formatMinutesAsHoursAndMinutes } from "@/lib/utils/format";
import { BlockedAppRow } from "@/module/settings/components/BlockedAppRow";
import { useBlocklist } from "@/module/settings/hooks/useBlocklist";
import { useInstalledApps } from "@/module/settings/hooks/useInstalledApps";
import { BLOCKLIST_DEFAULT_APPS } from "@/module/settings/utils/constants";
import { useIngestUsageStats } from "@/module/progress/hooks/useIngestUsageStats";
import { useProgress } from "@/module/progress/hooks/useProgress";
import { useUsageAccessStatus } from "@/module/progress/hooks/useUsageAccessStatus";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import * as UsageStats from "../../../../modules/usage-stats";

type ListItem =
  | { key: string; kind: "sectionHeader"; label: string; count: number }
  | { key: string; kind: "empty"; message: string }
  | {
      key: string;
      kind: "row";
      packageName: string;
      appName: string;
      subLabel?: string;
      action: "add" | "remove";
      disabled: boolean;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

export function BlockedAppsTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user, updateUser } = useAuthStore();
  const { apps, isLoading: appsLoading, error: appsError } = useInstalledApps();
  const {
    blockedApps,
    mutationError,
    addApp,
    removeApp,
    seedDefaults,
    pendingAddPackageName,
    pendingRemovePackageName,
  } = useBlocklist();
  const { progress } = useProgress();
  const isUsageAccessGranted = useUsageAccessStatus();
  useIngestUsageStats(isUsageAccessGranted);

  const hasSeededRef = useRef(false);
  // Already-seeded users never wait; a fresh user's rows stay disabled until
  // the one-time seed attempt resolves (success or failure), so a manual
  // add/remove can never race the seed's own writes to the same rows.
  const [seedResolved, setSeedResolved] = useState(() => user?.blocklistDefaultsSeeded ?? false);

  useEffect(() => {
    if (hasSeededRef.current) return;
    if (!user || user.blocklistDefaultsSeeded) return;
    if (appsLoading || appsError) return;

    hasSeededRef.current = true;
    const installedPackageNames = new Set(apps.map((app) => app.packageName));
    const defaultsToSeed = BLOCKLIST_DEFAULT_APPS.filter((defaultApp) =>
      installedPackageNames.has(defaultApp.packageName),
    );

    seedDefaults(defaultsToSeed)
      .then(() =>
        updateUser((current) =>
          current ? { ...current, blocklistDefaultsSeeded: true } : current,
        ),
      )
      .catch(() => {
        hasSeededRef.current = false;
      })
      .finally(() => setSeedResolved(true));
  }, [user, apps, appsLoading, appsError, seedDefaults, updateUser]);

  const blockedPackageNames = useMemo(
    () => new Set(blockedApps.map((app) => app.packageName)),
    [blockedApps],
  );
  const installedPackageNames = useMemo(
    () => new Set(apps.map((app) => app.packageName)),
    [apps],
  );

  // Only present once the on-device usage-stats sync has actually landed a
  // row for today — distinct from "0 minutes", which is a real reading.
  const hasUsageData = Boolean(progress?.screenTime);
  const usageByPackage = useMemo(() => {
    const map = new Map<string, number>();
    progress?.screenTime?.apps.forEach((row) => map.set(row.packageName, row.foregroundSeconds));
    return map;
  }, [progress]);

  const formatUsage = (packageName: string): string | undefined => {
    if (!hasUsageData) return undefined;
    return formatMinutesAsHoursAndMinutes(Math.round((usageByPackage.get(packageName) ?? 0) / 60));
  };

  const isRowDisabled = (packageName: string) =>
    !seedResolved || pendingAddPackageName === packageName || pendingRemovePackageName === packageName;

  const listItems = useMemo<ListItem[]>(() => {
    const blockedRows = blockedApps.map((app) => ({
      packageName: app.packageName,
      appName: app.appName,
      subLabel: installedPackageNames.has(app.packageName) ? formatUsage(app.packageName) : "Not installed",
    }));
    const availableRows = apps
      .filter((app) => !blockedPackageNames.has(app.packageName))
      .map((app) => ({
        packageName: app.packageName,
        appName: app.appName,
        subLabel: formatUsage(app.packageName),
      }));

    const items: ListItem[] = [
      { key: "header-blocked", kind: "sectionHeader", label: "Blocked", count: blockedRows.length },
    ];
    if (blockedRows.length === 0) {
      items.push({ key: "empty-blocked", kind: "empty", message: "No apps blocked yet — tap + on any app below." });
    } else {
      blockedRows.forEach((row, index) =>
        items.push({
          key: `blocked-${row.packageName}`,
          kind: "row",
          ...row,
          action: "remove",
          disabled: isRowDisabled(row.packageName),
          isFirstInGroup: index === 0,
          isLastInGroup: index === blockedRows.length - 1,
        }),
      );
    }

    items.push({ key: "header-available", kind: "sectionHeader", label: "All apps", count: availableRows.length });
    if (availableRows.length === 0) {
      items.push({ key: "empty-available", kind: "empty", message: "No other installed apps found." });
    } else {
      availableRows.forEach((row, index) =>
        items.push({
          key: `available-${row.packageName}`,
          kind: "row",
          ...row,
          action: "add",
          disabled: isRowDisabled(row.packageName),
          isFirstInGroup: index === 0,
          isLastInGroup: index === availableRows.length - 1,
        }),
      );
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, blockedApps, blockedPackageNames, installedPackageNames, usageByPackage, hasUsageData, seedResolved, pendingAddPackageName, pendingRemovePackageName]);

  const blockedTimeLabel = hasUsageData
    ? formatMinutesAsHoursAndMinutes(
        Math.round(
          blockedApps.reduce((total, app) => total + (usageByPackage.get(app.packageName) ?? 0), 0) / 60,
        ),
      )
    : "—";

  const handleRowPress = (item: Extract<ListItem, { kind: "row" }>) => {
    if (item.action === "add") {
      addApp({ packageName: item.packageName, appName: item.appName }).catch(() => undefined);
    } else {
      removeApp(item.packageName).catch(() => undefined);
    }
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <Text style={styles.intro}>
        Apps blocked during a focus session. Usage shown is today&apos;s screen time.
      </Text>
      {mutationError && <Text style={styles.error}>{mutationError}</Text>}
      <StatCard style={styles.summaryCard}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryNum}>{blockedApps.length}</Text>
          <Text style={styles.summaryLabel}>APPS BLOCKED</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryNum, styles.summaryNumAccent]}>{blockedTimeLabel}</Text>
          <Text style={styles.summaryLabel}>BLOCKED TIME TODAY</Text>
        </View>
      </StatCard>
      {isUsageAccessGranted === false && (
        <Pressable
          onPress={() => UsageStats.openUsageAccessSettings()}
          style={styles.nudgeRow}
          accessibilityRole="button"
          accessibilityLabel="Enable Usage Access to see blocked time today"
        >
          <Text style={styles.nudgeText}>Enable Usage Access to see time blocked today</Text>
          <Text style={styles.nudgeChevron}>›</Text>
        </Pressable>
      )}
      {!seedResolved && <Text style={styles.settingUp}>Setting up your defaults…</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title="Blocked Apps" onBack={() => router.back()} />
      <View style={styles.content}>
        {appsLoading ? (
          <>
            {listHeader}
            <ActivityIndicator color={colors.text} style={styles.spinner} />
          </>
        ) : appsError ? (
          <>
            {listHeader}
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Can&apos;t list installed apps</Text>
              <Text style={styles.errorBody}>{appsError}</Text>
              <Text style={styles.errorBody}>
                If this is a fresh install, it likely needs the latest dev-client build — a plain
                Expo Go / JS-only reload won&apos;t have it yet.
              </Text>
            </View>
          </>
        ) : (
          <FlatList
            data={listItems}
            keyExtractor={(item) => item.key}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              if (item.kind === "sectionHeader") {
                return (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>{item.label}</Text>
                    <Text style={styles.sectionCount}>{item.count}</Text>
                  </View>
                );
              }
              if (item.kind === "empty") {
                return <Text style={styles.emptyMessage}>{item.message}</Text>;
              }
              return (
                <BlockedAppRow
                  appName={item.appName}
                  subLabel={item.subLabel}
                  action={item.action}
                  onPress={() => handleRowPress(item)}
                  disabled={item.disabled}
                  isFirstInGroup={item.isFirstInGroup}
                  isLastInGroup={item.isLastInGroup}
                />
              );
            }}
          />
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
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    headerBlock: {
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryStat: {
      flex: 1,
      gap: spacing.xxxs,
    },
    summaryDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.borderSubtle,
      marginHorizontal: spacing.md,
    },
    summaryNum: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    summaryNumAccent: {
      color: colors.accent,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 10.5,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    nudgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
    },
    nudgeText: {
      color: colors.textSecondary,
      fontSize: 12.5,
      flex: 1,
    },
    nudgeChevron: {
      color: colors.textFaint,
      fontSize: 17,
    },
    settingUp: {
      color: colors.textSecondary,
      fontSize: 12.5,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xxs,
      paddingBottom: spacing.xs,
      marginTop: spacing.lg,
    },
    sectionLabel: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    sectionCount: {
      color: colors.textMuted,
      fontSize: 12,
    },
    emptyMessage: {
      color: colors.textFaint,
      fontSize: 12.5,
      textAlign: "center",
      paddingVertical: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
    },
    spinner: {
      marginTop: spacing.xl,
    },
    error: {
      color: colors.danger,
      fontSize: 12.5,
    },
    errorCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: spacing.lg,
      gap: spacing.xxs,
    },
    errorTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    errorBody: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
  });
