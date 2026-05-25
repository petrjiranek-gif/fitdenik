import {
  IRON_MAN_DISCIPLINES,
  IRON_MAN_PHASES,
  IRON_MAN_PROJECT_START,
  IRON_MAN_RACE_1406_DEFAULT,
  IRON_MAN_RACE_703_DEFAULT,
  IRON_MAN_START_WEIGHT_KG,
  IRON_MAN_TARGET_WEIGHT_KG,
  type IronManPhase,
  type IronManPhaseId,
} from "@/lib/iron-man-2030/constants";
import { resolveTrainingDiscipline } from "@/lib/iron-man-2030/discipline";
import type {
  IronMan2030Settings,
  IronMan2030State,
  IronManCalendarDay,
  IronManDisciplineSlice,
} from "@/lib/iron-man-2030/types";
import type { BodyMeasurementEntry, TrainingSession } from "@/lib/types";

export type CountdownParts = {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  targetIso: string;
};

export function parseDateKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function getActivePhase(today = new Date()): IronManPhase {
  const t = today.getTime();
  for (const phase of IRON_MAN_PHASES) {
    const from = parseDateKey(phase.from).getTime();
    const to = parseDateKey(phase.to).getTime();
    if (t >= from && t <= to) return phase;
  }
  if (t < parseDateKey(IRON_MAN_PHASES[0].from).getTime()) return IRON_MAN_PHASES[0];
  return IRON_MAN_PHASES[IRON_MAN_PHASES.length - 1];
}

export function phaseTargetSessions(phase: IronManPhase): number {
  const from = parseDateKey(phase.from);
  const to = parseDateKey(phase.to);
  const weeks = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (7 * 24 * 3600 * 1000)));
  const midSessions = (phase.sessionsPerWeek[0] + phase.sessionsPerWeek[1]) / 2;
  return Math.round(weeks * midSessions);
}

export function projectSessions(sessions: TrainingSession[]): TrainingSession[] {
  return sessions.filter((s) => s.date >= IRON_MAN_PROJECT_START);
}

export function ironManTaggedSessions(sessions: TrainingSession[]): TrainingSession[] {
  return projectSessions(sessions).filter((s) => s.ironMan2030Project);
}

export function computeCountdown(targetIso: string, now = new Date()): CountdownParts {
  const target = parseDateKey(targetIso);
  target.setHours(0, 0, 0, 0);
  let diff = target.getTime() - now.getTime();
  if (diff < 0) diff = 0;

  const totalSec = Math.floor(diff / 1000);
  const years = Math.floor(totalSec / (365.25 * 24 * 3600));
  let rem = totalSec - Math.floor(years * 365.25 * 24 * 3600);
  const days = Math.floor(rem / (24 * 3600));
  rem -= days * 24 * 3600;
  const hours = Math.floor(rem / 3600);
  rem -= hours * 3600;
  const minutes = Math.floor(rem / 60);
  const seconds = rem - minutes * 60;

  return { years, days, hours, minutes, seconds, targetIso };
}

export function race703TargetDate(settings: IronMan2030Settings): string {
  if (settings.race703.registered && settings.race703.actualRaceDate) {
    return settings.race703.actualRaceDate;
  }
  return IRON_MAN_RACE_703_DEFAULT;
}

export function race1406TargetDate(settings: IronMan2030Settings): string {
  if (settings.race1406.registered && settings.race1406.actualRaceDate) {
    return settings.race1406.actualRaceDate;
  }
  return IRON_MAN_RACE_1406_DEFAULT;
}

export function computeProjectStats(sessions: TrainingSession[]) {
  const scoped = projectSessions(sessions);
  const uniqueDays = new Set(scoped.map((s) => s.date));
  let totalMin = 0;
  let totalKcal = 0;
  for (const s of scoped) {
    totalMin += s.durationMin;
    totalKcal += s.calories;
  }
  const start = parseDateKey(IRON_MAN_PROJECT_START);
  const weeks = Math.max(1, (Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000));
  return {
    totalCalories: totalKcal,
    totalHours: totalMin / 60,
    trainingDays: uniqueDays.size,
    avgHoursPerWeek: totalMin / 60 / weeks,
    sessionCount: scoped.length,
  };
}

export function computeDisciplineBreakdown(
  sessions: TrainingSession[],
  mode: "hours" | "calories",
): IronManDisciplineSlice[] {
  const scoped = projectSessions(sessions);
  const map = new Map<string, { hours: number; calories: number }>();
  for (const s of scoped) {
    const id = resolveTrainingDiscipline(s);
    const cur = map.get(id) ?? { hours: 0, calories: 0 };
    cur.hours += s.durationMin / 60;
    cur.calories += s.calories;
    map.set(id, cur);
  }
  return IRON_MAN_DISCIPLINES.map((d) => {
    const v = map.get(d.id) ?? { hours: 0, calories: 0 };
    return {
      id: d.id,
      label: d.label,
      color: d.color,
      hours: v.hours,
      calories: v.calories,
    };
  }).filter((row) => (mode === "hours" ? row.hours : row.calories) > 0);
}

export function computeWeightProgress(entries: BodyMeasurementEntry[]) {
  const sorted = [...entries]
    .filter((e) => e.weightKg > 0 && e.measuredAt.slice(0, 10) >= IRON_MAN_PROJECT_START)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  const latest = sorted[sorted.length - 1];
  const current = latest?.weightKg ?? IRON_MAN_START_WEIGHT_KG;
  const remaining = Math.max(0, current - IRON_MAN_TARGET_WEIGHT_KG);
  const totalDrop = IRON_MAN_START_WEIGHT_KG - IRON_MAN_TARGET_WEIGHT_KG;
  const done = IRON_MAN_START_WEIGHT_KG - current;
  const pct = totalDrop > 0 ? Math.min(100, Math.max(0, (done / totalDrop) * 100)) : 0;
  return { current, remaining, pct, history: sorted };
}

export function computePhaseCompletion(
  sessions: TrainingSession[],
  phase: IronManPhase,
  phaseId: IronManPhaseId,
) {
  const scoped = sessions.filter((s) => s.date >= phase.from && s.date <= phase.to);
  const target = phaseTargetSessions(phase);
  const done = scoped.length;
  const pct = target > 0 ? Math.min(100, (done / target) * 100) : 0;
  return { target, done, pct, phaseId };
}

export function missedDaysWithReasons(
  state: IronMan2030State,
  sessions: TrainingSession[],
): { date: string; status: string; reason: string }[] {
  const trainingDates = new Set(projectSessions(sessions).map((s) => s.date));
  const out: { date: string; status: string; reason: string }[] = [];
  for (const [date, day] of Object.entries(state.calendar)) {
    if (date < IRON_MAN_PROJECT_START) continue;
    if (day.status === "training" && !trainingDates.has(date)) continue;
    if (["sick", "injury", "travel", "rest"].includes(day.status)) {
      out.push({
        date,
        status: day.status,
        reason: day.reason?.trim() || "—",
      });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function calendarStatsForRange(
  calendar: Record<string, IronManCalendarDay>,
  from: string,
  to: string,
) {
  const counts: Record<string, number> = {};
  for (const [date, day] of Object.entries(calendar)) {
    if (date < from || date > to) continue;
    counts[day.status] = (counts[day.status] ?? 0) + 1;
  }
  return counts;
}

export function mergeCalendarWithTrainings(
  calendar: Record<string, IronManCalendarDay>,
  sessions: TrainingSession[],
): Record<string, IronManCalendarDay> {
  const merged = { ...calendar };
  for (const s of projectSessions(sessions)) {
    if (!merged[s.date]) {
      merged[s.date] = { status: "training" };
    }
  }
  return merged;
}

export function weeklySessionTrend(sessions: Array<{ sessionAt: string }>) {
  const now = new Date();
  const buckets: number[] = Array.from({ length: 8 }, () => 0);
  for (const s of sessions) {
    const d = new Date(s.sessionAt);
    const diffWeeks = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 3600 * 1000));
    if (diffWeeks >= 0 && diffWeeks < 8) buckets[7 - diffWeeks] += 1;
  }
  return buckets;
}

export function dataChallengeItems(settings: IronMan2030Settings) {
  const m = settings.athleteMetrics;
  const items: { key: string; label: string; href: string }[] = [];
  if (m.vo2Max == null || m.vo2Max <= 0) {
    items.push({ key: "vo2", label: "VO₂ Max", href: "/baseline" });
  }
  if (m.ftpWatts == null || m.ftpWatts <= 0) {
    items.push({ key: "ftp", label: "FTP (kolo)", href: "/baseline" });
  }
  if (m.swim100mSec == null || m.swim100mSec <= 0) {
    items.push({ key: "swim", label: "Plavecký čas na 100 m", href: "/baseline" });
  }
  if (m.carbsPerHour == null || m.carbsPerHour <= 0) {
    items.push({ key: "carbs", label: "Sacharidy při zátěži (g/h)", href: "/nutrition" });
  }
  if (!m.hrvLastDate) {
    items.push({ key: "hrv", label: "HRV trend (7+ dní)", href: "/body-metrics" });
  } else {
    const last = parseDateKey(m.hrvLastDate);
    const days = (Date.now() - last.getTime()) / (24 * 3600 * 1000);
    if (days > 7) {
      items.push({ key: "hrv", label: "HRV trend (7+ dní)", href: "/body-metrics" });
    }
  }
  return items;
}
