import { addDaysToDateKey } from "@/lib/iron-man-2030/coach-data";
import type { IronManCoachPlanDay, IronManCoachPlanDayKind } from "@/lib/iron-man-2030/types";

export const PLAN_DAY_LABELS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"] as const;

const WEEK_DAYS: { names: string[] }[] = [
  { names: ["pondělí", "pondeli"] },
  { names: ["úterý", "utery", "úter", "uter"] },
  { names: ["středa", "streda"] },
  { names: ["čtvrtek", "ctvrtek"] },
  { names: ["pátek", "patek"] },
  { names: ["sobota"] },
  { names: ["neděle", "nedele"] },
];

export function normalizePlanText(line: string): string {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function findDayLine(markdown: string, dayIndex: number): string | null {
  const names = WEEK_DAYS[dayIndex].names;
  const lines = markdown.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const norm = normalizePlanText(line);
    for (const name of names) {
      const n = normalizePlanText(name);
      if (norm.startsWith(`${n}:`) || norm.startsWith(`${n} `) || norm === n) {
        return line;
      }
    }
  }
  return null;
}

export function stripDayPrefix(line: string): string {
  const trimmed = line.trim();
  for (const names of WEEK_DAYS) {
    for (const name of names.names) {
      const re = new RegExp(`^${name}\\s*:\\s*`, "i");
      if (re.test(trimmed)) return trimmed.replace(re, "").trim();
    }
  }
  return trimmed;
}

export function classifyLineKind(content: string): IronManCoachPlanDayKind {
  const norm = normalizePlanText(content);
  if (
    norm.includes("volno") ||
    norm.includes("regenerace") ||
    norm.includes("odpocinek") ||
    norm.includes("odpočinek") ||
    norm.includes("rest")
  ) {
    return "rest";
  }
  if (norm.includes("otuz") || norm.includes("meditac")) {
    return "regeneration";
  }
  return "training";
}

export function formatDayLine(dayLabel: string, content: string): string {
  const body = stripDayPrefix(content);
  return `${dayLabel}: ${body}`;
}

export function parsePlanDays(markdown: string, weekStart: string): IronManCoachPlanDay[] {
  return PLAN_DAY_LABELS.map((dayLabel, index) => {
    const date = addDaysToDateKey(weekStart, index);
    const line = findDayLine(markdown, index) ?? `${dayLabel}: —`;
    const content = stripDayPrefix(line);
    return {
      date,
      dayLabel,
      line: formatDayLine(dayLabel, content),
      kind: classifyLineKind(content),
    };
  });
}

export function rebuildMarkdownFromDays(days: IronManCoachPlanDay[]): string {
  return days.map((d) => d.line).join("\n\n");
}

export function swapPlanDays(days: IronManCoachPlanDay[], indexA: number, indexB: number): IronManCoachPlanDay[] {
  if (indexA === indexB) return days;
  const next = days.map((d) => ({ ...d }));
  const contentA = stripDayPrefix(next[indexA].line);
  const contentB = stripDayPrefix(next[indexB].line);
  next[indexA] = {
    ...next[indexA],
    line: formatDayLine(next[indexA].dayLabel, contentB),
    kind: classifyLineKind(contentB),
  };
  next[indexB] = {
    ...next[indexB],
    line: formatDayLine(next[indexB].dayLabel, contentA),
    kind: classifyLineKind(contentA),
  };
  return next;
}

export function updatePlanDay(days: IronManCoachPlanDay[], index: number, content: string): IronManCoachPlanDay[] {
  const next = days.map((d) => ({ ...d }));
  const body = stripDayPrefix(content);
  next[index] = {
    ...next[index],
    line: formatDayLine(next[index].dayLabel, body),
    kind: classifyLineKind(body),
  };
  return next;
}
