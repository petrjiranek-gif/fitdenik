import {
  classifyLineKind,
  formatDayLine,
  parsePlanDays,
  rebuildMarkdownFromDays,
  stripDayPrefix,
  swapPlanDays,
  updatePlanDay,
} from "@/lib/iron-man-2030/coach-plan-parse";
import type { IronManCoachWeeklyPlan } from "@/lib/iron-man-2030/types";

export function ensurePlanDays(plan: IronManCoachWeeklyPlan): IronManCoachWeeklyPlan {
  return {
    ...plan,
    days: plan.days ?? parsePlanDays(plan.markdown, plan.weekStart),
  };
}

export function mutatePlanDays(plan: IronManCoachWeeklyPlan, days: NonNullable<IronManCoachWeeklyPlan["days"]>): IronManCoachWeeklyPlan {
  return {
    ...plan,
    days,
    markdown: rebuildMarkdownFromDays(days),
  };
}

export function swapDaysInPlan(plan: IronManCoachWeeklyPlan, indexA: number, indexB: number): IronManCoachWeeklyPlan {
  const current = ensurePlanDays(plan);
  return mutatePlanDays(plan, swapPlanDays(current.days!, indexA, indexB));
}

export function updateDayInPlan(plan: IronManCoachWeeklyPlan, index: number, content: string): IronManCoachWeeklyPlan {
  const current = ensurePlanDays(plan);
  return mutatePlanDays(plan, updatePlanDay(current.days!, index, content));
}

export function replaceDayLineInPlan(plan: IronManCoachWeeklyPlan, index: number, line: string): IronManCoachWeeklyPlan {
  const current = ensurePlanDays(plan);
  const day = current.days![index];
  if (!day) return plan;
  const body = stripDayPrefix(line);
  const next = current.days!.map((d, i) =>
    i === index
      ? { ...d, line: formatDayLine(day.dayLabel, body), kind: classifyLineKind(body) }
      : d,
  );
  return mutatePlanDays(plan, next);
}
