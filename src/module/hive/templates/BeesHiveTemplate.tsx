import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { TopBar } from "@/components/navigation/TopBar";
import { BeeCharacter } from "@/components/content/companion/BeeCharacter";
import { useBankedWork } from "@/module/hive/hooks/useBankedWork";
import { useBeeSkins } from "@/module/hive/hooks/useBeeSkins";
import { useWorkTypes } from "@/module/focus/hooks/useWorkTypes";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";
import { IBeeSkin, IWorkType } from "@/types";

// design-artifacts/evolution/specs/05-bees-hive.md — now a tab-root screen
// (bee customization tab), not a pushed sub-screen; see 04-home-dashboard-
// companion-entry.md for the update to its entry-point note.
export function BeesHiveTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const { bankedWork, isLoading: bankedLoading } = useBankedWork();
  const { workTypes, isLoading: workTypesLoading } = useWorkTypes();
  const { beeSkins, isLoading: skinsLoading } = useBeeSkins();
  const { submit: updatePreferences, isLoading: isSelecting } = useUpdatePreferences();

  const handleSelect = (workType: IWorkType) => {
    if (workType.locked) {
      router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.HIVE_WORK_TYPE } });
      return;
    }
    updatePreferences({ selectedWorkTypeId: workType.id }).catch(() => undefined);
  };

  const handleSelectSkin = (skin: IBeeSkin) => {
    if (skin.locked) {
      router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.HIVE_SKIN } });
      return;
    }
    updatePreferences({ selectedSkinId: skin.id }).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar variant="tab-root" onAvatarPress={() => router.push(routes.tabs.settings())} />
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <StatCard>
            {skinsLoading ? (
              <ActivityIndicator color={colors.text} style={styles.spinner} />
            ) : (
              <View style={styles.skinGrid}>
                {beeSkins.map((skin) => {
                  const isSelected = skin.id === user?.selectedSkinId;
                  return (
                    <Pressable
                      key={skin.id}
                      onPress={() => handleSelectSkin(skin)}
                      disabled={isSelecting}
                      style={[styles.skinTile, isSelected && { borderColor: colors.text }]}
                      accessibilityRole="button"
                      accessibilityLabel={skin.locked ? `${skin.label}, requires Pro` : `Select ${skin.label}`}
                    >
                      <BeeCharacter
                        mode="idle"
                        size={30}
                        skin={{
                          bodyPrimary: skin.bodyPrimary,
                          bodySecondary: skin.bodySecondary,
                          stripe: skin.stripe,
                        }}
                      />
                      <Text style={styles.skinLabel}>{skin.label}</Text>
                      {skin.locked ? (
                        <Text style={styles.proTag}>Pro</Text>
                      ) : (
                        isSelected && <Text style={styles.selectedTag}>Current</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
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
    skinGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    skinTile: {
      alignItems: "center",
      gap: spacing.xxxs,
      width: 76,
      paddingVertical: spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "transparent",
    },
    skinLabel: {
      color: colors.text,
      fontSize: 11,
      textAlign: "center",
    },
  });
