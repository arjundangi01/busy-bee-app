import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NotificationsSection } from "@/module/settings/components/NotificationsSection";
import { PermissionsSection } from "@/module/settings/components/PermissionsSection";
import { SubscriptionSection } from "@/module/settings/components/SubscriptionSection";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

const TOAST_DURATION_MS = 2000;

export function SettingsTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { signOut } = useAuthStore();
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showSavedToast = () => {
    setToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        <SubscriptionSection />
        <NotificationsSection onSaved={showSavedToast} />
        <PermissionsSection />

        {toastVisible && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Saved</Text>
          </View>
        )}

        <Pressable onPress={signOut} hitSlop={12} style={styles.signOutRow}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      paddingTop: spacing.md,
    },
    toast: {
      alignSelf: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xxs,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toastText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    signOutRow: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    signOut: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
