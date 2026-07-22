import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BackButton } from "@/components/ui/BackButton";
import { TaskRow } from "@/module/missions/components/TaskRow";
import { useMission } from "@/module/missions/hooks/useMission";
import { colors, spacing } from "@/theme";

type MissionDetailTemplateProps = {
  missionId: string;
};

export function MissionDetailTemplate({ missionId }: MissionDetailTemplateProps) {
  const { mission, isLoading, error, completeTask, completingTaskId } = useMission(missionId);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      {isLoading && !mission && <ActivityIndicator color={colors.accent} style={styles.spinner} />}

      {error && !mission && <Text style={styles.error}>{error}</Text>}

      {mission && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.subtitle}>
            {mission.progressPercent}% complete
            {mission.estimatedMinutes !== null ? ` · ${mission.estimatedMinutes} min total` : ""}
          </Text>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${mission.progressPercent}%` }]} />
          </View>

          <View style={styles.tasks}>
            {mission.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isCompleting={completingTaskId === task.id}
                onComplete={() => completeTask(task.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginVertical: spacing.sm,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  tasks: {
    marginTop: spacing.md,
  },
});
