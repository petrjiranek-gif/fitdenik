import type { IronManCoachWeeklyPlan } from "@/lib/iron-man-2030/types";
import type { IronManCalendarDay } from "@/lib/iron-man-2030/types";
import {
  classifyLineKind,
  findDayLine,
  normalizePlanText,
  parsePlanDays,
  stripDayPrefix,
} from "@/lib/iron-man-2030/coach-plan-parse";

function classifyDayLine(line: string, isRegenerationWeekday: boolean): Omit<IronManCalendarDay, "coachPlanId"> {
  const kind = classifyLineKind(stripDayPrefix(line));
  const reason = line.length > 220 ? `${line.slice(0, 217)}…` : line;

  if (kind === "rest") {
    return {
      status: isRegenerationWeekday ? "regeneration" : "rest",
      reason,
    };
  }
  if (kind === "regeneration") {
    return { status: "regeneration", reason };
  }
  return { status: "training", reason };
}

/** Mapuje vygenerovaný plán na záznamy kalendáře (Po–Ne od weekStart). */
export function applyWeeklyPlanToCalendar(
  plan: IronManCoachWeeklyPlan,
  regenerationWeekday: number,
): Record<string, IronManCalendarDay> {
  const days = plan.days ?? parsePlanDays(plan.markdown, plan.weekStart);
  const updates: Record<string, IronManCalendarDay> = {};

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dow = new Date(`${day.date}T12:00:00`).getDay();
    const line = day.line || findDayLine(plan.markdown, i);
    if (!line) continue;
    updates[day.date] = {
      ...classifyDayLine(line, dow === regenerationWeekday),
      coachPlanId: plan.id,
    };
  }

  return updates;
}

/** Znovu aplikuje jeden den plánu do kalendáře po úpravě. */
export function applyPlanDayToCalendar(
  plan: IronManCoachWeeklyPlan,
  dayIndex: number,
  regenerationWeekday: number,
): Record<string, IronManCalendarDay> {
  const days = plan.days ?? parsePlanDays(plan.markdown, plan.weekStart);
  const day = days[dayIndex];
  if (!day) return {};
  const dow = new Date(`${day.date}T12:00:00`).getDay();
  return {
    [day.date]: {
      ...classifyDayLine(day.line, dow === regenerationWeekday),
      coachPlanId: plan.id,
    },
  };
}

export function isRestLikeLine(line: string): boolean {
  const kind = classifyLineKind(stripDayPrefix(line));
  return kind === "rest" || kind === "regeneration";
}

export { normalizePlanText, findDayLine };
