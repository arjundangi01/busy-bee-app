import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { router } from "expo-router";
import { StatCard } from "@/components/content/StatCard";
import { HubRow } from "@/module/settings/components/HubRow";
import { ThemeSwitch } from "@/module/settings/components/ThemeSwitch";
import { useBlocklist } from "@/module/settings/hooks/useBlocklist";
import { useEntitlement } from "@/module/subscription/hooks/useEntitlement";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/store/auth-store";
import { IColorTokens, spacing, useColors } from "@/theme";

const SOCIAL_LINKS = [
  { label: "X", url: "https://x.com/busybeeapp" },
  { label: "IG", url: "https://instagram.com/busybeeapp" },
  { label: "YT", url: "https://youtube.com/@busybeeapp" },
];

export function SettingsHubTemplate() {
  const colors = useColors();
  const styles = createStyles(colors);
  const { user, signOut } = useAuthStore();
  const { isPro } = useEntitlement();
  const { blockedApps } = useBlocklist({ enabled: Platform.OS === "android" });

  if (!user) return null;

  const grantedCount = [user.backgroundExecutionGranted, user.notificationsGranted].filter(
    (granted) => granted === true,
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <StatCard>
            <HubRow
              label="My Account"
              meta={user.name}
              leading={
                <View style={styles.avatar}>
                  <Text style={styles.avatarGlyph}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
              }
              onPress={() => router.push(routes.settingsAccount())}
            />
            <HubRow
              label="Membership"
              meta={isPro ? "Pro" : "Free plan"}
              leading={
                <View style={styles.iconBadge}>
                  <Text style={styles.iconGlyph}>◈</Text>
                </View>
              }
              onPress={() => router.push(routes.settingsMembership())}
            />
            <HubRow
              label="Permissions"
              meta={`${grantedCount} of 2 granted`}
              leading={
                <View style={styles.iconBadge}>
                  <Text style={styles.iconGlyph}>◐</Text>
                </View>
              }
              onPress={() => router.push(routes.settingsPermissions())}
            />
            {/* Android only — Apple's FamilyControls forces a system app picker with
                no app-name access, so this screen can't be built the same way on iOS. */}
            {Platform.OS === "android" && (
              <HubRow
                label="Blocked Apps"
                meta={blockedApps.length === 0 ? "No apps blocked" : `${blockedApps.length} app${blockedApps.length === 1 ? "" : "s"} blocked`}
                leading={
                  <View style={styles.iconBadge}>
                    <Text style={styles.iconGlyph}>⊘</Text>
                  </View>
                }
                onPress={() => router.push(routes.settingsBlockedApps())}
              />
            )}
            <HubRow
              label="Delete Account"
              leading={
                <View style={styles.iconBadge}>
                  <Text style={styles.iconGlyph}>⊗</Text>
                </View>
              }
              onPress={() => router.push(routes.settingsDeleteAccount())}
              isLast
            />
          </StatCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <StatCard>
            <Text style={styles.themeLabel}>Theme</Text>
            <ThemeSwitch />
          </StatCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <StatCard>
            <HubRow
              label="Help Center"
              leading={
                <View style={styles.iconBadge}>
                  <Text style={styles.iconGlyph}>?</Text>
                </View>
              }
              onPress={() => router.push(routes.settingsHelpCenter())}
              isLast
            />
          </StatCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <StatCard>
            <View style={styles.aboutRow}>
              <Text style={styles.label}>About busy-bee</Text>
              <Text style={styles.meta}>Version {Constants.expoConfig?.version ?? "1.0.0"}</Text>
            </View>
          </StatCard>
          <View style={styles.followWrap}>
            <Text style={styles.sectionLabel}>Follow us</Text>
            <View style={styles.followRow}>
              {SOCIAL_LINKS.map((social) => (
                <Pressable
                  key={social.label}
                  onPress={() => Linking.openURL(social.url)}
                  style={styles.followButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow busy-bee on ${social.label}`}
                >
                  <Text style={styles.followGlyph}>{social.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable onPress={signOut} hitSlop={12} style={styles.signOutRow}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
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
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    pageTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "700",
      paddingTop: spacing.md,
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
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarGlyph: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    iconGlyph: {
      color: colors.text,
      fontSize: 14,
    },
    themeLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
      marginBottom: spacing.sm,
    },
    aboutRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
    },
    meta: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    followWrap: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    followRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    followButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
    },
    followGlyph: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    signOutRow: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    signOut: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
