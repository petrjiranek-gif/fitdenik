import { addDaysToDateKey } from "@/lib/iron-man-2030/coach-data";
import type { IronManCalendarDay } from "@/lib/iron-man-2030/types";

const WEEK_DAYS: { names: string[] }[] = [
  { names: ["pondělí", "pondeli"] },
  { names: ["úterý", "utery", "úter", "uter"] },
  { names: ["středa", "streda"] },
  { names: ["čtvrtek", "ctvrtek"] },
  { names: ["pátek", "patek"] },
  { names: ["sobota"] },
  { names: ["neděle", "nedele"] },
];

function normalizeLine(line: string): string {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function findDayLine(markdown: string, dayIndex: number): string | null {
  const names = WEEK_DAYS[dayIndex].names;
  const lines = markdown.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const norm = normalizeLine(line);
    for (const name of names) {
      const n = normalizeLine(name);
      if (norm.startsWith(`${n}:`) || norm.startsWith(`${n} `) || norm === n) {
        return line;
      }
    }
  }
  return null;
}

function classifyDayLine(
  line: string,
  isRegenerationWeekday: boolean,
): IronManCalendarDay {
  const norm = normalizeLine(line);
  const reason = line.length > 220 ? `${line.slice(0, 217)}…` : line;

  if (
    norm.includes("volno") ||
    norm.includes("regenerace") ||
    norm.includes("odpocinek") ||
    norm.includes("odpočinek")
  ) {
    return {
      status: isRegenerationWeekday ? "regeneration" : "rest",
      reason,
    };
  }

  if (norm.includes("otuz") || norm.includes("meditac")) {
    return { status: "regeneration", reason };
  }

  return { status: "training", reason };
}

/** Mapuje vygenerovaný plán na záznamy kalendáře (Po–Ne od weekStart). */
export function applyWeeklyPlanToCalendar(
  markdown: string,
  weekStartMonday: string,
  regenerationWeekday: number,
): Record<string, IronManCalendarDay> {
  const updates: Record<string, IronManCalendarDay> = {};

  for (let i = 0; i < 7; i++) {
    const dateKey = addDaysToDateKey(weekStartMonday, i);
    const dow = new Date(`${dateKey}T12:00:00`).getDay();
    const line = findDayLine(markdown, i);
    if (!line) continue;
    updates[dateKey] = classifyDayLine(line, dow === regenerationWeekday);
  }

  return updates;
}
