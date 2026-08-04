import {
  MISSION_STATUS,
  SESSION_DISTRACTION_TIMING_TIER,
  SESSION_END_REASON,
  SESSION_ROUGHNESS,
  SUBSCRIPTION_STATUS,
  TASK_STATUS,
} from "@/utils/enums";

export type IApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export type IUser = {
  id: string;
  name: string;
  email: string;
  backgroundExecutionGranted: boolean | null;
  notificationsGranted: boolean | null;
  pushNotificationsEnabled: boolean;
  eodNudgeEnabled: boolean;
  blocklistDefaultsSeeded: boolean;
  occupation: string | null;
  phone: string | null;
  age: number | null;
  bio: string | null;
  selectedWorkTypeId: string | null;
  selectedSkinId: string | null;
  selectedThemeId: string | null;
  accessibilityPrimingShown: boolean;
};

export type IAuthResult = {
  user: IUser;
  token: string;
};

export type IWorkType = {
  id: string;
  key: string;
  label: string;
  tier: "FREE" | "PRO";
  totalUnits: number;
  locked: boolean;
};

export type IBeeSkin = {
  id: string;
  key: string;
  label: string;
  tier: "FREE" | "PRO";
  bodyPrimary: string;
  bodySecondary: string;
  stripe: string;
  locked: boolean;
};

export type IHiveTheme = {
  id: string;
  key: string;
  label: string;
  tier: "FREE" | "PRO";
  skyTop: string;
  skyBottom: string;
  wallTop: string;
  wallBottom: string;
  floorTop: string;
  floorBottom: string;
  lanternGlow: string;
  locked: boolean;
};

export type IBankedWork = {
  workTypeId: string;
  key: string;
  label: string;
  totalUnitsCompleted: number;
};

export type IBlockedApp = {
  id: string;
  packageName: string;
  appName: string;
  createdAt: string;
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
  hasActiveSession: boolean;
};

export type IMissionPlan = {
  nextStep: string;
  nextStepMinutes: number;
  remainingSteps: string[];
  remainingStepsMinutes: number[];
  estimatedMinutes: number;
};

export type IFocusSession = {
  id: string;
  missionId: string;
  startedAt: string;
  endedAt: string | null;
  elapsedSeconds: number | null;
  sessionEndReason: SESSION_END_REASON | null;
  blockedAttemptCount: number;
  workTypeId: string | null;
  workUnitsCompleted: number;
};

export type ITrendDayStatus = "hit" | "miss" | "today";

export type ITrendDay = {
  date: string;
  status: ITrendDayStatus;
};

export type ISessionSummary = {
  id: string;
  missionId: string;
  missionTitle: string;
  startedAt: string;
  endedAt: string | null;
  roughness: SESSION_ROUGHNESS;
};

export type IPaginatedSessionHistory = {
  items: ISessionSummary[];
  nextCursor: string | null;
};

// design-artifacts/evolution/specs/14-session-timeline.md
export type ISessionTimelineStep = {
  id: string;
  title: string;
  startedAt: string;
  completedAt: string | null;
  actualSeconds: number;
  estimatedMinutes: number | null;
};

export type ISessionTimelineDistraction = {
  id: string;
  occurredAt: string;
  packageName: string;
  appName: string | null;
  stepId: string | null;
};

export type ISessionDistractionTiming = {
  tier: SESSION_DISTRACTION_TIMING_TIER;
  firstBlockElapsedSeconds: number | null;
  firstBlockElapsedPercent: number | null;
  baselineElapsedPercent: number | null;
};

export type ISessionTimeline = {
  id: string;
  missionId: string;
  missionTitle: string;
  startedAt: string;
  endedAt: string;
  sessionEndReason: SESSION_END_REASON | null;
  roughness: SESSION_ROUGHNESS;
  steps: ISessionTimelineStep[];
  distractions: ISessionTimelineDistraction[];
  distractionTiming: ISessionDistractionTiming;
};

export type ITodayCard = {
  sessionsCompleted: number;
  minutesFocused: number;
  tasksWaiting: number;
  sessions: ISessionSummary[];
  roughSessionCount: number;
};

export type IActiveSession = {
  focusSessionId: string;
  missionId: string;
  startedAt: string;
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
  activeSession: IActiveSession | null;
};

export type IStreakCalendarCellStatus = "hit" | "miss" | "today" | "no-history";

export type IStreakCalendarCell = {
  date: string;
  status: IStreakCalendarCellStatus;
};

export type IFocusWindow = {
  startHour: number;
  endHour: number;
};

export type IPlanLimits = {
  dailySessionCap: number | null;
  sessionDurationCapSeconds: number | null;
  maxTasksPerMission: number | null;
  maxMissionMinutes: number | null;
};

export type ISubscriptionStatus = {
  isPro: boolean;
  status: SUBSCRIPTION_STATUS | null;
  expiresAt: string | null;
  productId: string | null;
  limits: IPlanLimits;
};

export type ITopDistraction = {
  appName: string;
  count: number;
};

export type IUsageMetric = {
  value: number;
  avg7d: number | null;
};

export type IScreenTimeAppRow = {
  packageName: string;
  appName: string;
  foregroundSeconds: number;
  isBlocked: boolean;
};

export type IScreenTime = {
  totalForegroundSeconds: number;
  apps: IScreenTimeAppRow[];
} | null;

export type IDeviceActivity = {
  pickupCount: IUsageMetric;
  offlineSeconds: IUsageMetric;
  distractionsSeconds: IUsageMetric;
  firstPickupAt: string | null;
  lastPickupAt: string | null;
  priorFirstPickupAts: string[];
  priorLastPickupAts: string[];
} | null;

export type IProgress = {
  currentStreakDays: number;
  bestStreakDays: number;
  streakCalendar: IStreakCalendarCell[];
  timeReclaimedThisWeekMinutes: number;
  timeReclaimedByWeekMinutes: number[];
  focusDurationByWeekMinutes: number[];
  currentAvgFocusMinutes: number | null;
  bestFocusWindow: IFocusWindow | null;
  toughestDay: string | null;
  topDistraction: ITopDistraction | null;
  longestFocusMinutes: number | null;
  sessionsEndedEarlyThisWeek: number;
  tasksPastTheirTime: number;
  timeToStartMinutes: number | null;
  bounceBackRatePercent: number | null;
  missionCompletionRatePercent: number | null;
  stepCompletionRatePercent: number | null;
  screenTime: IScreenTime;
  deviceActivity: IDeviceActivity;
  isColdStart: boolean;
};
