import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/D-Design-System/components/content/02-step-stat-card.md
type StatCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function StatCard({ children, style }: StatCardProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: spacing.lg,
    },
  });
