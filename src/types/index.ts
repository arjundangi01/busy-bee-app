import { COMMITMENT_LEVEL, GOAL, MISSION_STATUS, TASK_STATUS, USER_ROLE } from "@/utils/enums";

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

export type IOnboardingInsight = {
  unmanagedWeeks: number;
  guidedDays: number;
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

export type IOnboardingResult = {
  profile: {
    goal: GOAL;
    age: number;
    role: USER_ROLE;
    commitmentLevel: COMMITMENT_LEVEL;
  };
  insight: IOnboardingInsight;
  mission: {
    id: string;
    title: string;
    estimatedMinutes: number;
    tasks: { id: string; title: string; order: number; estimatedMinutes: number }[];
  };
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
