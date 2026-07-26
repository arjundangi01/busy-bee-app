import { useEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BeeCharacter } from "@/components/content/companion/BeeCharacter";
import { HIVE_HUD } from "@/components/content/companion/hiveHud";
import { WorkshopEnvironment } from "@/components/content/companion/WorkshopEnvironment";
import { TopBar } from "@/components/navigation/TopBar";
import { useWorkTypes } from "@/module/focus/hooks/useWorkTypes";
import { useBankedWork } from "@/module/hive/hooks/useBankedWork";
import { useBeeSkins } from "@/module/hive/hooks/useBeeSkins";
import { useHiveThemes } from "@/module/hive/hooks/useHiveThemes";
import { useUpdatePreferences } from "@/module/settings/hooks/useUpdatePreferences";
import { PAYWALL_ENTRY } from "@/module/subscription/utils/enums";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { spacing, useColors } from "@/theme";
import { IBeeSkin, IHiveTheme, IWorkType } from "@/types";

// design-artifacts/evolution/specs/09-bees-hive-illustrated-redesign.md —
// illustrated hive-workshop treatment matching 1.3 Focus Session's own
// scene/HUD language, a second bounded DS-004 color exception. Supersedes
// the flat monochrome layout 05-bees-hive.md originally specified (that
// doc predates both the tab-root promotion and this illustrated pass).
type BeesHiveTemplateProps = {
  // Fired once every section's data has left its first-load state — gates
  // the tab's cloud entry reveal (see bees-hive.tsx) so it never uncovers
  // an empty background, same contract FocusSessionTemplate established.
  onSceneReady?: () => void;
};

// Matches WorkType registry's stable key (backend/scripts/seed-work-types.ts)
// — the only key that maps to the "flower" WorkshopEnvironment variant, see
// WorkTypeScene's own SCENE_BY_WORK_TYPE_KEY.
const FLOWER_WORK_TYPE_KEY = "flower-collecting";

export function BeesHiveTemplate({ onSceneReady }: BeesHiveTemplateProps) {
  const colors = useColors();
  const { user } = useAuthStore();
  const { bankedWork, isLoading: bankedLoading } = useBankedWork();
  const { workTypes, isLoading: workTypesLoading } = useWorkTypes();
  const { beeSkins, isLoading: skinsLoading } = useBeeSkins();
  const { hiveThemes, isLoading: themesLoading } = useHiveThemes();
  const { submit: updatePreferences, isLoading: isSelecting } = useUpdatePreferences();

  const selectedSkin = beeSkins.find((skin) => skin.id === user?.selectedSkinId) ?? null;
  const selectedTheme = hiveThemes.find((theme) => theme.id === user?.selectedThemeId) ?? null;
  const selectedWorkType = workTypes.find((workType) => workType.id === user?.selectedWorkTypeId) ?? null;
  const sceneVariant: "honeycomb" | "flower" =
    selectedWorkType?.key === FLOWER_WORK_TYPE_KEY ? "flower" : "honeycomb";

  useEffect(() => {
    if (!bankedLoading && !workTypesLoading && !skinsLoading && !themesLoading) {
      onSceneReady?.();
    }
  }, [bankedLoading, workTypesLoading, skinsLoading, themesLoading, onSceneReady]);

  const handleSelectWorkType = (workType: IWorkType) => {
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

  const handleSelectTheme = (theme: IHiveTheme) => {
    if (theme.locked) {
      router.push({ pathname: "/paywall", params: { entry: PAYWALL_ENTRY.HIVE_THEME } });
      return;
    }
    updatePreferences({ selectedThemeId: theme.id }).catch(() => undefined);
  };

  // Ties the scrollable content region's mood to the selected theme — a
  // small, cheap way to make the pick feel like it actually did something
  // beyond the picker tile itself.
  const pageBg = selectedTheme?.wallBottom ?? HIVE_HUD.pageBg;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={["top"]}>
      <TopBar variant="tab-root" onAvatarPress={() => router.push(routes.tabs.settings())} />
      <ScrollView style={{ backgroundColor: pageBg }} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={StyleSheet.absoluteFill}>
            <WorkshopEnvironment variant={sceneVariant} theme={selectedTheme ?? undefined} />
          </View>
          <View style={styles.heroBeeWrap}>
            {/* Same working (hard-hat, hammering) pose as the real Focus
                Session scene, not the compact idle body — this banner is
                previewing what the bee actually looks like during a task. */}
            <BeeCharacter working mode="active" size={70} skin={selectedSkin ?? undefined} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Banked so far</Text>
          <View style={styles.card}>
            {bankedLoading ? (
              <ActivityIndicator color={HIVE_HUD.text} style={styles.spinner} />
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Choose Bee&apos;s work</Text>
          <View style={styles.card}>
            {workTypesLoading ? (
              <ActivityIndicator color={HIVE_HUD.text} style={styles.spinner} />
            ) : (
              workTypes.map((workType, index) => {
                const isSelected = workType.id === user?.selectedWorkTypeId;
                return (
                  <Pressable
                    key={workType.id}
                    onPress={() => handleSelectWorkType(workType)}
                    disabled={isSelecting}
                    style={[styles.row, index < workTypes.length - 1 && styles.rowWithBorder]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      workType.locked ? `${workType.label}, requires Pro` : `Select ${workType.label}`
                    }
                  >
                    <Text style={[styles.dot, { color: isSelected ? HIVE_HUD.text : HIVE_HUD.textSecondary }]}>
                      ●
                    </Text>
                    <Text style={styles.rowLabel}>{workType.label}</Text>
                    {workType.locked ? (
                      <Text style={styles.proTag}>Pro</Text>
                    ) : (
                      isSelected && <Text style={styles.selectedTag}>Current</Text>
                    )}
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.card}>
            {skinsLoading ? (
              <ActivityIndicator color={HIVE_HUD.text} style={styles.spinner} />
            ) : (
              <View style={styles.tileGrid}>
                {beeSkins.map((skin) => {
                  const isSelected = skin.id === user?.selectedSkinId;
                  return (
                    <Pressable
                      key={skin.id}
                      onPress={() => handleSelectSkin(skin)}
                      disabled={isSelecting}
                      style={[styles.tile, isSelected && styles.tileSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={skin.locked ? `${skin.label}, requires Pro` : `Select ${skin.label}`}
                    >
                      <BeeCharacter
                        working
                        mode="active"
                        size={40}
                        skin={{
                          bodyPrimary: skin.bodyPrimary,
                          bodySecondary: skin.bodySecondary,
                          stripe: skin.stripe,
                        }}
                      />
                      <Text style={styles.tileLabel}>{skin.label}</Text>
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Theme</Text>
          <View style={styles.card}>
            {themesLoading ? (
              <ActivityIndicator color={HIVE_HUD.text} style={styles.spinner} />
            ) : (
              <View style={styles.tileGrid}>
                {hiveThemes.map((theme) => {
                  const isSelected = theme.id === user?.selectedThemeId;
                  return (
                    <Pressable
                      key={theme.id}
                      onPress={() => handleSelectTheme(theme)}
                      disabled={isSelecting}
                      style={[styles.tile, isSelected && styles.tileSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={theme.locked ? `${theme.label}, requires Pro` : `Select ${theme.label}`}
                    >
                      <View style={styles.themePreview}>
                        <WorkshopEnvironment variant={sceneVariant} theme={theme} />
                      </View>
                      <Text style={styles.tileLabel}>{theme.label}</Text>
                      {theme.locked ? (
                        <Text style={styles.proTag}>Pro</Text>
                      ) : (
                        isSelected && <Text style={styles.selectedTag}>Current</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    height: 180,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: HIVE_HUD.pillBorder,
  },
  heroBeeWrap: {
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    color: HIVE_HUD.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: HIVE_HUD.pillBg,
    borderWidth: 1,
    borderColor: HIVE_HUD.pillBorder,
    borderRadius: 20,
    padding: spacing.lg,
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
    borderColor: HIVE_HUD.pillBorder,
  },
  emptyGalleryText: {
    color: HIVE_HUD.textSecondary,
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
    borderBottomColor: HIVE_HUD.pillBorder,
  },
  bankedLabel: {
    color: HIVE_HUD.text,
    fontSize: 15,
  },
  bankedCount: {
    color: HIVE_HUD.textSecondary,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  dot: {
    fontSize: 10,
  },
  rowLabel: {
    flex: 1,
    color: HIVE_HUD.text,
    fontSize: 15,
  },
  proTag: {
    color: HIVE_HUD.barFill,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  selectedTag: {
    color: HIVE_HUD.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    alignItems: "center",
    gap: spacing.xxxs,
    width: 76,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  themePreview: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
  },
  tileSelected: {
    borderColor: HIVE_HUD.barFill,
  },
  tileLabel: {
    color: HIVE_HUD.text,
    fontSize: 11,
    textAlign: "center",
  },
});
