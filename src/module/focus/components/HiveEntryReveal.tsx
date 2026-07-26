import { ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useColors } from "@/theme";

const REVEAL_DURATION_MS = 650;

// evolution/specs/08-focus-session-hive-world-presence.md "Entry Transition"
// — entering 1.3 (fresh start or resuming an active session) needs a
// deliberate monochrome-to-color "entering a different world" beat rather
// than an instant cut, dramatizing the thing that's actually true here: the
// interface itself shifts from the rest of the app's strict monochrome into
// this one full-color screen. Lives at the route boundary (this screen's
// own file — see focus.tsx), not inside FocusSessionTemplate, so it fires
// identically no matter which of the app's several entry points (Start
// Mission Flow, the dashboard's resume-active-session banner, etc.)
// navigated in. A theme-colored scrim (matching whatever monochrome look
// the rest of the app was just showing) fades out while the full-color
// scene fades/scales in beneath it — the scene's own ambient motion is
// already running underneath by the time the scrim clears, since it mounts
// immediately and animates independently of this wrapper's opacity.
export function HiveEntryReveal({ children }: { children: ReactNode }) {
  const colors = useColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: REVEAL_DURATION_MS, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }));

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.fill, contentStyle]}>{children}</Animated.View>
      <Animated.View pointerEvents="none" style={[styles.fill, scrimStyle, { backgroundColor: colors.bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
