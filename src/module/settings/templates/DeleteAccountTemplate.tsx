import { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { router } from "expo-router";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { useDeleteAccount } from "@/module/settings/hooks/useDeleteAccount";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

const CONFIRM_PHRASE = "DELETE";

// Same store deep links MembershipTemplate uses to send an active
// subscriber to cancel their plan — there's no automated cancellation here
// (no outbound RevenueCat API credential exists yet), so this manual link
// is the actual cancellation path for a Pro user deleting their account.
const openSubscriptionManagement = () => {
  if (Platform.OS === "ios") {
    Linking.openURL("https://apps.apple.com/account/subscriptions");
    return;
  }
  const androidPackage = Constants.expoConfig?.android?.package ?? "com.busybeeapp.app";
  Linking.openURL(`https://play.google.com/store/account/subscriptions?package=${androidPackage}`);
};

export function DeleteAccountTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { isPro } = useEntitlement();
  const { deleteAccount, isLoading, error } = useDeleteAccount();
  const { signOut } = useAuthStore();
  const [confirmText, setConfirmText] = useState("");

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  const handleDelete = async () => {
    if (!canDelete) return;
    await deleteAccount();
    await signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <TopBar variant="sub-screen" title="Delete Account" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          This permanently deletes your account and everything associated with it — missions,
          tasks, history, and preferences. This can&apos;t be undone.
        </Text>

        {isPro && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>You have an active subscription</Text>
            <Text style={styles.warningBody}>
              Deleting your account does not cancel your {Platform.OS === "ios" ? "App Store" : "Play Store"}{" "}
              subscription — you&apos;ll keep being billed until you cancel it there yourself.
            </Text>
            <Text onPress={openSubscriptionManagement} style={styles.warningLink}>
              Manage subscription
            </Text>
          </View>
        )}

        <View style={styles.confirmBlock}>
          <Text style={styles.confirmLabel}>
            Type <Text style={styles.confirmPhrase}>{CONFIRM_PHRASE}</Text> to confirm
          </Text>
          <TextField
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={CONFIRM_PHRASE}
            autoCapitalize="characters"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label="Permanently delete my account"
          onPress={handleDelete}
          disabled={!canDelete}
          loading={isLoading}
          variant="danger"
        />
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
      fontSize: 13,
      lineHeight: 19,
    },
    warningCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 20,
      padding: spacing.lg,
      gap: spacing.xxs,
    },
    warningTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    warningBody: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    warningLink: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      textDecorationLine: "underline",
      marginTop: spacing.xxs,
    },
    confirmBlock: {
      gap: spacing.sm,
    },
    confirmLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    confirmPhrase: {
      fontWeight: "700",
    },
    error: {
      color: colors.danger,
      fontSize: 12.5,
    },
  });
