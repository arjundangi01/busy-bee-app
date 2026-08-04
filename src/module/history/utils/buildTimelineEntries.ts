import { ISessionTimeline } from "@/types";
import { SESSION_END_REASON } from "@/utils/enums";

// design-artifacts/evolution/specs/14-session-timeline.md -- merges a
// session's step windows, distraction events, and its own start/end into one
// chronological list for the "What happened" section. Pure so it's easy to
// reason about independent of rendering.
export type ITimelineEntry =
  | { kind: "sessionStart"; time: string }
  | { kind: "step"; time: string; title: string; actualSeconds: number; estimatedMinutes: number | null }
  | { kind: "distraction"; time: string; appName: string; stepTitle: string | null }
  | { kind: "sessionEnd"; time: string; missionCompleted: boolean };

export const buildTimelineEntries = (timeline: ISessionTimeline): ITimelineEntry[] => {
  const stepTitleById = new Map(timeline.steps.map((step) => [step.id, step.title]));

  const entries: ITimelineEntry[] = [
    { kind: "sessionStart", time: timeline.startedAt },
    ...timeline.steps.map(
      (step): ITimelineEntry => ({
        kind: "step",
        time: step.startedAt,
        title: step.title,
        actualSeconds: step.actualSeconds,
        estimatedMinutes: step.estimatedMinutes,
      }),
    ),
    ...timeline.distractions.map(
      (distraction): ITimelineEntry => ({
        kind: "distraction",
        time: distraction.occurredAt,
        appName: distraction.appName ?? distraction.packageName,
        stepTitle: distraction.stepId ? (stepTitleById.get(distraction.stepId) ?? null) : null,
      }),
    ),
    {
      kind: "sessionEnd",
      time: timeline.endedAt,
      missionCompleted: timeline.sessionEndReason === SESSION_END_REASON.MISSION_COMPLETED,
    },
  ];

  return entries.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};
