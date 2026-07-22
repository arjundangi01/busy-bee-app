import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MissionListItem } from "@/module/missions/components/MissionListItem";
import { useMissions } from "@/module/missions/hooks/useMissions";
import { colors, spacing } from "@/theme";

export function MissionsTemplate() {
  const { missions, isLoading, isRefetching, refresh } = useMissions();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Text style={styles.header}>Missions</Text>
      {isLoading && missions.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={styles.spinner} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={isRefetching}
          renderItem={({ item }) => <MissionListItem mission={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<Text style={styles.empty}>No missions yet.</Text>}
        />
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
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
