import { IRON_MAN_DISCIPLINES } from "@/lib/iron-man-2030/constants";
import { resolveTrainingDiscipline } from "@/lib/iron-man-2030/discipline";
import type { BodyMeasurementEntry, TrainingSession } from "@/lib/types";

const CZECH_WEEKDAY_NAMES = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
const CZECH_DAY_SHORT = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

export function regenerationWeekdayLabel(weekday: number): string {
  return CZECH_WEEKDAY_NAMES[weekday] ?? "Úterý";
}

export function formatDateCs(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export const APP_TIME_ZONE = "Europe/Prague";

function dateKeyFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Kalendářní den v Europe/Prague — ne UTC z toISOString. */
export function dateKeyInTimeZone(now = new Date(), timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function mondayOfDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return dateKeyFromLocalDate(d);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKeyFromLocalDate(d);
}

export function lastApprovedWeekStart(state: {
  coachWeeklyPlan?: { approvedAt?: string; weekStart: string } | null;
  coachPlanHistory?: { approvedAt?: string; weekStart: string }[] | null;
}): string | undefined {
  if (state.coachWeeklyPlan?.approvedAt) return state.coachWeeklyPlan.weekStart;
  return (state.coachPlanHistory ?? []).find((p) => p.approvedAt)?.weekStart;
}

/**
 * Pondělí týdne, na který se má generovat plán.
 * Aktuální týden (Po–Ne v Praze), v neděli už další týden.
 * Když je ten týden už schválený, posune se o +7 dní.
 */
export function planWeekMonday(now = new Date(), lastApproved?: string): string {
  const today = dateKeyInTimeZone(now);
  const thisMonday = mondayOfDate(today);
  const thisSunday = addDaysToDateKey(thisMonday, 6);
  let target = today >= thisSunday ? addDaysToDateKey(thisMonday, 7) : thisMonday;
  if (lastApproved && lastApproved >= target) {
    target = addDaysToDateKey(lastApproved, 7);
  }
  return target;
}

/** @deprecated použij planWeekMonday — dříve vždy „další pondělí“ bez ohledu na schválený týden. */
export function upcomingWeekMonday(now = new Date()): string {
  return planWeekMonday(now);
}

function disciplineLabel(session: TrainingSession): string {
  const tag = resolveTrainingDiscipline(session);
  const found = IRON_MAN_DISCIPLINES.find((d) => d.id === tag);
  if (found) return found.label;
  return session.sportType;
}

function formatSessionLine(session: TrainingSession): string {
  const d = new Date(`${session.date}T12:00:00`);
  const dayShort = CZECH_DAY_SHORT[d.getDay()];
  const disc = disciplineLabel(session);
  const title = session.title.trim() ? ` (${session.title.trim()})` : "";
  return `  ${dayShort}: ${disc}${title} — ${session.durationMin} min — ${session.calories} kcal`;
}

/** Všechny tréninky z deníku za posledních 28 dní — formát dle dokumentu. */
export function formatLast4WeeksTraining(sessions: TrainingSession[], now = new Date()): string {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const scoped = sessions
    .filter((s) => s.date >= cutoffKey)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  if (scoped.length === 0) return "Žádné záznamy za poslední 4 týdny.";

  const weekMap = new Map<string, TrainingSession[]>();
  for (const s of scoped) {
    const mon = mondayOfDate(s.date);
    const list = weekMap.get(mon) ?? [];
    list.push(s);
    weekMap.set(mon, list);
  }

  const lines: string[] = [];
  for (const [mon, list] of [...weekMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    const sunKey = addDaysToDateKey(mon, 6);
    const fmtShort = (k: string) =>
      new Date(`${k}T12:00:00`).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
    lines.push(`Týden ${fmtShort(mon)}–${fmtShort(sunKey)}:`);

    const byDate = new Map<string, TrainingSession[]>();
    for (const s of list) {
      const dl = byDate.get(s.date) ?? [];
      dl.push(s);
      byDate.set(s.date, dl);
    }
    for (const [, daySessions] of [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const s of daySessions) {
        lines.push(formatSessionLine(s));
      }
    }
    const totalMin = list.reduce((a, s) => a + s.durationMin, 0);
    const totalKcal = list.reduce((a, s) => a + s.calories, 0);
    lines.push(
      `  Celkem: ${list.length} tréninků / ${(totalMin / 60).toFixed(1).replace(".", ",")} hod / ${totalKcal} kcal`,
    );
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function formatWeightTrend30d(entries: BodyMeasurementEntry[], now = new Date()): string {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const sorted = entries
    .filter((e) => e.weightKg > 0 && e.measuredAt.slice(0, 10) >= cutoffKey)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));

  if (sorted.length < 2) return "Nedostatek dat";

  const first = sorted[0].weightKg;
  const last = sorted[sorted.length - 1].weightKg;
  const delta = last - first;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} kg / 30 dní (z ${first.toFixed(1)} na ${last.toFixed(1)} kg)`;
}
