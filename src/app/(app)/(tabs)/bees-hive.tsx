import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "expo-router";
import { HiveEntryReveal } from "@/components/shared/HiveEntryReveal";
import { BeesHiveTemplate } from "@/module/hive/templates/BeesHiveTemplate";

// Replays the cloud-parting reveal every time this tab regains focus (not
// just on first mount) — a persistent Tabs.Screen doesn't remount on
// revisit by default, unlike Focus Session's own one-shot route-level use
// of HiveEntryReveal (see focus.tsx), so this needs its own refocus
// detection. Bumping `revealKey` remounts BeesHiveTemplate underneath;
// TanStack Query's cache serves the previous data instantly on remount
// (revalidating in the background), so there's no visible loading flash —
// `onSceneReady` fires again almost immediately.
export default function BeesHive() {
  const isFocused = useIsFocused();
  const wasFocusedRef = useRef(isFocused);
  const [revealKey, setRevealKey] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      setRevealKey((key) => key + 1);
      setSceneReady(false);
    }
    wasFocusedRef.current = isFocused;
  }, [isFocused]);

  return (
    <HiveEntryReveal
      key={revealKey}
      ready={sceneReady}
      headline="Entering the Hive"
      subcopy="Bee's tidying up the workshop."
    >
      <BeesHiveTemplate onSceneReady={() => setSceneReady(true)} />
    </HiveEntryReveal>
  );
}
