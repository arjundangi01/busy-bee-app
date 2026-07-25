import { useEffect, useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { router } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { getProPackage } from "@/lib/purchases";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { IColorTokens, spacing, useColors } from "@/theme";
import { SUBSCRIPTION_STATUS } from "@/utils/enums";

const formatRenewalDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const openSubscriptionManagement = () => {
  if (Platform.OS === "ios") {
    Linking.openURL("https://apps.apple.com/account/subscriptions");
    return;
  }
  const androidPackage = Constants.expoConfig?.android?.package ?? "com.busybee.app";
  Linking.openURL(`https://play.google.com/store/account/subscriptions?package=${androidPackage}`);
};

export function MembershipTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { isPro, status, expiresAt, limits } = useEntitlement();
  const [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (isPro) {
      getProPackage().then(setProPackage);
    }
  }, [isPro]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="Membership" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current plan</Text>
          <StatCard>
            {isPro ? (
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>
                    Pro{proPackage ? ` · ${proPackage.product.priceString}/month` : ""}
                  </Text>
                  {expiresAt && (
                    <Text style={styles.rowMeta}>
                      {status === SUBSCRIPTION_STATUS.CANCELLED ? "Ends" : "Renews"} {formatRenewalDate(expiresAt)}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Free plan</Text>
                  <Text style={styles.rowMeta}>
                    {limits.dailySessionCap !== null ? `${limits.dailySessionCap} sessions/day` : "Limited sessions"} ·
                    basic analytics
                  </Text>
                </View>
              </View>
            )}
          </StatCard>
        </View>

        {isPro && (
          <Text style={styles.manageNote}>
            Billing and cancellation are handled by the {Platform.OS === "ios" ? "App Store" : "Play Store"} — busy-bee
            doesn&apos;t manage payment details directly.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isPro ? (
          <PrimaryButton label="Manage subscription" onPress={openSubscriptionManagement} />
        ) : (
          <PrimaryButton
            label="Compare plans"
            onPress={() => router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.SETTINGS } })}
          />
        )}
      </View>
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
    section: {
      gap: spacing.xs,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowText: {
      flex: 1,
      gap: spacing.xxxs,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    rowMeta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    manageNote: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
  });
