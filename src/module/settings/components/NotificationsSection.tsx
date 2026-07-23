import { StyleSheet, Text, View } from "react-native";
import { StatCard } from "@/components/content/StatCard";
import { Toggle } from "@/components/ui/Toggle";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

type NotificationsSectionProps = {
  onSaved: () => void;
};

export function NotificationsSection({ onSaved }: NotificationsSectionProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const { submit } = useUpdatePreferences();

  if (!user) return null;

  // Reflects, doesn't grant, the OS-level permission — greyed out and
  // non-interactive when that permission itself is off (spec's own rule).
  const osNotificationsOff = user.notificationsGranted === false;

  const handleTogglePush = async (value: boolean) => {
    await submit({ pushNotificationsEnabled: value });
    onSaved();
  };

  const handleToggleEodNudge = async (value: boolean) => {
    await submit({ eodNudgeEnabled: value });
    onSaved();
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Notifications</Text>
      <StatCard>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push notifications</Text>
          <Toggle
            value={user.pushNotificationsEnabled}
            onValueChange={handleTogglePush}
            disabled={osNotificationsOff}
            accessibilityLabel="Push notifications"
          />
        </View>
        <View style={[styles.row, styles.rowWithBorder]}>
          <Text style={styles.rowLabel}>End-of-day nudge</Text>
          <Toggle
            value={user.eodNudgeEnabled}
            onValueChange={handleToggleEodNudge}
            disabled={osNotificationsOff}
            accessibilityLabel="End-of-day nudge"
          />
        </View>
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
      justifyContent: "space-between",
      paddingVertical: spacing.xxs,
    },
    rowWithBorder: {
      marginTop: spacing.xxs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 16,
    },
  });
