import { Pressable, StyleSheet, Text, View } from "react-native";
import { BackButton } from "@/components/ui/BackButton";
import { IColorTokens, spacing, useColors } from "@/theme";

// design-artifacts/D-Design-System/components/navigation/01-top-bar.md
type TopBarProps =
  | { variant: "tab-root"; onAvatarPress: () => void }
  | { variant: "sub-screen"; title?: string; onBack: () => void };

export function TopBar(props: TopBarProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  if (props.variant === "sub-screen") {
    return (
      <View style={styles.row}>
        <BackButton onPress={props.onBack} />
        {props.title && <Text style={styles.title}>{props.title}</Text>}
        <View style={styles.backSpacer} />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.wordmark}>
        busy<Text style={{ color: colors.accent }}>bee</Text>
      </Text>
      <Pressable onPress={props.onAvatarPress} hitSlop={12} style={styles.avatar}>
        <Text style={styles.avatarGlyph}>◍</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    wordmark: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarGlyph: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    backSpacer: {
      width: 44,
      height: 44,
    },
  });
