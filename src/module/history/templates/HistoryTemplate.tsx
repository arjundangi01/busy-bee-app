import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { SessionListRow } from "@/components/content/SessionListRow";
import { TopBar } from "@/components/navigation/TopBar";
import { useSessionHistory } from "@/module/history/hooks/useSessionHistory";
import { routes } from "@/config/routes";
import { ISessionSummary } from "@/types";
import { IColorTokens, spacing, useColors } from "@/theme";

export function HistoryTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { sessions, isLoading, isRefetching, error, refresh, loadMore, hasMore, isLoadingMore } = useSessionHistory();

  const handleSessionPress = (session: ISessionSummary) => {
    router.push(routes.sessionTimeline(session.id));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="History" onBack={() => router.back()} />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.text }]} />
          <Text style={styles.legendLabel}>Clean</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendLabel}>Some friction</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendLabel}>Rough</Text>
        </View>
      </View>

      {isLoading && sessions.length === 0 ? (
        <ActivityIndicator color={colors.text} style={styles.spinner} />
      ) : error && sessions.length === 0 ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(session) => session.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl tintColor={colors.text} refreshing={isRefetching} onRefresh={refresh} />}
          renderItem={({ item }) => (
            <SessionListRow session={item} showDate onPress={handleSessionPress} />
          )}
          onEndReached={() => {
            if (hasMore && !isLoadingMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.text} style={styles.footerSpinner} /> : null}
          ListEmptyComponent={<Text style={styles.empty}>No sessions yet — finish your first one to see it here.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    legend: {
      flexDirection: "row",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xxxs,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendLabel: {
      color: colors.textMuted,
      fontSize: 10,
    },
    spinner: {
      marginTop: spacing.xl,
    },
    footerSpinner: {
      marginVertical: spacing.md,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    empty: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xl,
      fontSize: 13,
    },
    error: {
      color: colors.danger,
      textAlign: "center",
      marginTop: spacing.xl,
      fontSize: 13,
    },
  });
