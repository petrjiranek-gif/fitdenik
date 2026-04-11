"use client";

import { useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { BenchmarkResult, SourceType } from "@/lib/types";
import { SourceBadge } from "@/components/fitdenik/ui";

export function BenchmarkLog() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [results, setResults] = useState<BenchmarkResult[]>(() =>
    useSupabase ? [] : repositories.benchmarks.list(),
  );
  const [benchmarkName, setBenchmarkName] = useState("Karen");
  const [resultValue, setResultValue] = useState("14:03");
  const [scaling, setScaling] = useState("9kg wall ball");
  const [sourceType, setSourceType] = useState<SourceType>("wodwell");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!useSupabase) return;
    void fetch("/api/benchmarks")
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setErrorMessage(result.error ?? "Nepodařilo se načíst benchmarky.");
          return;
        }
        const result = (await response.json()) as { results: BenchmarkResult[] };
        setResults(result.results);
      })
      .catch(() => {
        setErrorMessage("Nepodařilo se načíst benchmarky.");
      });
  }, [useSupabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: Omit<BenchmarkResult, "id"> = {
      userId: "u1",
      date: new Date().toISOString().slice(0, 10),
      benchmarkName,
      resultType: "čas",
      resultValue,
      scaling,
      notes: "",
      sourceType,
      sourceName: sourceType === "wodwell" ? "WODwell" : "Custom",
      sourceUrl:
        sourceType === "wodwell"
          ? "https://wodwell.com/wods/?sort=popular"
          : "",
    };

    if (useSupabase) {
      const response = await fetch("/api/benchmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setErrorMessage(result.error ?? "Nepodařilo se uložit benchmark.");
        return;
      }
      const result = (await response.json()) as { result: BenchmarkResult };
      setResults((prev) => [result.result, ...prev]);
    } else {
      const created = repositories.benchmarks.create({
        date: input.date,
        benchmarkName: input.benchmarkName,
        resultType: input.resultType,
        resultValue: input.resultValue,
        scaling: input.scaling,
        notes: input.notes,
        sourceType: input.sourceType,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
      });
      setResults((prev) => [created, ...prev]);
    }
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-ew-border bg-ew-panel p-4 md:grid-cols-4">
        <div className="md:col-span-4">
          <h3 className="text-base font-semibold">Přidat benchmark výsledek</h3>
          <p className="text-xs text-zinc-500">
            Vyplň název benchmarku, výsledek, scaling a zdroj reference.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Název benchmarku</span>
          <input
            value={benchmarkName}
            onChange={(e) => setBenchmarkName(e.target.value)}
            placeholder="Např. Karen, Grace, Cindy"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Výsledek</span>
          <input
            value={resultValue}
            onChange={(e) => setResultValue(e.target.value)}
            placeholder="Např. 14:03 nebo 132 reps"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Scaling</span>
          <input
            value={scaling}
            onChange={(e) => setScaling(e.target.value)}
            placeholder="Např. 9kg wall ball"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Zdroj</span>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="wodwell">wodwell</option>
            <option value="crossfit">crossfit</option>
            <option value="youtube-inspired">youtube-inspired</option>
            <option value="custom">custom</option>
            <option value="internal">internal</option>
          </select>
        </label>
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white md:col-span-4">Přidat benchmark výsledek</button>
      </form>
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-3 font-semibold">Historie benchmarků</h3>
        <div className="space-y-2 text-sm">
          {results.slice(0, 8).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-zinc-900"
            >
              <span>{r.date} - {r.benchmarkName} ({r.resultValue})</span>
              <SourceBadge source={r.sourceType} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
