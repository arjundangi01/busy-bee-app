import { MISSION_STATUS, SESSION_END_REASON, TASK_STATUS } from "@/utils/enums";

export type IApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export type IUser = {
  id: string;
  name: string;
  email: string;
};

export type IAuthResult = {
  user: IUser;
  token: string;
};

export type IMissionTask = {
  id: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
  status: TASK_STATUS;
};

export type IMission = {
  id: string;
  title: string;
  status: MISSION_STATUS;
  estimatedMinutes: number | null;
  progressPercent: number;
  tasks: IMissionTask[];
  nextTask: IMissionTask | null;
};

export type IMissionPlan = {
  nextStep: string;
  remainingSteps: string[];
};

export type IFocusSession = {
  id: string;
  missionId: string;
  startedAt: string;
  endedAt: string | null;
  elapsedSeconds: number | null;
  sessionEndReason: SESSION_END_REASON | null;
  blockedAttemptCount: number;
};

export type ITrendDayStatus = "hit" | "miss" | "today";

export type ITrendDay = {
  date: string;
  status: ITrendDayStatus;
};

export type ITodayCard = {
  sessionsCompleted: number;
  minutesFocused: number;
  tasksWaiting: number;
};

export type IDashboard = {
  name: string;
  streakDays: number;
  backlogCount: number;
  timeReclaimedMinutes: number;
  trend: ITrendDay[];
  today: ITodayCard;
  patternSignal: string | null;
  isColdStart: boolean;
};
