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

export function mondayOfDate(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Pondělí nadcházejícího týdne (plán vždy na „příští týden“). */
export function upcomingWeekMonday(now = new Date()): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  const dow = d.getDay();
  const daysUntilNextMonday = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + daysUntilNextMonday);
  return d.toISOString().slice(0, 10);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
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
