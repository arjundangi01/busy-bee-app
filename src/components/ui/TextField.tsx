import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

export function TextField(props: TextInputProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
      style={styles.input}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
    />
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    input: {
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      color: colors.text,
      fontSize: 17,
    },
  });
