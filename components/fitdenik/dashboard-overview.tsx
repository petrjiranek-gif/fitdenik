"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDashboardSummaryFromProvider,
  getRepositories,
} from "@/lib/repositories/provider";
import type { DashboardSummaryResponse } from "@/app/api/dashboard-summary/route";
import type { BaselineInput } from "@/lib/repositories/contracts";
import type { BodyMeasurementEntry, NutritionEntry } from "@/lib/types";
import { WeightSparkline } from "@/components/fitdenik/weight-sparkline";

function todayPrague(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Prague" });
}

function datePragueFromIso(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Prague" });
}

/** Nejnovější váha z API souhrnu, lokálních měření i výživy (hybrid Supabase + localStorage). */
function pickNewestBodyWeight(
  summary: DashboardSummaryResponse,
  measurements: BodyMeasurementEntry[],
  nutrition: NutritionEntry[],
): { kg: number | null; date: string | null } {
  const mSorted = [...measurements]
    .filter((m) => m.weightKg > 0)
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
  const mLatest = mSorted[0];
  const nSorted = [...nutrition]
    .filter((n) => n.bodyWeightKg > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const nLatest = nSorted[0];

  type Cand = { t: number; kg: number; dateStr: string };
  const cands: Cand[] = [];
  if (summary.latestBodyWeightKg != null && summary.latestWeightDate) {
    cands.push({
      t: new Date(`${summary.latestWeightDate}T12:00:00`).getTime(),
      kg: summary.latestBodyWeightKg,
      dateStr: summary.latestWeightDate,
    });
  }
  if (mLatest) {
    cands.push({
      t: new Date(mLatest.measuredAt).getTime(),
      kg: mLatest.weightKg,
      dateStr: datePragueFromIso(mLatest.measuredAt),
    });
  }
  if (nLatest) {
    cands.push({
      t: new Date(`${nLatest.date}T12:00:00`).getTime(),
      kg: nLatest.bodyWeightKg,
      dateStr: nLatest.date,
    });
  }
  if (cands.length === 0) return { kg: null, date: null };
  cands.sort((a, b) => b.t - a.t);
  return { kg: cands[0].kg, date: cands[0].dateStr };
}

function StatusPill({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
        ok
          ? "border-ew-accent/40 bg-ew-accent/10 text-ew-accent"
          : "border-ew-border bg-ew-panel text-ew-muted"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-base font-bold ${
          ok ? "bg-ew-accent text-ew-bg" : "bg-ew-border text-zinc-500"
        }`}
        aria-hidden
      >
        {ok ? "✓" : "·"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function DashboardOverviewCards() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [remoteBaseline, setRemoteBaseline] = useState<BaselineInput | null>(null);
  const [remoteMeasurements, setRemoteMeasurements] = useState<BodyMeasurementEntry[] | null>(null);
  const [remoteNutrition, setRemoteNutrition] = useState<NutritionEntry[] | null>(null);

  const baseline = useMemo(() => {
    if (useSupabase) {
      return remoteBaseline ?? repositories.baseline.getDefaults();
    }
    return repositories.baseline.get() ?? repositories.baseline.getDefaults();
  }, [useSupabase, remoteBaseline, repositories]);

  const fallbackSummary = useMemo(() => getDashboardSummaryFromProvider(), []);
  const [remote, setRemote] = useState<DashboardSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!useSupabase) return;
    void Promise.all([
      fetch("/api/baseline").then((r) => r.json()),
      fetch("/api/body-measurements").then((r) => r.json()),
      fetch("/api/nutrition").then((r) => r.json()),
    ])
      .then(([b, m, n]) => {
        setRemoteBaseline((b as { baseline: BaselineInput }).baseline);
        setRemoteMeasurements((m as { entries: BodyMeasurementEntry[] }).entries);
        setRemoteNutrition((n as { entries: NutritionEntry[] }).entries);
      })
      .catch(() => {});
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase) return;

    void fetch("/api/dashboard-summary")
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setSummaryError(result.error ?? "Nepodařilo se načíst souhrn dashboardu.");
          return;
        }
        const result = (await response.json()) as DashboardSummaryResponse;
        setRemote(result);
        setSummaryError(null);
      })
      .catch(() => {
        setSummaryError("Nepodařilo se načíst souhrn dashboardu.");
      });
  }, [useSupabase]);

  const localExtra = useMemo(() => {
    if (useSupabase) return null;
    const today = todayPrague();
    const sessions = [...repositories.training.list()].sort((a, b) => (a.date < b.date ? 1 : -1));
    const nutrition = [...repositories.nutrition.list()].sort((a, b) => (a.date < b.date ? 1 : -1));
    const withWeight = nutrition.filter((n) => n.bodyWeightKg > 0);
    const nLatest = withWeight[0];
    const measurements = [...repositories.bodyMeasurements.list()].sort((a, b) =>
      b.measuredAt.localeCompare(a.measuredAt),
    );
    const mLatest = measurements[0];

    let latestBodyWeightKg: number | null = null;
    let latestWeightDate: string | null = null;
    if (mLatest && nLatest) {
      const mt = new Date(mLatest.measuredAt).getTime();
      const nt = new Date(`${nLatest.date}T12:00:00`).getTime();
      if (mt >= nt) {
        latestBodyWeightKg = mLatest.weightKg;
        latestWeightDate = datePragueFromIso(mLatest.measuredAt);
      } else {
        latestBodyWeightKg = nLatest.bodyWeightKg;
        latestWeightDate = nLatest.date;
      }
    } else if (mLatest) {
      latestBodyWeightKg = mLatest.weightKg;
      latestWeightDate = datePragueFromIso(mLatest.measuredAt);
    } else if (nLatest) {
      latestBodyWeightKg = nLatest.bodyWeightKg;
      latestWeightDate = nLatest.date;
    }

    const loggedMeasurementToday = measurements.some((m) => datePragueFromIso(m.measuredAt) === today);
    const loggedWeightFromNutrition = nutrition.some((n) => n.date === today && n.bodyWeightKg > 0);

    const benchmarks = [...repositories.benchmarks.list()].sort((a, b) => (a.date < b.date ? 1 : -1));
    const latestBm = benchmarks[0];
    return {
      latestBodyWeightKg,
      latestWeightDate,
      measurementEntries: measurements,
      loggedTrainingToday: sessions.some((s) => s.date === today),
      loggedNutritionToday: nutrition.some((n) => n.date === today),
      loggedWeightToday: loggedWeightFromNutrition || loggedMeasurementToday,
      recentTrainings: sessions.slice(0, 8).map((s) => ({
        date: s.date,
        title: s.title,
        sport_type: s.sportType,
        duration_min: s.durationMin,
      })),
      latestBenchmarkLabel: latestBm
        ? `${latestBm.benchmarkName} ${latestBm.resultValue}`
        : "Bez benchmarku",
    };
  }, [repositories, useSupabase]);

  const measurementList = useMemo(() => {
    if (useSupabase) return remoteMeasurements ?? [];
    return repositories.bodyMeasurements.list();
  }, [useSupabase, remoteMeasurements, repositories]);

  const nutritionList = useMemo(() => {
    if (useSupabase) return remoteNutrition ?? [];
    return repositories.nutrition.list();
  }, [useSupabase, remoteNutrition, repositories]);

  const summary: DashboardSummaryResponse = useSupabase
    ? remote ?? {
        weeklyTrainingCount: fallbackSummary.weeklyTrainingCount,
        weeklyMinutes: fallbackSummary.weeklyMinutes,
        weeklyCalories: fallbackSummary.weeklyCalories,
        avgProtein: fallbackSummary.avgProtein,
        latestBenchmarkLabel: "Načítám…",
        latestBodyWeightKg: null,
        latestWeightDate: null,
        loggedTrainingToday: false,
        loggedNutritionToday: false,
        loggedWeightToday: false,
        recentTrainings: [],
      }
    : {
        ...fallbackSummary,
        latestBenchmarkLabel: localExtra?.latestBenchmarkLabel ?? "Bez benchmarku",
        latestBodyWeightKg: localExtra?.latestBodyWeightKg ?? null,
        latestWeightDate: localExtra?.latestWeightDate ?? null,
        loggedTrainingToday: localExtra?.loggedTrainingToday ?? false,
        loggedNutritionToday: localExtra?.loggedNutritionToday ?? false,
        loggedWeightToday: localExtra?.loggedWeightToday ?? false,
        recentTrainings: localExtra?.recentTrainings ?? [],
      };

  const displaySummary = useMemo(() => {
    const picked = pickNewestBodyWeight(summary, measurementList, nutritionList);
    const today = todayPrague();
    const loggedMeasurementToday = measurementList.some((m) => datePragueFromIso(m.measuredAt) === today);
    const loggedNutritionWeightToday = nutritionList.some((n) => n.date === today && n.bodyWeightKg > 0);
    return {
      ...summary,
      latestBodyWeightKg: picked.kg,
      latestWeightDate: picked.date,
      loggedWeightToday: summary.loggedWeightToday || loggedMeasurementToday || loggedNutritionWeightToday,
    };
  }, [summary, measurementList, nutritionList]);

  const weightDelta =
    displaySummary.latestBodyWeightKg != null && baseline.baselineWeightKg > 0
      ? displaySummary.latestBodyWeightKg - baseline.baselineWeightKg
      : null;

  const weightDeltaLabel =
    weightDelta == null
      ? "—"
      : weightDelta <= 0
        ? `${weightDelta.toFixed(1)} kg`
        : `+${weightDelta.toFixed(1)} kg`;

  const weightDeltaHint =
    weightDelta == null
      ? "Doplň váhu v měření, výživě nebo Baseline."
      : weightDelta < 0
        ? "Pod baseline (váha)."
        : weightDelta === 0
          ? "Na baseline."
          : "Nad baseline.";

  const measurementEntriesForChart = measurementList;

  return (
    <div className="space-y-6">
      {summaryError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">
          {summaryError}
        </div>
      )}

      <section aria-label="Stav dne">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ew-muted">Dnes · přehled plnění</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <StatusPill ok={summary.loggedTrainingToday} label="Trénink zapsán" />
          <StatusPill ok={summary.loggedNutritionToday} label="Jídelníček / výživa" />
          <StatusPill ok={displaySummary.loggedWeightToday} label="Váha zapsána (měření / výživa)" />
        </div>
      </section>

      <section aria-label="Klíčové metriky">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ew-muted">7 dní · souhrn</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="Váha vs. baseline"
            value={displaySummary.latestBodyWeightKg != null ? `${displaySummary.latestBodyWeightKg} kg` : "—"}
            sub={weightDeltaLabel}
            hint={weightDeltaHint}
            accent={weightDelta != null && weightDelta < 0 ? "positive" : weightDelta != null && weightDelta > 0 ? "warn" : "neutral"}
          />
          <Card label="Baseline (profil)" value={`${baseline.baselineWeightKg} kg`} hint="Výchozí váha v Baseline." />
          <Card label="Baseline tep" value={`${baseline.restingHeartRate} bpm`} hint="Klidový tep z profilu." />
          <Card
            label="Poslední benchmark"
            value={summary.latestBenchmarkLabel}
            hint="Nejnovější záznam v DB."
          />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card label="Tréninky (7 dní)" value={`${summary.weeklyTrainingCount}`} hint="Počet záznamů." />
          <Card label="Aktivní čas" value={`${summary.weeklyMinutes} min`} hint="Součet délky." />
          <Card label="Kalorie (trénink)" value={`${summary.weeklyCalories} kcal`} hint="Z tréninků za 7 dní." />
          <Card label="Průměr bílkovin" value={`${summary.avgProtein} g`} hint="Z výživy za 7 dní." />
        </div>
      </section>

      <section aria-label="Vývoj váhy">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ew-muted">Měření těla · váha v čase</h3>
        <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <WeightSparkline entries={measurementEntriesForChart} />
          <p className="mt-2 text-xs text-ew-muted">
            {useSupabase
              ? "Graf z měření v Supabase (stejná data na všech zařízeních). Karta „Váha vs. baseline“ bere nejnovější váhu z měření, výživy nebo souhrnu serveru."
              : "Graf z lokálních záznamů „Nové měření“ (prohlížeč). Karta „Váha vs. baseline“ výše bere nejnovější hodnotu z měření, výživy nebo serveru — podle data a času."}
          </p>
        </div>
      </section>

      <section aria-label="Poslední tréninky">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ew-muted">Poslední tréninky</h3>
        <div className="overflow-hidden rounded-xl border border-ew-border bg-ew-panel">
          <table className="w-full text-sm">
            <thead className="bg-ew-bg text-left text-xs text-ew-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Datum</th>
                <th className="px-3 py-2 font-medium">Název</th>
                <th className="px-3 py-2 font-medium">Sport</th>
                <th className="px-3 py-2 font-medium">Čas</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentTrainings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-ew-muted">
                    Zatím žádné tréninky v databázi.
                  </td>
                </tr>
              ) : (
                summary.recentTrainings.map((row, i) => (
                  <tr key={`${row.date}-${row.title}-${i}`} className="border-t border-ew-border text-zinc-300">
                    <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                    <td className="px-3 py-2">{row.title}</td>
                    <td className="px-3 py-2">{row.sport_type}</td>
                    <td className="px-3 py-2">{row.duration_min} min</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  hint,
  accent = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  hint?: string;
  accent?: "positive" | "warn" | "neutral";
}) {
  const subColor =
    accent === "positive"
      ? "text-ew-accent"
      : accent === "warn"
        ? "text-amber-400"
        : "text-ew-muted";
  return (
    <div className="rounded-xl border border-ew-border bg-ew-panel p-4 shadow-sm">
      <p className="text-xs text-ew-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
      {sub != null && sub !== "—" && <p className={`mt-0.5 text-sm font-medium ${subColor}`}>{sub}</p>}
      {hint && <p className="mt-1 text-xs text-ew-muted">{hint}</p>}
    </div>
  );
}
