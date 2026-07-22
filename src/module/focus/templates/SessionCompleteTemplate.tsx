import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Companion } from "@/components/content/Companion";
import { LabelValueRow } from "@/components/content/LabelValueRow";
import { StatCard } from "@/components/content/StatCard";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useDashboard } from "@/module/dashboard/hooks/useDashboard";
import { useMission } from "@/module/missions/hooks/useMission";
import { routes } from "@/config/routes";
import { IColorTokens, spacing, useColors } from "@/theme";

type SessionCompleteTemplateProps = {
  missionId: string;
  timeFocusedMinutes: number;
  stepsCompleted: number;
  totalSteps: number;
  distractionsBlocked: number;
};

export function SessionCompleteTemplate({
  missionId,
  timeFocusedMinutes,
  stepsCompleted,
  totalSteps,
  distractionsBlocked,
}: SessionCompleteTemplateProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const { mission } = useMission(missionId);
  const { dashboard } = useDashboard();

  const backlogAfter = dashboard?.backlogCount ?? 0;
  const backlogBefore = backlogAfter + stepsCompleted;
  const isZeroBacklog = backlogAfter === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        <View style={styles.headlineZone}>
          <Companion state="celebratory" />
          <Text style={styles.headline}>
            {isZeroBacklog ? "Zero backlog today. That's the whole job." : "Mission done. That's real progress."}
          </Text>
          {mission && (
            <Text style={styles.subline}>
              &quot;{mission.title}&quot; — all {totalSteps} steps cleared.
            </Text>
          )}
        </View>

        <StatCard>
          <LabelValueRow label="Time focused" value={`${timeFocusedMinutes}m`} />
          <LabelValueRow label="Steps completed" value={`${stepsCompleted} of ${totalSteps}`} />
          <LabelValueRow label="Distractions blocked" value={`${distractionsBlocked} attempts`} />
        </StatCard>

        <View style={styles.backlogShift}>
          <Text style={styles.backlogShiftText}>
            {isZeroBacklog ? "Zero backlog today ✓" : `${backlogBefore} → ${backlogAfter} backlog`}
          </Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <PrimaryButton label="Start another" onPress={() => router.replace(routes.startMission())} />
        <Pressable style={styles.secondaryButton} onPress={() => router.replace(routes.tabs.home())}>
          <Text style={styles.secondaryButtonLabel}>Done for now</Text>
        </Pressable>
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
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      gap: spacing.xxl,
    },
    headlineZone: {
      alignItems: "center",
      gap: spacing.md,
    },
    headline: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
    },
    subline: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
    },
    backlogShift: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    backlogShiftText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    secondaryButton: {
      height: 56,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonLabel: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
  });
