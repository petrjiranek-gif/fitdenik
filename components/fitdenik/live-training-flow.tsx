"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BODYWEIGHT_WOD_ORDER,
  CROSSFIT_WOD_ORDER,
  LIVE_WODS,
  OPEN_SEASON_YEAR_ORDER,
  OPEN_WOD_KEYS_BY_YEAR,
  OPEN_YEAR_MIN,
  type LiveWodDefinition,
  type LiveWodKey,
  type OpenSeasonYear,
  totalTargetReps,
} from "@/lib/live-workout/wod-definitions";
import { formInputClass } from "@/components/fitdenik/form-fields";
import { saveLiveWorkoutLog } from "@/lib/live-workout/persist-log";
import type { LiveSportCategory } from "@/lib/types";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function angieProgressLabel(completed: number): string {
  if (completed >= 400) return "Hotovo";
  if (completed >= 300) return `Dřepy (${completed - 300}/100)`;
  if (completed >= 200) return `Sedy-lehy (${completed - 200}/100)`;
  if (completed >= 100) return `Kliky (${completed - 100}/100)`;
  return `Pull-upy (${completed}/100)`;
}

function andiProgressLabel(completed: number): string {
  if (completed >= 400) return "Hotovo";
  if (completed >= 300) return `Front squat (${completed - 300}/100)`;
  if (completed >= 200) return `Sumo DL HP (${completed - 200}/100)`;
  if (completed >= 100) return `Push press (${completed - 100}/100)`;
  return `Hang power snatch (${completed}/100)`;
}

function segmentLabel(wod: LiveWodDefinition, completed: number): string {
  if (wod.key === "angie" || wod.key === "bw_angie") return angieProgressLabel(completed);
  if (wod.key === "andi") return andiProgressLabel(completed);
  if (wod.liveFinishAnytime && /amrap/i.test(wod.scoreType)) {
    return `${completed} dokončených opakování (AMRAP)`;
  }
  const t = totalTargetReps(wod);
  return `${completed} / ${t}`;
}

/** Detail průběhu (Angie/ANDI) — pod velkým počítadlem. */
function repProgressDetail(wod: LiveWodDefinition, completed: number): string | null {
  if (wod.key === "angie" || wod.key === "bw_angie") return angieProgressLabel(completed);
  if (wod.key === "andi") return andiProgressLabel(completed);
  return null;
}

function CrossfitLoadBlock({
  wod,
  userLoad,
  onChange,
  idSuffix,
}: {
  wod: LiveWodDefinition;
  userLoad: string;
  onChange: (v: string) => void;
  idSuffix: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-3 py-3">
      {wod.rxLoadDescription ? (
        <p className="text-sm leading-snug text-zinc-200">
          <span className="font-semibold text-emerald-400/95">Rx / nářadí:</span>{" "}
          <span className="text-zinc-300">{wod.rxLoadDescription}</span>
        </p>
      ) : (
        <p className="text-xs text-zinc-500">Čistě vlastní váha těla — můžeš zapsat gumy, úpravy shybů apod.</p>
      )}
      <label htmlFor={`crossfit-load-${idSuffix}`} className="mt-2 block text-xs font-medium text-zinc-400">
        S čím jsem cvičil/a
      </label>
      <input
        id={`crossfit-load-${idSuffix}`}
        type="text"
        value={userLoad}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          wod.rxLoadDescription
            ? "např. přesně Rx, nebo 6 kg míč, 75 lb thruster…"
            : "např. shyby na gumě, kliky na bradlech…"
        }
        className={`${formInputClass} mt-1`}
        autoComplete="off"
      />
    </div>
  );
}

export function LiveTrainingFlow() {
  const [sport, setSport] = useState<LiveSportCategory>("crossfit");
  /** Benchmark „Girl/Hero“ vs CrossFit Open. */
  const [cfKind, setCfKind] = useState<"benchmark" | "open">("benchmark");
  const [openYear, setOpenYear] = useState<OpenSeasonYear>(OPEN_SEASON_YEAR_ORDER[0]);
  const [wodKey, setWodKey] = useState<LiveWodKey | null>(null);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [completedReps, setCompletedReps] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [userLoadInput, setUserLoadInput] = useState("");

  const wod = wodKey ? LIVE_WODS[wodKey] : null;
  const target = wod ? totalTargetReps(wod) : 0;
  const remaining = Math.max(0, target - completedReps);
  const hideRepRemaining =
    wod?.liveFinishAnytime === true && (target >= 9000 || /amrap/i.test(wod.scoreType));
  const canFinishSession = Boolean(
    wod && (wod.liveFinishAnytime || completedReps >= target),
  );

  useEffect(() => {
    if (cfKind !== "open" || wodKey == null) return;
    const allowed = OPEN_WOD_KEYS_BY_YEAR[openYear];
    if (!(allowed as readonly string[]).includes(wodKey)) {
      setWodKey(null);
    }
  }, [cfKind, openYear, wodKey]);

  useEffect(() => {
    setUserLoadInput("");
  }, [wodKey, sport]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      if (startedAtRef.current == null) return;
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  const startTimer = () => {
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now();
      setElapsedMs(0);
    }
    setRunning(true);
  };

  const pauseTimer = () => setRunning(false);

  const resetSession = () => {
    setRunning(false);
    startedAtRef.current = null;
    setElapsedMs(0);
    setCompletedReps(0);
    setActiveOpen(false);
    setUserLoadInput("");
  };

  const addReps = (n: number) => {
    if (!wod) return;
    setCompletedReps((c) => Math.min(target, c + n));
  };

  const undoLast = useRef<number[]>([]);
  const addRepsTracked = (n: number) => {
    undoLast.current.push(n);
    addReps(n);
  };

  const undo = () => {
    const last = undoLast.current.pop();
    if (last == null) return;
    setCompletedReps((c) => Math.max(0, c - last));
  };

  const finishAndSave = useCallback(() => {
    if (!wod || !wodKey) return;
    const durationSec = Math.floor(elapsedMs / 1000);
    const loadTrim = userLoadInput.trim();
    const entry = saveLiveWorkoutLog({
      sportCategory: sport,
      wodKey,
      wodName: wod.name,
      durationSec,
      repsCompleted: completedReps,
      repsTarget: target,
      notes: [
        `Živý trénink — ${wod.name}. Čas ${formatElapsed(elapsedMs)}.`,
        loadTrim ? ` Použité váhy / škálování: ${loadTrim}.` : "",
      ].join(""),
      loadUsed: loadTrim || undefined,
    });
    setSaveMessage(
      `Uloženo lokálně (${entry.wodName}, ${formatElapsed(elapsedMs)}). Doplň hlavní záznam tréninku v Importech nebo v Trénink.`,
    );
    resetSession();
    setWodKey(null);
    void fetch("/api/live-workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    }).catch(() => undefined);
  }, [sport, userLoadInput, wod, wodKey, elapsedMs, completedReps, target]);

  const openActive = () => {
    if (!wodKey || !wod) return;
    setCompletedReps(0);
    undoLast.current = [];
    startedAtRef.current = null;
    setElapsedMs(0);
    setRunning(false);
    setActiveOpen(true);
  };

  const sportOptions = useMemo(
    () =>
      [
        { id: "crossfit" as const, label: "CrossFit", hint: "Benchmark nebo Open" },
        { id: "bodybuilding" as const, label: "Bodybuilding", hint: "brzy: série a váhy" },
        { id: "bodyweight" as const, label: "Bodyweight", hint: "Girl / benchmark bez činky" },
      ] as const,
    [],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="text-base font-semibold text-zinc-100">1. Typ tréninku</h3>
        <p className="mb-3 text-xs text-ew-muted">Podle typu se mění nástroje a nápověda.</p>
        <div className="flex flex-wrap gap-2">
          {sportOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setSport(o.id);
                setCfKind("benchmark");
                setWodKey(null);
                resetSession();
              }}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                sport === o.id
                  ? "border-ew-blue-light bg-ew-bg text-white ring-1 ring-ew-blue-light"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              <span className="font-medium">{o.label}</span>
              <span className="ml-2 text-xs text-ew-muted">{o.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {sport === "crossfit" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. CrossFit — výběr WOD</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Benchmarky (Girl/Hero) nebo závodní předpis Open. Předpis a orientační info jako na WodWell.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCfKind("benchmark");
                setWodKey(null);
                setActiveOpen(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${
                cfKind === "benchmark"
                  ? "border-ew-blue-light bg-ew-bg text-white"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              Benchmark
            </button>
            <button
              type="button"
              onClick={() => {
                setCfKind("open");
                setOpenYear(OPEN_SEASON_YEAR_ORDER[0]);
                setWodKey(null);
                setActiveOpen(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${
                cfKind === "open"
                  ? "border-ew-blue-light bg-ew-bg text-white"
                  : "border-ew-border text-zinc-400 hover:border-zinc-500"
              }`}
            >
              Open
            </button>
          </div>
          {cfKind === "open" && (
            <div className="mb-3">
              <label className="mb-2 block text-xs font-medium text-zinc-400" htmlFor="open-year-select">
                Ročník (Open, {OPEN_YEAR_MIN}–{OPEN_SEASON_YEAR_ORDER[0]})
              </label>
              <select
                id="open-year-select"
                value={openYear}
                onChange={(e) => {
                  setOpenYear(Number(e.target.value) as OpenSeasonYear);
                  setWodKey(null);
                  setActiveOpen(false);
                }}
                className="w-full max-w-xs rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-sm text-white"
              >
                {OPEN_SEASON_YEAR_ORDER.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-ew-muted">
                Pro každý rok 2011+ jsou tři workouty (odkaz na WodWell). Rok {OPEN_YEAR_MIN}: formát Open ještě neexistoval.
              </p>
            </div>
          )}
          {cfKind === "open" && OPEN_WOD_KEYS_BY_YEAR[openYear].length === 0 ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-sm text-amber-100/90">
              CrossFit Open začalo v roce 2011 — zvol rok 2011 nebo novější a zobrazí se Open 1–3.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(cfKind === "benchmark" ? CROSSFIT_WOD_ORDER : OPEN_WOD_KEYS_BY_YEAR[openYear]).map(
                (key: LiveWodKey) => {
                  const def = LIVE_WODS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setWodKey(key);
                        setActiveOpen(false);
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        wodKey === key
                          ? "border-ew-blue-light bg-ew-bg text-white"
                          : "border-ew-border text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {def.name}
                    </button>
                  );
                },
              )}
            </div>
          )}
          {wod && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(true)}
                className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-ew-blue-light hover:border-ew-blue-light"
              >
                Zobrazit předpis a časy
              </button>
              <button
                type="button"
                onClick={openActive}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Spustit čas + počítadlo
              </button>
            </div>
          )}
        </section>
      )}

      {sport === "bodyweight" && (
        <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-base font-semibold text-zinc-100">2. Bodyweight — výběr WOD</h3>
          <p className="mb-3 text-xs text-ew-muted">
            Klasické benchmarky jen s vlastní vahou (WodWell). Blackjack, Cindy, Chelsea, Angie, Barbara, Annie, Tabata,
            Death by Burpees, Pukie Brewster, Burpee Hour.
          </p>
          <div className="flex flex-wrap gap-2">
            {BODYWEIGHT_WOD_ORDER.map((key) => {
              const def = LIVE_WODS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setWodKey(key);
                    setActiveOpen(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    wodKey === key
                      ? "border-ew-blue-light bg-ew-bg text-white"
                      : "border-ew-border text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {def.name}
                </button>
              );
            })}
          </div>
          {wod && sport === "bodyweight" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(true)}
                className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-ew-blue-light hover:border-ew-blue-light"
              >
                Zobrazit předpis a časy
              </button>
              <button
                type="button"
                onClick={openActive}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Spustit čas + počítadlo
              </button>
            </div>
          )}
        </section>
      )}

      {sport === "bodybuilding" && (
        <section className="rounded-xl border border-dashed border-ew-border bg-ew-bg p-6 text-sm text-ew-muted">
          Režim <strong className="text-zinc-300">Bodybuilding</strong> připravíme v další verzi (série, váhy, odpočinek).
          Zatím použij záložku Trénink nebo Importy.
        </section>
      )}

      {prescriptionOpen && wod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="wod-prescription-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ew-border bg-ew-panel p-4 shadow-xl">
            <h3 id="wod-prescription-title" className="text-lg font-semibold text-white">
              {wod.name}
            </h3>
            <p className="text-xs uppercase tracking-wide text-ew-muted">{wod.subtitle}</p>
            <p className="mt-2 text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">{wod.scoreType}</span>
              {wod.timeCapMin != null && (
                <span className="ml-2 rounded bg-amber-500/15 px-2 py-0.5 text-amber-200/90">
                  cap {wod.timeCapMin} min
                </span>
              )}{" "}
              · {wod.prescription}
            </p>
            <p className="mt-3 text-sm text-zinc-300">{wod.description}</p>
            {sport === "crossfit" && (
              <CrossfitLoadBlock
                wod={wod}
                userLoad={userLoadInput}
                onChange={setUserLoadInput}
                idSuffix="rx"
              />
            )}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-ew-muted">Orientační časy</p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {wod.benchmarks.map((b) => (
                  <li key={b.level}>
                    <span className="text-ew-muted">{b.level}:</span> {b.timeRange}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-xs text-ew-muted">
              Oficiální detail a diskuze:{" "}
              <a href={wod.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-ew-blue-light underline">
                WodWell — {wod.name}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(false)}
                className="rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-200"
              >
                Zavřít
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrescriptionOpen(false);
                  openActive();
                }}
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Pokračovat na čas a opakování
              </button>
            </div>
          </div>
        </div>
      )}

      {activeOpen && wod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="live-session-title"
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-ew-border bg-ew-bg p-4 shadow-xl">
            <h3 id="live-session-title" className="text-lg font-semibold text-white">
              {wod.name} — živý průběh
            </h3>
            {sport === "crossfit" && (
              <CrossfitLoadBlock
                wod={wod}
                userLoad={userLoadInput}
                onChange={setUserLoadInput}
                idSuffix="live"
              />
            )}

            {(() => {
              const detail = repProgressDetail(wod, completedReps);
              const showBigFraction =
                target > 0 && target < 9000 && !hideRepRemaining;
              const subline =
                detail ?? (!showBigFraction ? segmentLabel(wod, completedReps) : null);
              return (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ew-border bg-ew-panel p-4 text-center">
                    <p className="text-xs text-ew-muted">Čas (od startu)</p>
                    <p className="font-mono text-4xl font-bold text-white tabular-nums">
                      {formatElapsed(elapsedMs)}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={startTimer}
                        disabled={running}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                      >
                        Zahájit / pokračovat v čase
                      </button>
                      <button
                        type="button"
                        onClick={pauseTimer}
                        disabled={!running}
                        className="rounded-md border border-ew-border px-4 py-2 text-sm text-zinc-200 disabled:opacity-40"
                      >
                        Pauza
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-ew-border bg-ew-panel p-4 text-center">
                    <p className="text-xs text-ew-muted">Počítadlo</p>
                    {showBigFraction ? (
                      <>
                        <p className="font-mono text-4xl font-bold text-white tabular-nums">
                          {completedReps}
                          <span className="text-zinc-500"> / </span>
                          {target}
                        </p>
                        {remaining > 0 && (
                          <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-400/95">
                            zbývá {remaining}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="font-mono text-4xl font-bold text-white tabular-nums">{completedReps}</p>
                    )}
                    {subline && (
                      <p className="mt-3 text-sm leading-snug text-zinc-400">{subline}</p>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-zinc-300">Přičíst opakování</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[1, 3, 5, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => addRepsTracked(n)}
                    className="rounded-lg bg-ew-blue px-3 py-4 text-lg font-bold text-white hover:bg-ew-blue-dark"
                  >
                    +{n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={undo}
                className="mt-3 w-full rounded-md border border-ew-border py-2 text-sm text-zinc-300 hover:bg-ew-panel"
              >
                Vrátit poslední přičtení
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-ew-border pt-4">
              <button
                type="button"
                onClick={() => {
                  resetSession();
                  setPrescriptionOpen(false);
                }}
                className="rounded-md border border-ew-border px-3 py-2 text-sm text-zinc-300"
              >
                Zrušit session
              </button>
              <button
                type="button"
                disabled={!canFinishSession}
                onClick={finishAndSave}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Dokončit a uložit výsledek
              </button>
            </div>
            <p className="mt-3 text-xs text-ew-muted">
              Uloží se čas, počet opakování a název WOD do lokálního deníku. Hlavní kalorie a délku doplníš importem nebo ručně v Trénink.
            </p>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/50 p-3 text-sm text-emerald-100">
          {saveMessage}{" "}
          <Link href="/training" className="font-medium text-ew-blue-light underline">
            Otevřít Trénink
          </Link>
          .
          <button
            type="button"
            className="ml-2 text-emerald-300 underline"
            onClick={() => setSaveMessage(null)}
          >
            Zavřít
          </button>
        </div>
      )}
    </div>
  );
}
