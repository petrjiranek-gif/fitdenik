import { addDaysToDateKey } from "@/lib/iron-man-2030/coach-data";
import type { IronManCoachPlanDay, IronManCoachPlanDayKind } from "@/lib/iron-man-2030/types";

export const PLAN_DAY_LABELS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"] as const;

const WEEK_DAYS: { names: string[] }[] = [
  { names: ["pondělí", "pondeli", "po"] },
  { names: ["úterý", "utery", "úter", "uter", "ut"] },
  { names: ["středa", "streda", "st"] },
  { names: ["čtvrtek", "ctvrtek", "ct"] },
  { names: ["pátek", "patek", "pa"] },
  { names: ["sobota", "so"] },
  { names: ["neděle", "nedele", "ne"] },
];

const SUMMARY_MARKERS = ["shrnutí", "shrnuti", "upozornění", "upozorneni", "tip pro tento týden", "tip pro tento tyden"];

export function normalizePlanText(line: string): string {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Odstraní markdown dekorace (#, *, odrážky). */
export function stripMarkdownDecorations(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^\s*[-*•]\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

function isSummarySection(line: string): boolean {
  const norm = normalizePlanText(stripMarkdownDecorations(line));
  return SUMMARY_MARKERS.some((m) => norm.startsWith(m) || norm.startsWith(`**${m}`));
}

function lineMatchesDay(norm: string, name: string): boolean {
  const n = normalizePlanText(name);
  return (
    norm === n ||
    norm.startsWith(`${n}:`) ||
    norm.startsWith(`${n} `) ||
    norm.startsWith(`${n}-`) ||
    norm.startsWith(`${n}—`) ||
    norm.startsWith(`${n}–`)
  );
}

function detectDayIndex(line: string): number | null {
  const cleaned = stripMarkdownDecorations(line);
  const norm = normalizePlanText(cleaned);
  if (!norm || isSummarySection(line)) return null;
  for (let d = 0; d < WEEK_DAYS.length; d++) {
    for (const name of WEEK_DAYS[d].names) {
      if (lineMatchesDay(norm, name)) return d;
    }
  }
  return null;
}

function isPlaceholderContent(content: string): boolean {
  const t = content.trim();
  return t === "" || t === "—" || t === "-" || t === "–";
}

/** Rozdělí markdown na 7 bloků podle nadpisů dnů (podporuje víceřádkový formát Clauda). */
export function splitMarkdownByDays(markdown: string): (string | null)[] {
  const blocks: (string | null)[] = Array.from({ length: 7 }, () => null);
  const lines = markdown.split("\n");

  let currentDay: number | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentDay == null || buffer.length === 0) return;
    const text = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (!isPlaceholderContent(text)) {
      blocks[currentDay] = blocks[currentDay] ? `${blocks[currentDay]} ${text}` : text;
    }
    buffer = [];
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (isSummarySection(trimmed)) {
      flush();
      currentDay = null;
      continue;
    }

    const dayIdx = detectDayIndex(trimmed);
    if (dayIdx != null) {
      flush();
      currentDay = dayIdx;
      const header = stripMarkdownDecorations(trimmed);
      const afterColon = stripDayPrefix(header);
      if (!isPlaceholderContent(afterColon)) {
        buffer.push(afterColon);
      }
      continue;
    }

    if (currentDay != null) {
      const part = stripMarkdownDecorations(trimmed).replace(/^\*|\*$/g, "").trim();
      if (part) buffer.push(part);
    }
  }

  flush();
  return blocks;
}

export function findDayLine(markdown: string, dayIndex: number): string | null {
  const block = splitMarkdownByDays(markdown)[dayIndex];
  if (block) return formatDayLine(PLAN_DAY_LABELS[dayIndex], block);

  const names = WEEK_DAYS[dayIndex].names;
  const lines = markdown.split("\n");
  for (const raw of lines) {
    const line = stripMarkdownDecorations(raw.trim());
    if (!line) continue;
    const norm = normalizePlanText(line);
    for (const name of names) {
      if (lineMatchesDay(norm, name)) return line;
    }
  }
  return null;
}

export function stripDayPrefix(line: string): string {
  const trimmed = stripMarkdownDecorations(line);
  for (const names of WEEK_DAYS) {
    for (const name of names.names) {
      const re = new RegExp(`^${name}\\s*[:\\-–—]?\\s*`, "i");
      if (re.test(normalizePlanText(trimmed))) {
        return trimmed.replace(new RegExp(`^${name}\\s*[:\\-–—]?\\s*`, "i"), "").trim();
      }
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
  const blocks = splitMarkdownByDays(markdown);
  return PLAN_DAY_LABELS.map((dayLabel, index) => {
    const date = addDaysToDateKey(weekStart, index);
    const block = blocks[index];
    const content = block ?? "";
    const line = !isPlaceholderContent(content) ? formatDayLine(dayLabel, content) : `${dayLabel}: —`;
    return {
      date,
      dayLabel,
      line,
      kind: classifyLineKind(content || line),
    };
  });
}

export function planDaysLookEmpty(days: IronManCoachPlanDay[] | undefined | null): boolean {
  if (!days?.length) return true;
  return days.every((d) => isPlaceholderContent(stripDayPrefix(d.line)));
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
