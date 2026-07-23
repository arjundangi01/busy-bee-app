import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { StatCard } from "@/components/content/StatCard";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

type PermissionRowProps = {
  label: string;
  granted: boolean | null;
  offConsequence: string;
  isLast?: boolean;
};

function PermissionRow({ label, granted, offConsequence, isLast }: PermissionRowProps) {
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
        <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
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
          isLast
        />
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
