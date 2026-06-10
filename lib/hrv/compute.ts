import type { HrvEntry } from "@/lib/types";

export type HrvTrendLabel = "stabilní" | "klesající" | "rostoucí" | "nedostatek_dat";

export type HrvDailyPoint = { date: string; hrvMs: number };

export type HrvTrendResult = {
  label: HrvTrendLabel;
  /** Pro AI trenéra — kapitalizovaný popis dle dokumentu. */
  coachLabel: string;
  daysInWindow: number;
  latestMs: number | null;
  latestDate: string | null;
  daily: HrvDailyPoint[];
  avg7d: number | null;
};

const COACH_LABELS: Record<HrvTrendLabel, string> = {
  stabilní: "Stabilní",
  klesající: "Klesající",
  rostoucí: "Rostoucí",
  nedostatek_dat: "Nedostatek dat",
};

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Jedna hodnota na kalendářní den — průměr při více záznamech. */
export function aggregateHrvByDay(entries: HrvEntry[]): HrvDailyPoint[] {
  const byDay = new Map<string, number[]>();
  for (const e of entries) {
    if (e.hrvMs <= 0) continue;
    const key = dateKey(e.recordedAt);
    const list = byDay.get(key) ?? [];
    list.push(e.hrvMs);
    byDay.set(key, list);
  }
  return [...byDay.entries()]
    .map(([date, values]) => ({
      date,
      hrvMs: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function computeHrvTrend(entries: HrvEntry[], now = new Date(), windowDays = 7): HrvTrendResult {
  const end = startOfDay(now);
  const start = new Date(end);
  start.setDate(start.getDate() - (windowDays - 1));
  const startKey = dateKey(start.toISOString());

  const dailyAll = aggregateHrvByDay(entries);
  const daily = dailyAll.filter((d) => d.date >= startKey && d.date <= dateKey(end.toISOString()));

  const latest = dailyAll[dailyAll.length - 1] ?? null;
  const avg7d =
    daily.length > 0 ? Math.round(daily.reduce((a, d) => a + d.hrvMs, 0) / daily.length) : null;

  if (daily.length < 3) {
    return {
      label: "nedostatek_dat",
      coachLabel: COACH_LABELS.nedostatek_dat,
      daysInWindow: daily.length,
      latestMs: latest?.hrvMs ?? null,
      latestDate: latest?.date ?? null,
      daily,
      avg7d,
    };
  }

  const firstHalf = daily.slice(0, Math.ceil(daily.length / 2));
  const secondHalf = daily.slice(Math.ceil(daily.length / 2));
  const meanFirst = firstHalf.reduce((a, d) => a + d.hrvMs, 0) / firstHalf.length;
  const meanSecond = secondHalf.reduce((a, d) => a + d.hrvMs, 0) / secondHalf.length;
  const meanAll = (meanFirst + meanSecond) / 2;
  const deltaPct = meanAll > 0 ? ((meanSecond - meanFirst) / meanAll) * 100 : 0;

  let label: HrvTrendLabel = "stabilní";
  if (deltaPct <= -5) label = "klesající";
  else if (deltaPct >= 5) label = "rostoucí";

  return {
    label,
    coachLabel: COACH_LABELS[label],
    daysInWindow: daily.length,
    latestMs: latest?.hrvMs ?? null,
    latestDate: latest?.date ?? null,
    daily,
    avg7d,
  };
}

export function formatHrvTrendForCoach(trend: HrvTrendResult): string {
  if (trend.label === "nedostatek_dat") {
    return `Nedostatek dat (${trend.daysInWindow}/7 dní v okně)`;
  }
  const parts = [trend.coachLabel];
  if (trend.avg7d != null) parts.push(`průměr 7 dní ${trend.avg7d} ms`);
  if (trend.latestMs != null && trend.latestDate) {
    parts.push(`poslední ${trend.latestMs} ms (${trend.latestDate})`);
  }
  return parts.join(" · ");
}
