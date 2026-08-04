import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { Toggle } from "@/components/ui/Toggle";
import { useBlocklist } from "@/module/settings/hooks/useBlocklist";
import { InstalledApp, useInstalledApps } from "@/module/settings/hooks/useInstalledApps";
import { BLOCKLIST_DEFAULT_APPS } from "@/module/settings/utils/constants";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

type BlockedAppRowProps = {
  app: InstalledApp;
  isBlocked: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
};

function BlockedAppRow({ app, isBlocked, onToggle, disabled, isLast }: BlockedAppRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={[styles.row, !isLast && styles.rowWithBorder]}>
      <Text style={[styles.dot, { color: isBlocked ? colors.text : colors.textSecondary }]}>●</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{app.appName}</Text>
      </View>
      <Toggle
        value={isBlocked}
        onValueChange={onToggle}
        disabled={disabled}
        accessibilityLabel={`Block ${app.appName}`}
      />
    </View>
  );
}

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

  const hasSeededRef = useRef(false);
  // Already-seeded users never wait; a fresh user's toggles stay disabled
  // until the one-time seed attempt resolves (success or failure), so a
  // manual toggle can never race the seed's own writes to the same rows.
  const [seedResolved, setSeedResolved] = useState(() => user?.blocklistDefaultsSeeded ?? false);

  const blockedPackageNames = useMemo(
    () => new Set(blockedApps.map((app) => app.packageName)),
    [blockedApps],
  );

  useEffect(() => {
    if (hasSeededRef.current) return;
    if (!user || user.blocklistDefaultsSeeded) return;
    // Wait for a definitive answer from the native module before seeding —
    // if it errored we don't know what's actually installed, so skip rather
    // than guess (a later successful visit will seed correctly instead).
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
        // Let a future mount retry — the backend no-ops safely either way.
        hasSeededRef.current = false;
      })
      .finally(() => setSeedResolved(true));
  }, [user, apps, appsLoading, appsError, seedDefaults, updateUser]);

  const handleToggle = (app: InstalledApp, value: boolean) => {
    if (value) {
      addApp({ packageName: app.packageName, appName: app.appName }).catch(() => undefined);
    } else {
      removeApp(app.packageName).catch(() => undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title="Blocked Apps" onBack={() => router.back()} />
      <View style={styles.content}>
        <Text style={styles.intro}>
          Choose which apps to block during a focus session. Toggle any installed app on or off.
        </Text>

        {mutationError && <Text style={styles.error}>{mutationError}</Text>}

        {appsLoading ? (
          <ActivityIndicator color={colors.text} style={styles.spinner} />
        ) : appsError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Can&apos;t list installed apps</Text>
            <Text style={styles.errorBody}>{appsError}</Text>
            <Text style={styles.errorBody}>
              If this is a fresh install, it likely needs the latest dev-client build — a plain
              Expo Go / JS-only reload won&apos;t have it yet.
            </Text>
          </View>
        ) : (
          <StatCard style={styles.card}>
            {!seedResolved && (
              <Text style={styles.settingUp}>Setting up your defaults…</Text>
            )}
            <FlatList
              data={apps}
              keyExtractor={(item) => item.packageName}
              renderItem={({ item, index }) => (
                <BlockedAppRow
                  app={item}
                  isBlocked={blockedPackageNames.has(item.packageName)}
                  onToggle={(value) => handleToggle(item, value)}
                  disabled={
                    !seedResolved ||
                    pendingAddPackageName === item.packageName ||
                    pendingRemovePackageName === item.packageName
                  }
                  isLast={index === apps.length - 1}
                />
              )}
              ListEmptyComponent={<Text style={styles.empty}>No installed apps found.</Text>}
            />
          </StatCard>
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
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    card: {
      flex: 1,
    },
    settingUp: {
      color: colors.textSecondary,
      fontSize: 12.5,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    rowWithBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    dot: {
      fontSize: 10,
    },
    rowText: {
      flex: 1,
      gap: spacing.xxxs,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 16,
    },
    spinner: {
      marginTop: spacing.xl,
    },
    empty: {
      color: colors.textSecondary,
      textAlign: "center",
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
