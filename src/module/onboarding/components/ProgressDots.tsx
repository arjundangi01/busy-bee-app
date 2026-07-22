import { StyleSheet, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View key={index} style={[styles.dot, index === current && styles.dotActive]} />
      ))}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textFaint,
    },
    dotActive: {
      backgroundColor: colors.text,
    },
  });
