import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { getProPackage, isPurchasesConfigured, purchasePackage } from "@/lib/purchases";
import { markPaywallDismissedToday } from "@/module/subscription/utils/dismissal";
import { FALLBACK_PRO_PRICE_LABEL } from "@/module/subscription/utils/constants";
import { formatDurationCap } from "@/module/subscription/utils/formatLimits";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IPlanLimits } from "@/types";

type PaywallTemplateProps = {
  entry: PAYWALL_ENTRY;
  missionId: string | null;
};

type PageState = "default" | "processing" | "confirmation" | "failed";

const getHeadlineCopy = (
  entry: PAYWALL_ENTRY,
  limits: IPlanLimits,
): { headline: string; subline: string; confirmationBody: string } => {
  switch (entry) {
    case PAYWALL_ENTRY.SESSION_CAP:
      return {
        headline:
          limits.dailySessionCap !== null
            ? `You've used your ${limits.dailySessionCap} free sessions today.`
            : "You've used today's free sessions.",
        subline: "Pro removes the daily cap — start as many sessions as you need.",
        confirmationBody: "The daily cap is gone — go as long as you need.",
      };
    case PAYWALL_ENTRY.ANALYTICS:
      return {
        headline: "Advanced analytics is part of Pro.",
        subline: "Hourly breakdowns and full detail — unlocked.",
        confirmationBody: "Hourly breakdowns and full detail are ready on your Progress page.",
      };
    case PAYWALL_ENTRY.SESSION_TIME_LIMIT:
      return {
        headline:
          limits.sessionDurationCapSeconds !== null
            ? `Your session hit the ${formatDurationCap(limits.sessionDurationCapSeconds)} free limit.`
            : "Your session hit the free time limit.",
        subline: "Pro sessions run as long as you need.",
        confirmationBody: "Pro sessions run as long as you need — start a new one anytime.",
      };
  }
};

const getComparisonRows = (limits: IPlanLimits): { label: string; free: string; pro: string }[] => [
  {
    label: "Sessions per day",
    free: limits.dailySessionCap !== null ? `${limits.dailySessionCap}` : "—",
    pro: "Unlimited",
  },
  {
    label: "Session length",
    free: limits.sessionDurationCapSeconds !== null ? formatDurationCap(limits.sessionDurationCapSeconds) : "—",
    pro: "Unlimited",
  },
  { label: "Dashboard detail", free: "Daily & weekly", pro: "Full hourly & app-level" },
];

const resumeTriggeringContext = (entry: PAYWALL_ENTRY, missionId: string | null) => {
  if (entry === PAYWALL_ENTRY.SESSION_CAP && missionId) {
    router.replace(routes.focusSession(missionId));
    return;
  }
  if (entry === PAYWALL_ENTRY.ANALYTICS) {
    router.back();
    return;
  }
  router.replace(routes.tabs.home());
};

export function PaywallTemplate({ entry, missionId }: PaywallTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { limits, refresh: refreshEntitlement } = useEntitlement();

  const [state, setState] = useState<PageState>("default");
  const [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getProPackage().then(setProPackage);
  }, []);

  const copy = getHeadlineCopy(entry, limits);
  const comparisonRows = getComparisonRows(limits);
  const priceLabel = proPackage
    ? `${proPackage.product.priceString}/month · billed monthly · cancel anytime`
    : FALLBACK_PRO_PRICE_LABEL;

  const handleDismiss = async () => {
    await markPaywallDismissedToday();
    if (entry === PAYWALL_ENTRY.ANALYTICS) {
      router.back();
      return;
    }
    router.replace(routes.tabs.home());
  };

  const handleUpgrade = async () => {
    if (!isPurchasesConfigured() || !proPackage) {
      setErrorMessage("Upgrades aren't available yet — check back soon.");
      setState("failed");
      return;
    }

    setState("processing");
    try {
      await purchasePackage(proPackage);
      await refreshEntitlement();
      setState("confirmation");
    } catch (error) {
      const purchasesError = error as { userCancelled?: boolean };
      if (purchasesError.userCancelled) {
        setState("default");
        return;
      }
      setErrorMessage("The purchase didn't go through. Please try again.");
      setState("failed");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {state !== "confirmation" && (
        <View style={styles.dismissRow}>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.dismissGlyph}>×</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {state === "confirmation" ? (
          <View style={styles.confirmationWrap}>
            <View style={styles.confirmationBadge}>
              <Text style={styles.confirmationBadgeGlyph}>✓</Text>
            </View>
            <Text style={styles.confirmationHeadline}>You&apos;re Pro.</Text>
            <Text style={styles.confirmationBody}>{copy.confirmationBody}</Text>
          </View>
        ) : (
          <>
            <View style={styles.headlineZone}>
              <Text style={styles.headline}>{copy.headline}</Text>
              <Text style={styles.subline}>{copy.subline}</Text>
            </View>

            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeaderRow}>
                <Text style={styles.comparisonHeaderLabel} />
                <Text style={styles.comparisonHeaderValue}>Free</Text>
                <Text style={styles.comparisonHeaderValue}>Pro</Text>
              </View>
              {comparisonRows.map((row) => (
                <View key={row.label} style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>{row.label}</Text>
                  <Text style={styles.comparisonFreeValue}>{row.free}</Text>
                  <Text style={styles.comparisonProValue}>{row.pro}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.pricing}>{priceLabel}</Text>

            {state === "failed" && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {state === "confirmation" ? (
          <PrimaryButton label="Continue" onPress={() => resumeTriggeringContext(entry, missionId)} />
        ) : (
          <>
            <PrimaryButton label="Upgrade to Pro" onPress={handleUpgrade} loading={state === "processing"} />
            <Pressable onPress={handleDismiss} hitSlop={8} style={styles.notNowLink}>
              <Text style={styles.notNowText}>Not now</Text>
            </Pressable>
          </>
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
    dismissRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    dismissButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    dismissGlyph: {
      color: colors.text,
      fontSize: 22,
      lineHeight: 22,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      flexGrow: 1,
    },
    headlineZone: {
      paddingTop: spacing.md,
      gap: spacing.xxs,
    },
    headline: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    subline: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    comparisonTable: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: spacing.md,
      gap: spacing.xs,
    },
    comparisonHeaderRow: {
      flexDirection: "row",
      paddingBottom: spacing.xxs,
    },
    comparisonHeaderLabel: {
      flex: 2,
    },
    comparisonHeaderValue: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      textAlign: "center",
    },
    comparisonRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.xxs,
    },
    comparisonLabel: {
      flex: 2,
      color: colors.textSecondary,
      fontSize: 13,
    },
    comparisonFreeValue: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
    comparisonProValue: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    pricing: {
      marginTop: spacing.md,
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    errorText: {
      marginTop: spacing.md,
      color: colors.danger,
      fontSize: 13,
    },
    confirmationWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    confirmationBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmationBadgeGlyph: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
    },
    confirmationHeadline: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    confirmationBody: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    notNowLink: {
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    notNowText: {
      color: colors.textSecondary,
      fontSize: 13,
    },
  });
