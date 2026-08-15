import { Pressable, StyleSheet, Text, View } from "react-native";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

type BlockedAppRowProps = {
  appName: string;
  subLabel?: string;
  action: "add" | "remove";
  onPress: () => void;
  disabled?: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
};

const getInitial = (name: string): string => name.trim().charAt(0).toUpperCase() || "?";

export function BlockedAppRow({
  appName,
  subLabel,
  action,
  onPress,
  disabled,
  isFirstInGroup,
  isLastInGroup,
}: BlockedAppRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.row,
        isFirstInGroup && styles.rowFirst,
        isLastInGroup ? styles.rowLast : styles.rowDivider,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarGlyph}>{getInitial(appName)}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {appName}
        </Text>
        {subLabel && (
          <Text style={styles.subLabel} numberOfLines={1}>
            {subLabel}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={10}
        style={[styles.action, action === "add" ? styles.actionAdd : styles.actionRemove, disabled && styles.actionDisabled]}
        accessibilityRole="button"
        accessibilityLabel={action === "add" ? `Block ${appName}` : `Unblock ${appName}`}
      >
        <Text style={[styles.actionGlyph, action === "add" && styles.actionGlyphAdd]}>
          {action === "add" ? "+" : "×"}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
    },
    rowFirst: {
      borderTopWidth: 1,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    rowLast: {
      borderBottomWidth: 1,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarGlyph: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    meta: {
      flex: 1,
      gap: spacing.xxxs,
    },
    name: {
      color: colors.text,
      fontSize: 14.5,
      fontWeight: "500",
    },
    subLabel: {
      color: colors.textMuted,
      fontSize: 11.5,
      fontVariant: ["tabular-nums"],
    },
    action: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    actionAdd: {
      backgroundColor: colors.text,
    },
    actionRemove: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionDisabled: {
      opacity: 0.4,
    },
    actionGlyph: {
      color: colors.textFaint,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 18,
    },
    actionGlyphAdd: {
      color: colors.bg,
    },
  });
