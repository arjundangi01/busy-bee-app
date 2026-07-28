import { StyleSheet, Text, View } from "react-native";
import { IColorTokens, spacing, useColors } from "@/theme";

type MissionPathListProps = {
  steps: string[];
};

// The full plan, always visible (not tucked behind a default-collapsed
// toggle) so the path to completion is clear the moment the plan is ready —
// numbered, connected markers with the current (first, un-started) step
// picked out from the rest.
export function MissionPathList({ steps }: MissionPathListProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View>
      {steps.map((step, index) => {
        const isCurrent = index === 0;
        const isLast = index === steps.length - 1;

        return (
          <View key={index} style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={[styles.marker, isCurrent && styles.markerCurrent]}>
                <Text style={[styles.markerText, isCurrent && styles.markerTextCurrent]}>{index + 1}</Text>
              </View>
              {!isLast && <View style={styles.connector} />}
            </View>
            <Text style={[styles.stepText, isCurrent && styles.stepTextCurrent]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    markerColumn: {
      alignItems: "center",
      width: 22,
    },
    marker: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
    },
    markerCurrent: {
      backgroundColor: colors.invertFill,
      borderColor: colors.invertFill,
    },
    markerText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "700",
    },
    markerTextCurrent: {
      color: colors.invertText,
    },
    connector: {
      width: 1,
      flex: 1,
      minHeight: spacing.sm,
      backgroundColor: colors.border,
    },
    stepText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      paddingBottom: spacing.sm,
    },
    stepTextCurrent: {
      color: colors.text,
      fontWeight: "600",
    },
  });
