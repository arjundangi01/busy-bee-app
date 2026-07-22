import { Pressable, StyleSheet, Text } from "react-native";
import { IColorTokens, useColors } from "@/theme";

type BackButtonProps = {
  onPress: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={styles.arrow}>←</Text>
    </Pressable>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    arrow: {
      color: colors.text,
      fontSize: 20,
    },
  });
