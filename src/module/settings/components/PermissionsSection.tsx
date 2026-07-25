import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { StatCard } from "@/components/content/StatCard";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";

type PermissionRowProps = {
  label: string;
  granted: boolean | null;
  offConsequence: string;
  isLast?: boolean;
  // Defaults to the app's own info page — the accessibility row below needs
  // Android's dedicated Accessibility settings screen instead, which is a
  // different destination entirely.
  onFixPress?: () => void;
};

function PermissionRow({ label, granted, offConsequence, isLast, onFixPress }: PermissionRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const isOn = granted === true;

  return (
    <View style={[styles.row, !isLast && styles.rowWithMargin]}>
      <Text style={[styles.dot, { color: isOn ? colors.text : colors.textSecondary }]}>●</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!isOn && <Text style={styles.rowMeta}>{offConsequence}</Text>}
      </View>
      {isOn ? (
        <Text style={styles.value}>On</Text>
      ) : (
        <Pressable onPress={onFixPress ?? (() => Linking.openSettings())} hitSlop={8}>
          <Text style={styles.link}>Fix in Settings ›</Text>
        </Pressable>
      )}
    </View>
  );
}

export function PermissionsSection() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  // Never stored server-side (unlike the other two rows) — it can change any
  // time via system Settings, so a persisted value would go stale
  // immediately. Checked live on mount instead, same as the mid-session
  // banner in useBlockingEnforcement.
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    BlockingEnforcement.isAccessibilityServiceEnabled().then(setIsAccessibilityEnabled);
  }, []);

  if (!user) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Permissions</Text>
      <StatCard>
        <PermissionRow
          label="Background execution"
          granted={user.backgroundExecutionGranted}
          offConsequence="Blocking won't survive locking your phone"
        />
        <PermissionRow
          label="Notifications"
          granted={user.notificationsGranted}
          offConsequence="You won't get the end-of-day nudge or in-session alerts"
          isLast={Platform.OS !== "android"}
        />
        {Platform.OS === "android" && (
          <PermissionRow
            label="Block distracting apps"
            granted={isAccessibilityEnabled}
            offConsequence="Blocked apps won't actually be stopped during a session"
            onFixPress={() => BlockingEnforcement.openAccessibilitySettings()}
            isLast
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
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    rowWithMargin: {
      marginBottom: spacing.sm,
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
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    value: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    link: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
  });
