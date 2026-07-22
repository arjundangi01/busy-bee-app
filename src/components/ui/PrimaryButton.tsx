import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { IColorTokens, radius, spacing, useColors } from "@/theme";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PrimaryButton({ label, onPress, disabled, loading }: PrimaryButtonProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      onPressIn={() => {
        if (!isInactive) scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      style={[styles.button, animatedStyle, isInactive && styles.buttonInactive]}
    >
      {loading ? (
        <ActivityIndicator color={colors.invertText} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    button: {
      height: 56,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.invertFill,
    },
    buttonInactive: {
      opacity: 0.5,
    },
    label: {
      color: colors.invertText,
      fontSize: 17,
      fontWeight: "700",
    },
  });
