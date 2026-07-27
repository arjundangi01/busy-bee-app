import { StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IColorTokens, spacing, useColors } from "@/theme";
import * as UsageStats from "../../../../modules/usage-stats";

// Inline priming state, not a full-screen nudge — mirrors 06-permission-priming.md's
// tone but there's no "first Start tap" moment for Progress to gate the way
// blocking enforcement's nudge gates Start Mission Flow, so this only ever
// appears inline where the data itself would otherwise render.
export function UsageAccessPrompt() {
  const colors = useColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      <Text style={styles.body}>
        Android requires Usage Access to be turned on manually in Settings — there&apos;s no in-app prompt for it.
        Without it, Screen Time and Device Activity can&apos;t show real numbers.
      </Text>
      <PrimaryButton label="Turn on Usage Access" onPress={() => UsageStats.openUsageAccessSettings()} />
    </View>
  );
}

const createStyles = (colors: IColorTokens) =>
  StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
    body: {
      color: colors.textSecondary,
      fontSize: 12.5,
      lineHeight: 18,
    },
  });
