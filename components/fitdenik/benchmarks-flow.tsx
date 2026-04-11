"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import {
  filterBenchmarks,
  GIRL_BENCHMARKS,
  OTHER_BENCHMARKS,
  type BenchmarkCatalogEntry,
  type BenchmarkCatalogKind,
} from "@/lib/benchmarks/catalog";
import type { BenchmarkResult, SourceType } from "@/lib/types";
import { formInputClass } from "@/components/fitdenik/form-fields";
import { SourceBadge } from "@/components/fitdenik/ui";

type ModalStep = "closed" | "definition" | "entry";

const RESULT_TYPES = ["čas", "opakování", "váha", "AMRAP", "jiné"] as const;

export function BenchmarksFlow() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";

  const [category, setCategory] = useState<BenchmarkCatalogKind | null>(null);
  const [query, setQuery] = useState("");
  const [activeEntry, setActiveEntry] = useState<BenchmarkCatalogEntry | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("closed");

  const [results, setResults] = useState<BenchmarkResult[]>(() =>
    useSupabase ? [] : repositories.benchmarks.list(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [resultType, setResultType] = useState<string>("čas");
  const [resultValue, setResultValue] = useState("");
  const [scaling, setScaling] = useState("");
  const [notes, setNotes] = useState("");

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

  const list = useMemo(() => {
    const base = category === "girl" ? GIRL_BENCHMARKS : category === "other_wod" ? OTHER_BENCHMARKS : [];
    return filterBenchmarks(base, query);
  }, [category, query]);

  const openDefinition = (entry: BenchmarkCatalogEntry) => {
    setActiveEntry(entry);
    setModalStep("definition");
    setErrorMessage(null);
  };

  const goToEntry = () => {
    if (!activeEntry) return;
    setResultValue("");
    setScaling("");
    setNotes("");
    setResultType(activeEntry.scoreType.toLowerCase().includes("amrap") ? "AMRAP" : "čas");
    setDate(new Date().toISOString().slice(0, 10));
    setModalStep("entry");
  };

  const closeModal = useCallback(() => {
    setModalStep("closed");
    setActiveEntry(null);
  }, []);

  useEffect(() => {
    if (modalStep === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalStep, closeModal]);

  const onSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry) return;
    if (!resultValue.trim()) {
      setErrorMessage("Zadej výsledek (čas, váhu, počet kol apod.).");
      return;
    }

    const input: Omit<BenchmarkResult, "id"> = {
      userId: "u1",
      date,
      benchmarkName: activeEntry.name,
      resultType,
      resultValue: resultValue.trim(),
      scaling: scaling.trim(),
      notes: notes.trim(),
      sourceType: "wodwell" as SourceType,
      sourceName: "WODwell",
      sourceUrl: activeEntry.referenceUrl,
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
    closeModal();
  };

  return (
    <div className="space-y-8">
      {category === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setCategory("girl");
              setQuery("");
            }}
            className="group rounded-2xl border border-ew-border bg-gradient-to-br from-ew-panel to-zinc-900/80 p-6 text-left ring-1 ring-ew-border transition hover:border-ew-blue/60 hover:ring-ew-blue/40"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-ew-blue">WodWell · benchmark girl</div>
            <h3 className="mt-2 text-xl font-bold text-white">Benchmark Girl</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Klasické CrossFit „Girl“ benchmarky (Fran, Cindy, Helen…). Vyber WOD a uvidíš předpis podle WodWell.
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-ew-blue group-hover:underline">Vybrat →</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory("other_wod");
              setQuery("");
            }}
            className="group rounded-2xl border border-ew-border bg-gradient-to-br from-ew-panel to-zinc-900/80 p-6 text-left ring-1 ring-ew-border transition hover:border-ew-blue/60 hover:ring-ew-blue/40"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ostatní pojmenované</div>
            <h3 className="mt-2 text-xl font-bold text-white">Benchmark WOD</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Hero WOD, komplexy a další benchmarky bez formátu Girl (Murph, Bear Complex, DT…).
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-ew-blue group-hover:underline">Vybrat →</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCategory(null);
                setQuery("");
              }}
              className="rounded-lg border border-ew-border bg-ew-bg px-3 py-1.5 text-sm text-zinc-300 hover:bg-ew-border"
            >
              ← Zpět na výběr
            </button>
            <span className="text-sm text-zinc-500">
              {category === "girl" ? "Benchmark Girl" : "Benchmark WOD"}
            </span>
          </div>
          <label className="block max-w-md">
            <span className="mb-1 block text-xs text-zinc-500">Hledat v seznamu</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Název nebo část předpisu…"
              className={formInputClass}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => openDefinition(entry)}
                className="rounded-xl border border-ew-border bg-ew-panel p-4 text-left transition hover:border-ew-blue/50 hover:bg-zinc-900/40"
              >
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{entry.subtitle}</div>
                <div className="mt-1 text-lg font-bold uppercase tracking-tight text-white">{entry.name}</div>
                <div className="mt-2 line-clamp-2 text-xs text-zinc-400">{entry.prescription}</div>
                <div className="mt-2 text-xs text-ew-blue">Otevřít definici</div>
              </button>
            ))}
          </div>
          {list.length === 0 && (
            <p className="text-sm text-zinc-500">Žádný výsledek — zkus jiný dotaz.</p>
          )}
        </div>
      )}

      {modalStep !== "closed" && activeEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="benchmark-modal-title"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ew-border bg-ew-panel p-6 shadow-xl ring-1 ring-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {modalStep === "definition" && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{activeEntry.subtitle}</div>
                <h3 id="benchmark-modal-title" className="mt-1 text-2xl font-bold uppercase text-white">
                  {activeEntry.name}
                </h3>
                <p className="mt-2 text-sm font-medium text-ew-blue">{activeEntry.scoreType}</p>
                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Předpis</div>
                    <p>{activeEntry.prescription}</p>
                  </div>
                  {activeEntry.rxLoadDescription && (
                    <div>
                      <div className="text-xs uppercase text-zinc-500">Rx / váhy</div>
                      <p>{activeEntry.rxLoadDescription}</p>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase text-zinc-500">Popis</div>
                    <p className="text-zinc-400">{activeEntry.description}</p>
                  </div>
                </div>
                <a
                  href={activeEntry.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-sm text-ew-blue hover:underline"
                >
                  Otevřít na WodWell →
                </a>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={goToEntry}
                    className="rounded-lg bg-ew-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Zapsat výsledek
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-ew-border bg-ew-bg px-4 py-2 text-sm text-zinc-300"
                  >
                    Zavřít
                  </button>
                </div>
              </>
            )}
            {modalStep === "entry" && (
              <form onSubmit={onSaveResult} className="space-y-4">
                <h3 id="benchmark-modal-title" className="text-xl font-bold text-white">
                  Tvůj výsledek — {activeEntry.name}
                </h3>
                <p className="text-xs text-zinc-500">Uloží se do historie benchmarků (stejně jako dříve).</p>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">Datum</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={formInputClass} required />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">Typ výsledku</span>
                  <select
                    value={resultType}
                    onChange={(e) => setResultType(e.target.value)}
                    className={formInputClass}
                  >
                    {RESULT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">Hodnota</span>
                  <input
                    value={resultValue}
                    onChange={(e) => setResultValue(e.target.value)}
                    placeholder="Např. 4:52 nebo 215 lb nebo 312 reps"
                    className={formInputClass}
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">Scaling / váha</span>
                  <input
                    value={scaling}
                    onChange={(e) => setScaling(e.target.value)}
                    placeholder="Např. thruster 40 kg, shyby s gumou"
                    className={formInputClass}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">Poznámka</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={formInputClass}
                  />
                </label>
                {errorMessage && (
                  <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">
                    {errorMessage}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="submit" className="rounded-lg bg-ew-blue px-4 py-2 text-sm font-medium text-white">
                    Uložit výsledek
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep("definition")}
                    className="rounded-lg border border-ew-border px-4 py-2 text-sm text-zinc-300"
                  >
                    ← Definice
                  </button>
                  <button type="button" onClick={closeModal} className="rounded-lg border border-ew-border px-4 py-2 text-sm text-zinc-300">
                    Zavřít
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-3 font-semibold text-white">Historie benchmarků</h3>
        <div className="space-y-2 text-sm">
          {results.length === 0 ? (
            <p className="text-zinc-500">Zatím žádné uložené výsledky.</p>
          ) : (
            results.slice(0, 12).map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-zinc-200"
              >
                <span>
                  {r.date} — <span className="font-medium text-white">{r.benchmarkName}</span> ({r.resultValue})
                  {r.scaling ? <span className="text-zinc-500"> · {r.scaling}</span> : null}
                </span>
                <SourceBadge source={r.sourceType} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
