import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";
import { useRecordBlockedAttempt } from "@/module/focus/hooks/useRecordBlockedAttempt";

const NOTIFICATION_UPDATE_INTERVAL_SECONDS = 15;

type UseBlockingEnforcementArgs = {
  focusSessionId: string | null;
  missionId: string;
  blockedPackageNames: string[];
  currentStepText: string;
  elapsedSeconds: number;
  elapsedLabel: string;
};

// Bridges FocusSessionTemplate's existing JS-side session state into the
// native blocking-enforcement module (design-artifacts/evolution/specs/
// 01-blocked-app-interstitial.md, 02-session-notification.md). No-ops
// completely off Android via the module's own Platform guard, so this can
// be called unconditionally from the template without a platform branch
// at every call site.
export function useBlockingEnforcement({
  focusSessionId,
  missionId,
  blockedPackageNames,
  currentStepText,
  elapsedSeconds,
  elapsedLabel,
}: UseBlockingEnforcementArgs) {
  const { recordBlockedAttempt } = useRecordBlockedAttempt();
  const sessionStartedRef = useRef(false);
  const lastStepTextRef = useRef<string | null>(null);
  // Always true off-Android — enforcement was never promised there (see the
  // blocklist spec's frozen "Never touch iOS" boundary), so this warning
  // must never render on a platform where it wouldn't mean anything.
  const [isEnforcementActive, setIsEnforcementActive] = useState(true);

  // Checked on mount and every foreground return, not just once — the
  // accessibility permission can be revoked from system Settings at any
  // point during a session, entirely outside this app's own lifecycle, and
  // a collision that stops being caught with no in-app signal at all is
  // exactly the "quietly stops working" failure mode this cycle exists to
  // close (see 01-blocked-app-interstitial.md's revoked-permission edge case).
  useEffect(() => {
    if (!focusSessionId || Platform.OS !== "android") return;

    const checkEnforcement = () => {
      BlockingEnforcement.isAccessibilityServiceEnabled().then(setIsEnforcementActive);
    };

    checkEnforcement();
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") checkEnforcement();
    });
    return () => subscription.remove();
  }, [focusSessionId]);

  // Pushes session identity + blocklist snapshot once the session exists.
  // Re-runs only if the session/blocklist actually change, not on every
  // render — each call crosses the native bridge.
  useEffect(() => {
    if (!focusSessionId) return;
    sessionStartedRef.current = true;
    BlockingEnforcement.setActiveSession(focusSessionId, missionId, blockedPackageNames, currentStepText);
    // currentStepText intentionally omitted — its own effect below handles
    // in-session step changes without re-pushing the whole blocklist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSessionId, missionId, blockedPackageNames.join(",")]);

  // Step text changes far less often than elapsedSeconds ticks — push only
  // on a real change, not every second.
  useEffect(() => {
    if (!focusSessionId || currentStepText === lastStepTextRef.current) return;
    lastStepTextRef.current = currentStepText;
    BlockingEnforcement.updateCurrentStep(currentStepText);
  }, [focusSessionId, currentStepText]);

  // Throttled to once per 15s of elapsed time rather than every 1s tick, to
  // avoid hammering NotificationManager with an update the user can't
  // perceive the difference of anyway.
  useEffect(() => {
    if (!focusSessionId) return;
    if (elapsedSeconds === 0 || elapsedSeconds % NOTIFICATION_UPDATE_INTERVAL_SECONDS !== 0) return;
    BlockingEnforcement.updateSessionNotification(elapsedLabel);
  }, [focusSessionId, elapsedSeconds, elapsedLabel]);

  useEffect(() => {
    if (!focusSessionId) return;

    // One more push the instant the app leaves the foreground, so the
    // notification reflects genuinely fresh data for however long it stays
    // backgrounded, not whatever the last 15-second tick happened to catch.
    // On return to foreground, checks for a collision that happened while
    // backgrounded (the interstitial itself has no reach into JS) and
    // records it — consume-once on the native side, so this can never
    // double-record the same attempt.
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "background") {
        BlockingEnforcement.updateSessionNotification(elapsedLabel);
        return;
      }
      if (nextState === "active") {
        BlockingEnforcement.getPendingBlockedAttempt().then((pending) => {
          if (!pending) return;
          recordBlockedAttempt(focusSessionId).catch(() => {
            // Worth recording, never worth crashing an active session over
            // if the network call itself fails — the pending record is
            // already consumed, so this undercounts one attempt rather
            // than retrying into a loop.
          });
        });
      }
    });

    return () => subscription.remove();
  }, [focusSessionId, elapsedLabel, recordBlockedAttempt]);

  // Safety net alongside the explicit clearActiveSession() call at each real
  // session-end path in FocusSessionTemplate — covers the component
  // unmounting for any other reason without leaving the native side
  // thinking a session is active forever.
  useEffect(() => {
    return () => {
      if (sessionStartedRef.current) {
        BlockingEnforcement.clearActiveSession();
      }
    };
  }, []);

  return { isEnforcementActive };
}
