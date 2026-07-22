import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import { BackButton } from "@/components/ui/BackButton";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IColorTokens, spacing, useColors } from "@/theme";

type ConversationalScreenProps = {
  children: ReactNode;
  footerLabel?: string;
  onFooterPress?: () => void;
  footerDisabled?: boolean;
  footerLoading?: boolean;
  showOrb?: boolean;
  showBack?: boolean;
};

export function ConversationalScreen({
  children,
  footerLabel,
  onFooterPress,
  footerDisabled,
  footerLoading,
  showOrb = true,
  showBack = true,
}: ConversationalScreenProps) {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {showBack ? <BackButton onPress={() => router.back()} /> : <View style={styles.backSpacer} />}
        </View>

        {showOrb && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.orbWrapper}>
            <GlowOrb />
          </Animated.View>
        )}

        <View style={styles.content}>{children}</View>

        {footerLabel && onFooterPress && (
          <View style={styles.footer}>
            <PrimaryButton
              label={footerLabel}
              onPress={onFooterPress}
              disabled={footerDisabled}
              loading={footerLoading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    header: {
      height: 44,
      paddingHorizontal: spacing.lg,
      justifyContent: "center",
    },
    backSpacer: {
      width: 44,
      height: 44,
    },
    orbWrapper: {
      alignItems: "center",
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
  });
