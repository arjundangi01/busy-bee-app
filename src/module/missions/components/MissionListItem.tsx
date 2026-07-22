import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { routes } from "@/config/routes";
import { colors, radius, spacing } from "@/theme";
import { IMission } from "@/types";
import { MISSION_STATUS } from "@/utils/enums";

type MissionListItemProps = {
  mission: IMission;
};

export function MissionListItem({ mission }: MissionListItemProps) {
  const isCompleted = mission.status === MISSION_STATUS.COMPLETED;

  return (
    <Pressable style={styles.row} onPress={() => router.push(routes.mission(mission.id))}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{mission.title}</Text>
        <Text style={styles.subtitle}>{isCompleted ? "Completed" : `${mission.progressPercent}% done`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${mission.progressPercent}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  textWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
  },
});
