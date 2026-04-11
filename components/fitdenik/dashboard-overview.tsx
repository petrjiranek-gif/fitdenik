"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDashboardSummaryFromProvider,
  getRepositories,
} from "@/lib/repositories/provider";

export function DashboardOverviewCards() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const baseline = useMemo(
    () => repositories.baseline.get() ?? repositories.baseline.getDefaults(),
    [repositories],
  );
  const fallbackSummary = useMemo(() => getDashboardSummaryFromProvider(), []);
  const [remoteSummary, setRemoteSummary] = useState<{
    weeklyTrainingCount: number;
    weeklyMinutes: number;
    weeklyCalories: number;
    avgProtein: number;
    latestBenchmarkLabel: string;
  } | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!useSupabase) return;

    void fetch("/api/dashboard-summary")
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setSummaryError(result.error ?? "Nepodařilo se načíst souhrn dashboardu.");
          return;
        }
        const result = (await response.json()) as {
          weeklyTrainingCount: number;
          weeklyMinutes: number;
          weeklyCalories: number;
          avgProtein: number;
          latestBenchmarkLabel: string;
        };
        setRemoteSummary(result);
        setSummaryError(null);
      })
      .catch(() => {
        setSummaryError("Nepodařilo se načíst souhrn dashboardu.");
      });
  }, [useSupabase]);

  const summary = useSupabase
    ? remoteSummary ?? {
        ...fallbackSummary,
        latestBenchmarkLabel: "Načítám...",
      }
    : {
        ...fallbackSummary,
        latestBenchmarkLabel: "Lokální data",
      };

  return (
    <div className="space-y-3">
      {summaryError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {summaryError}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <Card label="Aktuální váha" value={`${baseline.baselineWeightKg} kg`} />
        <Card label="Tréninky tento týden" value={`${summary.weeklyTrainingCount}`} />
        <Card label="Aktivní čas" value={`${summary.weeklyMinutes} min`} />
        <Card label="Týdenní kalorie" value={`${summary.weeklyCalories} kcal`} />
        <Card label="Průměr bílkovin" value={`${summary.avgProtein} g`} />
        <Card label="Poslední benchmark" value={summary.latestBenchmarkLabel} />
        <Card label="Baseline tep" value={`${baseline.restingHeartRate} bpm`} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
