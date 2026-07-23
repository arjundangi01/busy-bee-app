import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import { StatCard } from "@/components/content/StatCard";
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

export function SubscriptionSection() {
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
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Subscription</Text>
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
            <Pressable onPress={openSubscriptionManagement} hitSlop={8}>
              <Text style={styles.link}>Manage ›</Text>
            </Pressable>
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
            <Pressable
              onPress={() => router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.SETTINGS } })}
              hitSlop={8}
            >
              <Text style={styles.link}>Upgrade ›</Text>
            </Pressable>
          </View>
        )}
      </StatCard>
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
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
    link: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
  });
