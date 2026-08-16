import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatCard } from "@/components/content/StatCard";
import { useAccessibilityStatus } from "@/module/focus/hooks/useAccessibilityStatus";
import { useUsageAccessStatus } from "@/module/progress/hooks/useUsageAccessStatus";
import { IColorTokens, spacing, useColors } from "@/theme";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";
import * as UsageStats from "../../../../modules/usage-stats";

type PermissionGapRowProps = {
  label: string;
  why: string;
  showDivider?: boolean;
  onPress: () => void;
};

function PermissionGapRow({ label, why, showDivider, onPress }: PermissionGapRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Pressable
      style={[styles.row, showDivider && styles.rowDivider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} — turn on in Settings`}
    >
      <Text style={styles.dot}>●</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowWhy}>{why}</Text>
      </View>
      <Text style={styles.link}>›</Text>
    </Pressable>
  );
}

// Android-only — both permissions here are special app-ops with no in-app
// prompt (see PermissionsSection.tsx), so the only way to grant them is a
// deep link to system Settings. Renders nothing once both are granted, or
// while either status is still resolving (null) — no point flashing a "fix
// this" card for a gap that might not exist.
export function PermissionGapsSection() {
  const colors = useColors();
  const styles = createStyles(colors);
  const isAccessibilityGranted = useAccessibilityStatus();
  const isUsageAccessGranted = useUsageAccessStatus();

  if (Platform.OS !== "android") return null;

  const missingAccessibility = isAccessibilityGranted === false;
  const missingUsageAccess = isUsageAccessGranted === false;

  if (!missingAccessibility && !missingUsageAccess) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Permissions needed</Text>
      <StatCard style={styles.card}>
        {missingAccessibility && (
          <PermissionGapRow
            label="Block distracting apps"
            why="Without it, blocked apps won't actually be stopped during a session."
            onPress={() => BlockingEnforcement.openAccessibilitySettings()}
          />
        )}
        {missingUsageAccess && (
          <PermissionGapRow
            label="Usage access"
            why="Without it, Screen Time and Device Activity won't have real data."
            onPress={() => UsageStats.openUsageAccessSettings()}
            showDivider={missingAccessibility}
          />
        )}
      </StatCard>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    section: {
      gap: spacing.xs,
    },
    sectionLabel: {
      color: colors.danger,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    card: {
      backgroundColor: colors.dangerGlow,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    rowDivider: {
      marginTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
    },
    dot: {
      color: colors.danger,
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
    rowWhy: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    link: {
      color: colors.danger,
      fontSize: 20,
      fontWeight: "700",
    },
  });
