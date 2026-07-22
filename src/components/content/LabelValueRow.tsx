import { StyleSheet, Text, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/D-Design-System/components/content/03-label-value-row.md
type LabelValueRowProps = {
  label: string;
  value: string;
};

export function LabelValueRow({ label, value }: LabelValueRowProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xxs,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    value: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
  });
