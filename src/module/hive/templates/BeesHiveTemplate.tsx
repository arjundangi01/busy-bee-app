import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { useBankedWork } from "@/module/hive/hooks/useBankedWork";
import { useWorkTypes } from "@/module/focus/hooks/useWorkTypes";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IWorkType } from "@/types";

// design-artifacts/evolution/specs/05-bees-hive.md
export function BeesHiveTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const { bankedWork, isLoading: bankedLoading } = useBankedWork();
  const { workTypes, isLoading: workTypesLoading } = useWorkTypes();
  const { submit: updatePreferences, isLoading: isSelecting } = useUpdatePreferences();

  const handleSelect = (workType: IWorkType) => {
    if (workType.locked) {
      router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.HIVE_WORK_TYPE } });
      return;
    }
    updatePreferences({ selectedWorkTypeId: workType.id }).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="sub-screen" title="Bee's Hive" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Banked so far</Text>
          <StatCard>
            {bankedLoading ? (
              <ActivityIndicator color={colors.text} style={styles.spinner} />
            ) : bankedWork.length === 0 ? (
              <View style={styles.emptyGallery}>
                <View style={styles.emptyGlyph} />
                <Text style={styles.emptyGalleryText}>
                  Your first piece starts with your next session.
                </Text>
              </View>
            ) : (
              bankedWork.map((banked, index) => (
                <View
                  key={banked.workTypeId}
                  style={[styles.bankedRow, index < bankedWork.length - 1 && styles.rowWithBorder]}
                >
                  <Text style={styles.bankedLabel}>{banked.label}</Text>
                  <Text style={styles.bankedCount}>{banked.totalUnitsCompleted} completed</Text>
                </View>
              ))
            )}
          </StatCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Choose Bee&apos;s work</Text>
          <StatCard>
            {workTypesLoading ? (
              <ActivityIndicator color={colors.text} style={styles.spinner} />
            ) : (
              workTypes.map((workType, index) => {
                const isSelected = workType.id === user?.selectedWorkTypeId;
                return (
                  <Pressable
                    key={workType.id}
                    onPress={() => handleSelect(workType)}
                    disabled={isSelecting}
                    style={[styles.workTypeRow, index < workTypes.length - 1 && styles.rowWithBorder]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      workType.locked ? `${workType.label}, requires Pro` : `Select ${workType.label}`
                    }
                  >
                    <Text style={[styles.dot, { color: isSelected ? colors.text : colors.textSecondary }]}>●</Text>
                    <Text style={styles.workTypeLabel}>{workType.label}</Text>
                    {workType.locked ? (
                      <Text style={styles.proTag}>Pro</Text>
                    ) : (
                      isSelected && <Text style={styles.selectedTag}>Current</Text>
                    )}
                  </Pressable>
                );
              })
            )}
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
    spinner: {
      marginVertical: spacing.md,
    },
    emptyGallery: {
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    emptyGlyph: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyGalleryText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
    bankedRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    rowWithBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    bankedLabel: {
      color: colors.text,
      fontSize: 15,
    },
    bankedCount: {
      color: colors.textSecondary,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
    },
    workTypeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    dot: {
      fontSize: 10,
    },
    workTypeLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
    },
    proTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    selectedTag: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    },
  });
