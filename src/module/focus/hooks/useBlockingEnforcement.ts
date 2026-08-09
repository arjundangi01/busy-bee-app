import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as BlockingEnforcement from "../../../../modules/blocking-enforcement";
import { useRecordBlockedAttempt } from "@/module/focus/hooks/useRecordBlockedAttempt";

type UseBlockingEnforcementArgs = {
  focusSessionId: string | null;
  missionId: string;
  blockedPackageNames: string[];
  currentStepText: string;
  // The work-unit index the Companion is currently rendering (see
  // computeCurrentWorkUnit) — used only to derive when "distracted" should
  // clear back to "at-work": the moment this advances past the unit a
  // collision was recorded on, per 03-companion-work-types.md's "reverts on
  // the next real progress tick" rule. No timer needed — it's a plain
  // derived comparison against a value the caller already computes.
  currentWorkUnit: number;
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
  currentWorkUnit,
}: UseBlockingEnforcementArgs) {
  const { recordBlockedAttempt } = useRecordBlockedAttempt();
  const lastStepTextRef = useRef<string | null>(null);
  const [distractedSinceUnit, setDistractedSinceUnit] = useState<number | null>(null);
  // Read inside the AppState listener below instead of depending on the raw
  // value directly — currentWorkUnit changes every few minutes while a
  // session runs, and depending on it directly would tear down and
  // resubscribe the global AppState listener each time. A ref lets the
  // listener stay subscribed for the whole session while still reading the
  // current value when it actually fires. Updated via an effect, never
  // during render (mutating a ref mid-render breaks under React Compiler).
  const currentWorkUnitRef = useRef(currentWorkUnit);
  useEffect(() => {
    currentWorkUnitRef.current = currentWorkUnit;
  }, [currentWorkUnit]);
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

  // Re-offered at every session start, unlike the accessibility check above
  // (which re-checks continuously) — there's no in-session "went to Settings
  // and came back" loop to close for notifications, only the one-time gap
  // where onboarding's own prompt was skippable and never asked again.
  // Non-blocking: the session starts regardless of the result, matching
  // this module's existing "permission absence degrades gracefully" rule —
  // if ungranted, the foreground service's notification silently won't be
  // visible, but blocking enforcement itself is unaffected.
  useEffect(() => {
    if (!focusSessionId || Platform.OS !== "android") return;
    Notifications.getPermissionsAsync().then((current) => {
      if (current.status !== "granted") {
        Notifications.requestPermissionsAsync();
      }
    });
  }, [focusSessionId]);

  // Pushes session identity + blocklist snapshot once the session exists,
  // and again whenever the blocklist itself changes mid-session. The very
  // first push for a given session goes out immediately (blocking should
  // start right away, not 400ms late) — every push after that for the same
  // session is debounced, so toggling several apps in Settings in quick
  // succession collapses into one native push instead of one per toggle.
  // This is a one-shot timer that gets cancelled and rescheduled on each
  // change (via the effect cleanup), never a repeating interval.
  const pushedSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusSessionId) return;

    if (pushedSessionIdRef.current !== focusSessionId) {
      pushedSessionIdRef.current = focusSessionId;
      BlockingEnforcement.setActiveSession(focusSessionId, missionId, blockedPackageNames, currentStepText);
      return;
    }

    const timeout = setTimeout(() => {
      BlockingEnforcement.setActiveSession(focusSessionId, missionId, blockedPackageNames, currentStepText);
    }, 400);
    return () => clearTimeout(timeout);
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

  useEffect(() => {
    if (!focusSessionId) return;

    // The ongoing notification itself is now owned natively by
    // FocusSessionForegroundService (started/stopped alongside
    // setActiveSession/clearActiveSession) — it ticks its own elapsed-time
    // display so it survives the app being backgrounded or force-exited,
    // independent of JS being alive. This listener now only checks for
    // collisions that happened while backgrounded (the interstitial itself
    // has no reach into JS) and records them — consume-all on the native
    // side (a small capped queue, not just the latest one), so back-to-back
    // collisions before the app is foregrounded again are never lost, and
    // none of them can be double-recorded.
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        BlockingEnforcement.getPendingBlockedAttempts().then((pending) => {
          if (pending.length === 0) return;
          setDistractedSinceUnit(currentWorkUnitRef.current);
          pending.forEach((attempt) => {
            recordBlockedAttempt({ focusSessionId, packageName: attempt.packageName }).catch(() => {
              // Worth recording, never worth crashing an active session over
              // if the network call itself fails — the pending record is
              // already consumed, so this undercounts one attempt rather
              // than retrying into a loop.
            });
          });
        });
      }
    });

    return () => subscription.remove();
  }, [focusSessionId, recordBlockedAttempt]);

  const isDistracted = distractedSinceUnit !== null && distractedSinceUnit === currentWorkUnit;

  return { isEnforcementActive, isDistracted };
}
