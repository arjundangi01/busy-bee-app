import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { IColorTokens, spacing, useColors } from "@/theme";

const FAQS = [
  {
    question: "Why did my streak reset?",
    answer: "A streak needs at least one completed focus session each day — missing a full day resets the count.",
  },
  {
    question: "How do I cancel Pro?",
    answer: "Manage or cancel anytime from Membership — handled by the App Store/Play Store, not in-app.",
  },
  {
    question: "Blocking stopped working after I locked my phone",
    answer: "Expected on this build — see Permissions › Background execution.",
  },
];

const SUPPORT_EMAIL = "support@busybee.app";

export function HelpCenterTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="Help Center" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Common questions</Text>
          <StatCard>
            {FAQS.map((faq, index) => (
              <View key={faq.question} style={[styles.faqRow, index > 0 && styles.faqRowWithBorder]}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              </View>
            ))}
          </StatCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Still stuck?</Text>
          <StatCard>
            <Pressable
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel="Contact support"
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Contact support</Text>
                <Text style={styles.rowMeta}>Usually replies within a day</Text>
              </View>
              <Text style={styles.link}>Email ›</Text>
            </Pressable>
          </StatCard>
        </View>
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
    section: {
      gap: spacing.xs,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    faqRow: {
      gap: spacing.xxs,
      paddingVertical: spacing.xs,
    },
    faqRowWithBorder: {
      marginTop: spacing.xxs,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    faqQuestion: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    faqAnswer: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
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
