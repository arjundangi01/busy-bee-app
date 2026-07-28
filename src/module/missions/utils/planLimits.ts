import { IPlanLimits } from "@/types";

export type IMissionCapStatus = {
  isAtTaskCap: boolean;
  isAtTimeBudget: boolean;
  isAtCap: boolean;
  // null means "no cap" (Pro, or the config row itself has no limit) — a
  // stepper's max should fall back to a plain UI ceiling in that case, not
  // to 0.
  remainingMinutesBudget: number | null;
};

// Shared by MissionDetailTemplate's "Add Task" and StartMissionTemplate's
// pre-start "+ Add step" — a Free user shouldn't be able to sidestep the
// mission-level cap just by padding the plan before hitting Start instead
// of adding a task after.
export function getMissionCapStatus(
  taskCount: number,
  totalMinutesUsed: number,
  limits: IPlanLimits,
  isPro: boolean,
): IMissionCapStatus {
  const remainingMinutesBudget =
    limits.maxMissionMinutes !== null ? Math.max(0, limits.maxMissionMinutes - totalMinutesUsed) : null;
  const isAtTaskCap = !isPro && limits.maxTasksPerMission !== null && taskCount >= limits.maxTasksPerMission;
  const isAtTimeBudget = !isPro && remainingMinutesBudget !== null && remainingMinutesBudget <= 0;

  return {
    isAtTaskCap,
    isAtTimeBudget,
    isAtCap: isAtTaskCap || isAtTimeBudget,
    remainingMinutesBudget,
  };
}
