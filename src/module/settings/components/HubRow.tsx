import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

type HubRowProps = {
  label: string;
  meta?: string;
  leading?: ReactNode;
  onPress: () => void;
  isLast?: boolean;
};

export function HubRow({ label, meta, leading, onPress, isLast }: HubRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !isLast && styles.rowWithBorder]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {leading}
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {meta && <Text style={styles.meta}>{meta}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    rowWithBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      marginBottom: spacing.xxs,
      paddingBottom: spacing.sm + spacing.xxs,
    },
    textCol: {
      flex: 1,
      gap: spacing.xxxs,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    chevron: {
      color: colors.textFaint,
      fontSize: 18,
    },
  });
