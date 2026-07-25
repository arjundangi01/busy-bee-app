import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TopBar } from "@/components/navigation/TopBar";
import { NotificationsSection } from "@/module/settings/components/NotificationsSection";
import { PermissionsSection } from "@/module/settings/components/PermissionsSection";
import { IColorTokens, spacing, useColors } from "@/theme";

const TOAST_DURATION_MS = 2000;

export function PermissionsTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
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
      <TopBar variant="sub-screen" title="Permissions" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Some of what busy-bee does needs OS-level access. Everything here is optional and reversible.
        </Text>

        <PermissionsSection />
        <NotificationsSection onSaved={showSavedToast} />

        {toastVisible && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Saved</Text>
          </View>
        )}
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
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
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
  });
