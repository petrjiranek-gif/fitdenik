"use client";

import { useEffect, useMemo, useState } from "react";
import { formInputClass } from "@/components/fitdenik/form-fields";
import { CROSSFIT_MASTERS_WORKOUTS, type MastersWorkoutDef } from "@/lib/benchmarks/masters-crossfit";
import { getRepositories } from "@/lib/repositories/provider";
import type { BenchmarkResult, TrainingSession } from "@/lib/types";

type CrossfitMastersDivision = "35-39" | "40-44" | "45-49" | "50-54" | "55-59" | "60+";

const CROSSFIT_MASTERS_DIVISIONS: CrossfitMastersDivision[] = ["35-39", "40-44", "45-49", "50-54", "55-59", "60+"];

const CROSSFIT_MASTERS_REFERENCE: Record<
  CrossfitMastersDivision,
  { sessionsPerWeekMin: number; kcalPerMinMin: number; kcalPerMinGood: number }
> = {
  "35-39": { sessionsPerWeekMin: 4, kcalPerMinMin: 8.5, kcalPerMinGood: 10.5 },
  "40-44": { sessionsPerWeekMin: 4, kcalPerMinMin: 8.0, kcalPerMinGood: 10.0 },
  "45-49": { sessionsPerWeekMin: 3, kcalPerMinMin: 7.5, kcalPerMinGood: 9.5 },
  "50-54": { sessionsPerWeekMin: 3, kcalPerMinMin: 7.0, kcalPerMinGood: 9.0 },
  "55-59": { sessionsPerWeekMin: 3, kcalPerMinMin: 6.5, kcalPerMinGood: 8.5 },
  "60+": { sessionsPerWeekMin: 2, kcalPerMinMin: 6.0, kcalPerMinGood: 8.0 },
};

function divisionFromAge(age: number): CrossfitMastersDivision {
  if (age >= 60) return "60+";
  if (age >= 55) return "55-59";
  if (age >= 50) return "50-54";
  if (age >= 45) return "45-49";
  if (age >= 40) return "40-44";
  return "35-39";
}

function parseTimeToSec(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const parts = raw.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
  if (parts.length === 1) return Number(parts[0]);
  if (parts.length === 2) return Number(parts[0]) * 60 + Number(parts[1]);
  if (parts.length === 3) return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  return null;
}

function parseLoad(value: string): number | null {
  const m = value.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function resultComparableValue(result: BenchmarkResult, def: MastersWorkoutDef): number | null {
  return def.scoreMode === "for_time" ? parseTimeToSec(result.resultValue) : parseLoad(result.resultValue);
}

function compareResult(def: MastersWorkoutDef, a: number, b: number): number {
  return def.scoreMode === "for_time" ? a - b : b - a;
}

function fmtComparable(def: MastersWorkoutDef, value: number): string {
  if (def.scoreMode === "for_time") {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return `${value.toFixed(1)} kg`;
}

function resultDeltaLabel(def: MastersWorkoutDef, delta: number): string {
  const abs = Math.abs(delta);
  return def.scoreMode === "for_time" ? `${abs.toFixed(0)} s` : `${abs.toFixed(1)} kg`;
}

function deltaBadgeClass(direction: "better" | "worse" | "equal"): string {
  if (direction === "better") return "border-emerald-500/40 bg-emerald-950/30 text-emerald-200";
  if (direction === "worse") return "border-rose-500/40 bg-rose-950/30 text-rose-200";
  return "border-zinc-600/40 bg-zinc-800/30 text-zinc-300";
}

function mastersStatusClass(status: "below" | "ok" | "good"): string {
  if (status === "good") return "text-emerald-300";
  if (status === "ok") return "text-amber-300";
  return "text-rose-300";
}

function mastersStatusLabel(status: "below" | "ok" | "good"): string {
  if (status === "good") return "Nad cílem";
  if (status === "ok") return "V cíli";
  return "Pod cílem";
}

function addDays(d: Date, delta: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + delta);
  return out;
}

function kcalPerMin(s: TrainingSession): number {
  if (s.durationMin <= 0) return 0;
  return s.calories / s.durationMin;
}

export function CrossfitMastersPanel() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [mastersDivision, setMastersDivision] = useState<CrossfitMastersDivision>("45-49");
  const [mastersWorkoutId, setMastersWorkoutId] = useState(CROSSFIT_MASTERS_WORKOUTS[0].id);
  const [mastersDate, setMastersDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mastersResultValue, setMastersResultValue] = useState("");
  const [mastersScaling, setMastersScaling] = useState("");
  const [mastersNotes, setMastersNotes] = useState("");
  const [mastersSaving, setMastersSaving] = useState(false);
  const [mastersError, setMastersError] = useState<string | null>(null);
  const [mastersResults, setMastersResults] = useState<BenchmarkResult[]>(() =>
    useSupabase ? [] : repositories.benchmarks.list(),
  );
  const [sessions, setSessions] = useState<TrainingSession[]>(() => (useSupabase ? [] : repositories.training.list()));

  useEffect(() => {
    let mounted = true;
    void fetch("/api/baseline", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { baseline?: { age?: number } };
        const age = Number(data.baseline?.age ?? 0);
        if (!mounted || !Number.isFinite(age) || age <= 0) return;
        setMastersDivision(divisionFromAge(age));
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!useSupabase) return;
    let mounted = true;
    void fetch("/api/benchmarks", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          if (mounted) setMastersError(result.error ?? "Nepodařilo se načíst Masters benchmark historii.");
          return;
        }
        const result = (await response.json()) as { results: BenchmarkResult[] };
        if (mounted) setMastersResults(result.results);
      })
      .catch(() => {
        if (mounted) setMastersError("Nepodařilo se načíst Masters benchmark historii.");
      });
    void fetch("/api/training", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok || !mounted) return;
        const j = (await res.json()) as { sessions: TrainingSession[] };
        setSessions(j.sessions);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [useSupabase]);

  const mastersStats = useMemo(() => {
    const ref = CROSSFIT_MASTERS_REFERENCE[mastersDivision];
    const since = addDays(new Date(), -30);
    const crossfit30d = sessions.filter((s) => s.sportType === "CrossFit" && new Date(`${s.date}T00:00:00`) >= since);
    const totalMin = crossfit30d.reduce((sum, s) => sum + s.durationMin, 0);
    const sessionCount = crossfit30d.length;
    const weeklyRate = sessionCount / (30 / 7);
    const withEff = crossfit30d.filter((s) => s.durationMin > 0 && s.calories > 0);
    const avgKpm = withEff.length > 0 ? withEff.reduce((sum, s) => sum + kcalPerMin(s), 0) / withEff.length : 0;
    const bestKpm = withEff.length > 0 ? Math.max(...withEff.map((s) => kcalPerMin(s))) : 0;
    const sessionsStatus: "below" | "ok" | "good" =
      weeklyRate >= ref.sessionsPerWeekMin + 1 ? "good" : weeklyRate >= ref.sessionsPerWeekMin ? "ok" : "below";
    const intensityStatus: "below" | "ok" | "good" =
      avgKpm >= ref.kcalPerMinGood ? "good" : avgKpm >= ref.kcalPerMinMin ? "ok" : "below";
    return { ref, totalMin, sessionCount, weeklyRate, avgKpm, bestKpm, sessionsStatus, intensityStatus };
  }, [mastersDivision, sessions]);

  const selectedMastersWorkout = useMemo(
    () => CROSSFIT_MASTERS_WORKOUTS.find((x) => x.id === mastersWorkoutId) ?? CROSSFIT_MASTERS_WORKOUTS[0],
    [mastersWorkoutId],
  );

  const mastersHistory = useMemo(() => {
    const list = mastersResults
      .filter((r) => r.benchmarkName === selectedMastersWorkout.name)
      .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());
    const withComparable = list
      .map((r) => ({ r, comp: resultComparableValue(r, selectedMastersWorkout) }))
      .filter((x) => x.comp != null) as Array<{ r: BenchmarkResult; comp: number }>;
    let best: { r: BenchmarkResult; comp: number } | null = null;
    for (const row of withComparable) {
      if (!best || compareResult(selectedMastersWorkout, row.comp, best.comp) < 0) best = row;
    }
    const trendAsc = [...withComparable]
      .sort((a, b) => new Date(`${a.r.date}T00:00:00`).getTime() - new Date(`${b.r.date}T00:00:00`).getTime())
      .slice(-12);
    const min = trendAsc.length > 0 ? Math.min(...trendAsc.map((x) => x.comp)) : 0;
    const max = trendAsc.length > 0 ? Math.max(...trendAsc.map((x) => x.comp)) : 0;
    const span = max - min || 1;
    const toY = (v: number) =>
      selectedMastersWorkout.scoreMode === "for_time" ? 6 + ((v - min) / span) * 58 : 6 + ((max - v) / span) * 58;
    const trendPoints = trendAsc.map((x, i) => {
      const xPos = trendAsc.length <= 1 ? 10 : 10 + (i / (trendAsc.length - 1)) * 280;
      return { x: xPos, y: toY(x.comp), row: x };
    });
    const recentDelta =
      withComparable.length >= 2 ? compareResult(selectedMastersWorkout, withComparable[0].comp, withComparable[1].comp) : null;
    return { all: list, best, trendPoints, recentDelta };
  }, [mastersResults, selectedMastersWorkout]);

  const currentPreview = useMemo(() => {
    const comp = selectedMastersWorkout.scoreMode === "for_time" ? parseTimeToSec(mastersResultValue) : parseLoad(mastersResultValue);
    if (comp == null) return null;
    if (!mastersHistory.best) return { message: "První měřený výsledek — nastavíš si baseline." };
    const delta = compareResult(selectedMastersWorkout, comp, mastersHistory.best.comp);
    if (delta < 0) return { message: `Aktuálně lepší než tvoje PB o ${resultDeltaLabel(selectedMastersWorkout, delta)}.` };
    if (delta > 0) return { message: `Aktuálně za PB o ${resultDeltaLabel(selectedMastersWorkout, delta)}.` };
    return { message: "Aktuálně přesně na osobním maximu." };
  }, [mastersResultValue, selectedMastersWorkout, mastersHistory.best]);

  const saveMastersResult = async () => {
    if (!mastersResultValue.trim()) {
      setMastersError("Vyplň výsledek benchmarku.");
      return;
    }
    setMastersSaving(true);
    setMastersError(null);
    try {
      const input = {
        date: mastersDate,
        benchmarkName: selectedMastersWorkout.name,
        resultType: selectedMastersWorkout.scoreMode === "for_time" ? "čas" : "váha",
        resultValue: mastersResultValue.trim(),
        scaling: mastersScaling.trim(),
        notes: mastersNotes.trim(),
        sourceType: "crossfit" as const,
        sourceName: "CrossFit Masters",
        sourceUrl: "https://games.crossfit.com/",
      };
      if (useSupabase) {
        const response = await fetch("/api/benchmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setMastersError(result.error ?? "Uložení Masters výsledku se nezdařilo.");
          return;
        }
        const result = (await response.json()) as { result: BenchmarkResult };
        setMastersResults((prev) => [result.result, ...prev]);
      } else {
        const created = repositories.benchmarks.create(input);
        setMastersResults((prev) => [created, ...prev]);
      }
      setMastersResultValue("");
      setMastersScaling("");
      setMastersNotes("");
    } finally {
      setMastersSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
      <h3 className="text-base font-semibold text-zinc-100">3. CrossFit Masters — srovnání a benchmarky</h3>
      <p className="mb-3 text-xs text-ew-muted">
        Věkově orientované srovnání + 8 Masters benchmarků s historií, trendem a barevným hodnocením výkonu.
      </p>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <label className="grid gap-1 text-xs text-ew-muted">
          <span>Věková divize</span>
          <select
            value={mastersDivision}
            onChange={(e) => setMastersDivision(e.target.value as CrossfitMastersDivision)}
            className="rounded-md border border-ew-border bg-ew-bg px-2 py-1.5 text-sm text-zinc-200"
          >
            {CROSSFIT_MASTERS_DIVISIONS.map((d) => (
              <option key={d} value={d}>
                Masters {d}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-ew-muted">
          CrossFit / 30 dní: {mastersStats.sessionCount} · ~{mastersStats.weeklyRate.toFixed(1)} týdně ·{" "}
          <span className={mastersStatusClass(mastersStats.sessionsStatus)}>{mastersStatusLabel(mastersStats.sessionsStatus)}</span>
        </p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CROSSFIT_MASTERS_WORKOUTS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setMastersWorkoutId(w.id)}
            className={`rounded-md border px-3 py-2 text-xs ${
              selectedMastersWorkout.id === w.id
                ? "border-ew-blue-light bg-ew-bg text-zinc-100"
                : "border-ew-border text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input type="date" value={mastersDate} onChange={(e) => setMastersDate(e.target.value)} className={formInputClass} />
        <input
          value={mastersResultValue}
          onChange={(e) => setMastersResultValue(e.target.value)}
          placeholder={selectedMastersWorkout.scoreMode === "for_time" ? "Výsledek (mm:ss)" : "Výsledek (kg)"}
          className={formInputClass}
        />
        <input value={mastersScaling} onChange={(e) => setMastersScaling(e.target.value)} placeholder="Scaling / váha" className={formInputClass} />
        <input value={mastersNotes} onChange={(e) => setMastersNotes(e.target.value)} placeholder="Poznámka" className={formInputClass} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void saveMastersResult()}
          disabled={mastersSaving}
          className="rounded-md bg-ew-blue px-4 py-2 text-sm text-white hover:bg-ew-blue-dark disabled:opacity-40"
        >
          {mastersSaving ? "Ukládám…" : "Uložit Masters benchmark"}
        </button>
        {currentPreview && <span className="text-sm text-emerald-300">{currentPreview.message}</span>}
        {mastersError && <span className="text-sm text-rose-300">{mastersError}</span>}
      </div>
      {mastersHistory.trendPoints.length > 1 && (
        <div className="mt-3 rounded-md border border-ew-border bg-ew-bg p-3">
          <svg viewBox="0 0 300 70" className="h-24 w-full rounded bg-ew-panel">
            <polyline
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              points={mastersHistory.trendPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            />
            {mastersHistory.trendPoints.map((p, i) => (
              <circle key={`${p.row.r.id}-${i}`} cx={p.x} cy={p.y} r="2.8" fill={i === mastersHistory.trendPoints.length - 1 ? "#34d399" : "#93c5fd"} />
            ))}
          </svg>
        </div>
      )}
      {mastersHistory.all.length > 0 && (
        <div className="mt-3 max-h-40 overflow-auto rounded-md border border-ew-border bg-ew-bg p-2 text-xs text-zinc-300">
          {mastersHistory.all.slice(0, 8).map((r, idx, arr) => {
            const cur = resultComparableValue(r, selectedMastersWorkout);
            const prev = idx < arr.length - 1 ? resultComparableValue(arr[idx + 1], selectedMastersWorkout) : null;
            const delta = cur != null && prev != null ? compareResult(selectedMastersWorkout, cur, prev) : null;
            const direction = delta == null ? null : delta < 0 ? "better" : delta > 0 ? "worse" : "equal";
            return (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b border-ew-border/70 py-1 last:border-0">
                <span>{r.date}: {r.resultValue}</span>
                <div className="flex items-center gap-2">
                  {direction && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${deltaBadgeClass(direction)}`}>
                      {direction === "better" ? `↑ ${resultDeltaLabel(selectedMastersWorkout, delta!)}` : direction === "worse" ? `↓ ${resultDeltaLabel(selectedMastersWorkout, delta!)}` : "="}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

