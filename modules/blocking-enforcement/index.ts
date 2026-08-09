import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type PendingBlockedAttempt = {
  packageName: string;
  occurredAtMillis: number;
};

type BlockingEnforcementNativeModule = {
  setActiveSession: (
    sessionId: string,
    missionId: string,
    blockedPackages: string[],
    currentStepText: string,
    expiresAtEpochMillis: number,
  ) => Promise<void>;
  updateCurrentStep: (stepText: string) => Promise<void>;
  clearActiveSession: () => Promise<void>;
  getPendingBlockedAttempts: () => Promise<PendingBlockedAttempt[]>;
  isAccessibilityServiceEnabled: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
};

const NativeModule = requireOptionalNativeModule<BlockingEnforcementNativeModule>("BlockingEnforcement");

// Android only (see design-artifacts/evolution/scenarios/focus-session-realism-and-presence.md
// — iOS enforcement is a separate, unstarted spec blocked on Apple's FamilyControls
// entitlement). On iOS, or on Android running in Expo Go rather than a dev-client
// build that actually contains this native module, every call below is a silent
// no-op / safe default rather than a throw — callers must be able to run this
// feature's JS-side logic (session state, notification hook lifecycle) unconditionally
// without every call site needing its own platform branch.
const isAvailable = Platform.OS === "android" && NativeModule != null;

export async function setActiveSession(
  sessionId: string,
  missionId: string,
  blockedPackages: string[],
  currentStepText: string,
  expiresAtEpochMillis: number,
): Promise<void> {
  if (!isAvailable) return;
  await NativeModule!.setActiveSession(
    sessionId,
    missionId,
    blockedPackages,
    currentStepText,
    expiresAtEpochMillis,
  );
}

export async function updateCurrentStep(stepText: string): Promise<void> {
  if (!isAvailable) return;
  await NativeModule!.updateCurrentStep(stepText);
}

export async function clearActiveSession(): Promise<void> {
  if (!isAvailable) return;
  await NativeModule!.clearActiveSession();
}

export async function getPendingBlockedAttempts(): Promise<PendingBlockedAttempt[]> {
  if (!isAvailable) return [];
  return NativeModule!.getPendingBlockedAttempts();
}

export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (!isAvailable) return false;
  return NativeModule!.isAccessibilityServiceEnabled();
}

export async function openAccessibilitySettings(): Promise<void> {
  if (!isAvailable) return;
  await NativeModule!.openAccessibilitySettings();
}
