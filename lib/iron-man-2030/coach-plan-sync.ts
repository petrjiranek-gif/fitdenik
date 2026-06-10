import type { IronManCalendarDay } from "@/lib/iron-man-2030/types";
import type { TrainingSession } from "@/lib/types";

/** Automaticky potvrdí dny plánu, pokud existuje trénink/import na stejné datum. */
export function computeCoachConfirmationPatch(
  calendar: Record<string, IronManCalendarDay>,
  sessions: TrainingSession[],
  coachPlanId: string,
): Record<string, IronManCalendarDay> {
  const sessionsByDate = new Map<string, TrainingSession>();
  for (const s of sessions) {
    if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, s);
  }

  const patch: Record<string, IronManCalendarDay> = {};
  for (const [date, day] of Object.entries(calendar)) {
    if (day.coachPlanId !== coachPlanId) continue;
    if (day.coachConfirmedAt) continue;
    const session = sessionsByDate.get(date);
    if (!session) continue;
    patch[date] = {
      ...day,
      coachConfirmedAt: new Date().toISOString(),
      coachMatchedSessionId: session.id,
    };
  }
  return patch;
}

export function isCoachDayConfirmed(
  day: IronManCalendarDay | undefined,
  hasTrainingOnDate: boolean,
): boolean {
  if (!day?.coachPlanId) return false;
  return Boolean(day.coachConfirmedAt) || hasTrainingOnDate;
}
