import { Pressable, StyleSheet, Text, View } from "react-native";
import { IColorTokens, radius, spacing, ThemePreference, useColors, useThemePreference } from "@/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSwitch() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={styles.track}>
      {OPTIONS.map((option) => {
        const active = option.value === preference;
        return (
          <Pressable
            key={option.value}
            onPress={() => setPreference(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} theme`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.xs,
      borderRadius: radius.sm - 2,
    },
    segmentActive: {
      backgroundColor: colors.invertFill,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    labelActive: {
      color: colors.invertText,
    },
  });
