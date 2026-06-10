"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoachCheckInPanel } from "@/components/fitdenik/coach-check-in-panel";
import { CoachPlanPanel } from "@/components/fitdenik/coach-plan-panel";
import { formInputClass } from "@/components/fitdenik/form-fields";
import {
  CALENDAR_DAY_META,
  IRON_MAN_AUDIO_TRACKS,
  IRON_MAN_DISCIPLINES,
  IRON_MAN_MOTTO,
  IRON_MAN_PHASES,
  IRON_MAN_PROJECT_START,
  IRON_MAN_START_WEIGHT_KG,
  IRON_MAN_TARGET_WEIGHT_KG,
  WEIGHT_MILESTONES_KG,
  type CalendarDayStatus,
  type IronManPhase,
} from "@/lib/iron-man-2030/constants";
import {
  calendarStatsForRange,
  computeCountdown,
  computeDisciplineBreakdown,
  computePhaseCompletion,
  computeProjectStats,
  computeWeightProgress,
  dataChallengeItems,
  getActivePhase,
  mergeCalendarWithTrainings,
  missedDaysWithReasons,
  race1406TargetDate,
  race703TargetDate,
  weeklySessionTrend,
} from "@/lib/iron-man-2030/compute";
import { readIronManLocalState, writeIronManLocalState } from "@/lib/iron-man-2030/local-store";
import { computeCoachConfirmationPatch, isCoachDayConfirmed } from "@/lib/iron-man-2030/coach-plan-sync";
import { mergeIronManState } from "@/lib/iron-man-2030/state-merge";
import type {
  IronMan2030Settings,
  IronMan2030State,
  IronManCalendarDay,
  IronManCoachCheckIn,
  IronManColdSession,
  IronManDisciplineSlice,
  IronManMeditationSession,
} from "@/lib/iron-man-2030/types";
import { getRepositories } from "@/lib/repositories/provider";
import { computeHrvTrend } from "@/lib/hrv/compute";
import type { BodyMeasurementEntry, HrvEntry, TrainingSession } from "@/lib/types";

function cardClass(extra = "") {
  return `rounded-xl border border-ew-border bg-ew-panel p-4 ${extra}`;
}

function CountdownDisplay({ label, targetDate }: { label: string; targetDate: string }) {
  const [parts, setParts] = useState(() => computeCountdown(targetDate));
  useEffect(() => {
    const id = setInterval(() => setParts(computeCountdown(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className={cardClass()}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ew-muted">{label}</p>
      <p className="mt-1 text-[10px] text-zinc-500">Cíl: {new Date(`${targetDate}T12:00:00`).toLocaleDateString("cs-CZ")}</p>
      <div className="mt-3 grid grid-cols-5 gap-2 text-center">
        {[
          ["let", parts.years],
          ["dní", parts.days],
          ["hod", parts.hours],
          ["min", parts.minutes],
          ["sek", parts.seconds],
        ].map(([unit, val]) => (
          <div key={unit} className="rounded-lg bg-ew-bg/80 px-1 py-2">
            <div className="text-xl font-bold tabular-nums text-white">{val}</div>
            <div className="text-[10px] uppercase text-zinc-500">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisciplinePie({ slices, mode }: { slices: IronManDisciplineSlice[]; mode: "hours" | "calories" }) {
  const total = slices.reduce((a, s) => a + (mode === "hours" ? s.hours : s.calories), 0) || 1;
  let acc = 0;
  const segments = slices.map((row) => {
    const v = mode === "hours" ? row.hours : row.calories;
    const pct = (v / total) * 100;
    const start = acc;
    acc += pct;
    return `${row.color} ${start}% ${acc}%`;
  });
  if (segments.length === 0) {
    return <p className="text-sm text-ew-muted">Zatím žádná data od {IRON_MAN_PROJECT_START}.</p>;
  }
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div
        className="mx-auto h-36 w-36 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${segments.join(", ")})` }}
        aria-hidden
      />
      <ul className="flex-1 space-y-1 text-sm">
        {slices.map((row) => (
          <li key={row.id} className="flex justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="tabular-nums text-zinc-300">
              {mode === "hours" ? `${row.hours.toFixed(1)} h` : `${Math.round(row.calories)} kcal`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniWeekBars({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-500">{label}</p>
      <div className="flex h-14 items-end gap-1">
        {values.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-ew-blue/70"
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 0 }}
            title={`${v}`}
          />
        ))}
      </div>
    </div>
  );
}

function monthCells(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ key: `pad-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ key, day: d });
  }
  return cells;
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function IronMan2030Dashboard() {
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const repositories = useMemo(() => getRepositories(), []);

  const [state, setState] = useState<IronMan2030State>(() =>
    useSupabase ? mergeIronManState(null) : readIronManLocalState(),
  );
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [bodyEntries, setBodyEntries] = useState<BodyMeasurementEntry[]>([]);
  const [hrvEntries, setHrvEntries] = useState<HrvEntry[]>([]);
  const [loading, setLoading] = useState(useSupabase);
  const [error, setError] = useState<string | null>(null);
  const [disciplineMode, setDisciplineMode] = useState<"hours" | "calories">("hours");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarDialog, setCalendarDialog] = useState<string | null>(null);
  const [openInfo, setOpenInfo] = useState<string | null>("1406");

  const persistState = useCallback(
    async (next: IronMan2030State) => {
      setState(next);
      if (useSupabase) {
        const res = await fetch("/api/iron-man-2030", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          setError(j.error ?? "Uložení selhalo.");
        }
      } else {
        writeIronManLocalState(next);
      }
    },
    [useSupabase],
  );

  const reload = useCallback(async () => {
    if (useSupabase) {
      setLoading(true);
      try {
        const res = await fetch("/api/iron-man-2030/summary", { cache: "no-store" });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          setError(j.error ?? "Nepodařilo se načíst modul.");
          return;
        }
        const j = (await res.json()) as {
          state: IronMan2030State;
          sessions: TrainingSession[];
          bodyEntries: BodyMeasurementEntry[];
          hrvEntries?: HrvEntry[];
        };
        setState(j.state);
        setSessions(j.sessions);
        setBodyEntries(j.bodyEntries);
        setHrvEntries(j.hrvEntries ?? []);
        setError(null);
      } catch {
        setError("Nepodařilo se načíst modul.");
      } finally {
        setLoading(false);
      }
    } else {
      setState(readIronManLocalState());
      setSessions(repositories.training.list().filter((s) => s.date >= IRON_MAN_PROJECT_START));
      setBodyEntries(repositories.bodyMeasurements.list());
      setHrvEntries(repositories.hrv.list());
    }
  }, [repositories, useSupabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const trainingDates = useMemo(() => new Set(sessions.map((s) => s.date)), [sessions]);
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, TrainingSession>();
    for (const s of sessions) {
      if (!map.has(s.date)) map.set(s.date, s);
    }
    return map;
  }, [sessions]);

  useEffect(() => {
    const planId = state.coachWeeklyPlan?.approvedAt ? state.coachWeeklyPlan.id : undefined;
    if (!planId || !useSupabase) return;
    const patch = computeCoachConfirmationPatch(state.calendar, sessions, planId);
    if (Object.keys(patch).length === 0) return;
    void persistState({ ...state, calendar: { ...state.calendar, ...patch } });
  }, [sessions, state, state.coachWeeklyPlan?.id, state.coachWeeklyPlan?.approvedAt, useSupabase, persistState]);

  const calendar = useMemo(() => mergeCalendarWithTrainings(state.calendar, sessions), [state.calendar, sessions]);
  const settings = state.settings;
  const phase = useMemo(() => getActivePhase(), []);
  const projectStats = useMemo(() => computeProjectStats(sessions), [sessions]);
  const disciplineSlices = useMemo(
    () => computeDisciplineBreakdown(sessions, disciplineMode),
    [sessions, disciplineMode],
  );
  const weightProgress = useMemo(() => computeWeightProgress(bodyEntries), [bodyEntries]);
  const phaseCompletion = useMemo(() => computePhaseCompletion(sessions, phase, phase.id), [sessions, phase]);
  const missed = useMemo(() => missedDaysWithReasons({ ...state, calendar }, sessions), [state, calendar, sessions]);
  const hrvTrend = useMemo(() => computeHrvTrend(hrvEntries), [hrvEntries]);
  const challenges = useMemo(() => dataChallengeItems(settings, hrvEntries), [settings, hrvEntries]);

  const monthFrom = toDateKey(calendarMonth);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const monthTo = toDateKey(monthEnd);
  const monthStats = useMemo(() => calendarStatsForRange(calendar, monthFrom, monthTo), [calendar, monthFrom, monthTo]);

  const coldTrend = useMemo(() => weeklySessionTrend(state.coldSessions), [state.coldSessions]);
  const medTrend = useMemo(() => weeklySessionTrend(state.meditationSessions), [state.meditationSessions]);
  const coldTotalMin = state.coldSessions.reduce((a, s) => a + s.durationMin, 0);
  const medTotalMin = state.meditationSessions.reduce((a, s) => a + s.durationMin, 0);

  const updateSettings = (patch: Partial<IronMan2030Settings>) => {
    void persistState({ ...state, settings: { ...settings, ...patch } });
  };

  const setCalendarDay = (date: string, day: IronManCalendarDay | null) => {
    const nextCal = { ...state.calendar };
    if (day) {
      const prev = state.calendar[date];
      nextCal[date] = prev
        ? {
            ...day,
            coachPlanId: prev.coachPlanId,
            coachConfirmedAt: prev.coachConfirmedAt,
            coachMatchedSessionId: prev.coachMatchedSessionId,
          }
        : day;
    } else delete nextCal[date];
    void persistState({ ...state, calendar: nextCal });
    setCalendarDialog(null);
  };

  const confirmCoachDay = async (date: string) => {
    const session = sessionsByDate.get(date);
    if (useSupabase) {
      const res = await fetch("/api/iron-man-2030/coach/confirm-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, sessionId: session?.id }),
      });
      const j = (await res.json()) as { ok?: boolean; state?: IronMan2030State; error?: string };
      if (j.state) setState(j.state);
      else if (!j.ok) setError(j.error ?? "Potvrzení dne selhalo.");
      return;
    }
    const prev = state.calendar[date];
    if (!prev?.coachPlanId) return;
    void persistState({
      ...state,
      calendar: {
        ...state.calendar,
        [date]: {
          ...prev,
          coachConfirmedAt: new Date().toISOString(),
          coachMatchedSessionId: session?.id,
        },
      },
    });
  };

  const addColdSession = (session: Omit<IronManColdSession, "id">) => {
    const entry: IronManColdSession = { ...session, id: crypto.randomUUID() };
    void persistState({ ...state, coldSessions: [entry, ...state.coldSessions] });
  };

  const addMeditationSession = (session: Omit<IronManMeditationSession, "id">) => {
    const entry: IronManMeditationSession = { ...session, id: crypto.randomUUID() };
    void persistState({ ...state, meditationSessions: [entry, ...state.meditationSessions] });
  };

  const saveCoachCheckIn = (checkIn: IronManCoachCheckIn) => {
    const history = [checkIn, ...(state.coachCheckInHistory ?? [])].slice(0, 12);
    void persistState({
      ...state,
      coachCheckIn: checkIn,
      coachCheckInHistory: history,
    });
  };

  if (loading) {
    return <p className="text-sm text-ew-muted">Načítám Iron Man 2030…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className={cardClass("border-ew-blue/30 bg-gradient-to-br from-ew-panel to-ew-bg")}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/ironman-logo.png"
                alt="IRONMAN"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 object-contain"
                priority
              />
              <div>
                <h2 className="text-2xl font-bold text-white">Iron Man 2030</h2>
                <p className="text-sm italic text-ew-blue-light">{IRON_MAN_MOTTO}</p>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              Projekt od {new Date(`${IRON_MAN_PROJECT_START}T12:00:00`).toLocaleDateString("cs-CZ")} · Mallorca 70.3 ·
              Ironman Thun 2030
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500">Motivace · soukromé použití · otevře YouTube Music (bez autoplay)</p>
            {IRON_MAN_AUDIO_TRACKS.map((track) => (
              <div
                key={track.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-ew-border bg-ew-bg/60 px-3 py-2"
              >
                <span className="flex-1 text-xs text-zinc-300">{track.title}</span>
                <a
                  href={track.youtubeMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-ew-blue px-2.5 py-1 text-xs text-white hover:bg-ew-blue-dark"
                >
                  YouTube Music ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
      )}

      {/* Countdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <CountdownDisplay label="IRONMAN 70.3" targetDate={race703TargetDate(settings)} />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={settings.race703.registered}
              onChange={(e) =>
                updateSettings({
                  race703: { ...settings.race703, registered: e.target.checked },
                })
              }
            />
            Registrován na závod
          </label>
          {settings.race703.registered && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">
                Datum registrace
                <input
                  type="date"
                  className={`${formInputClass} mt-1`}
                  value={settings.race703.registeredAt ?? ""}
                  onChange={(e) =>
                    updateSettings({ race703: { ...settings.race703, registeredAt: e.target.value } })
                  }
                />
              </label>
              <label className="text-xs text-zinc-400">
                Skutečný datum závodu
                <input
                  type="date"
                  className={`${formInputClass} mt-1`}
                  value={settings.race703.actualRaceDate ?? ""}
                  onChange={(e) =>
                    updateSettings({ race703: { ...settings.race703, actualRaceDate: e.target.value } })
                  }
                />
              </label>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <CountdownDisplay label="IRONMAN 140.6" targetDate={race1406TargetDate(settings)} />
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={settings.race1406.registered}
              onChange={(e) =>
                updateSettings({
                  race1406: { ...settings.race1406, registered: e.target.checked },
                })
              }
            />
            Registrován na závod
          </label>
          {settings.race1406.registered && (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">
                Datum registrace
                <input
                  type="date"
                  className={`${formInputClass} mt-1`}
                  value={settings.race1406.registeredAt ?? ""}
                  onChange={(e) =>
                    updateSettings({ race1406: { ...settings.race1406, registeredAt: e.target.value } })
                  }
                />
              </label>
              <label className="text-xs text-zinc-400">
                Skutečný datum závodu
                <input
                  type="date"
                  className={`${formInputClass} mt-1`}
                  value={settings.race1406.actualRaceDate ?? ""}
                  onChange={(e) =>
                    updateSettings({ race1406: { ...settings.race1406, actualRaceDate: e.target.value } })
                  }
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Project stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClass()}>
          <p className="text-xs uppercase text-ew-muted">Spálené kalorie</p>
          <p className="mt-1 text-3xl font-bold text-ew-accent">{projectStats.totalCalories.toLocaleString("cs-CZ")}</p>
        </div>
        <div className={cardClass()}>
          <p className="text-xs uppercase text-ew-muted">Hodiny tréninku</p>
          <p className="mt-1 text-3xl font-bold text-white">{projectStats.totalHours.toFixed(1)}</p>
        </div>
        <div className={cardClass()}>
          <p className="text-xs uppercase text-ew-muted">Tréninkové dny</p>
          <p className="mt-1 text-3xl font-bold text-white">{projectStats.trainingDays}</p>
        </div>
        <div className={cardClass()}>
          <p className="text-xs uppercase text-ew-muted">Průměr h/týden</p>
          <p className="mt-1 text-3xl font-bold text-white">{projectStats.avgHoursPerWeek.toFixed(1)}</p>
        </div>
      </section>

      {/* Disciplines */}
      <section className={cardClass()}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-zinc-100">Rozložení disciplín</h3>
          <div className="flex gap-1 rounded-lg border border-ew-border p-0.5">
            {(["hours", "calories"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDisciplineMode(m)}
                className={`rounded-md px-3 py-1 text-xs ${disciplineMode === m ? "bg-ew-blue text-white" : "text-zinc-400"}`}
              >
                {m === "hours" ? "Hodiny" : "Kalorie"}
              </button>
            ))}
          </div>
        </div>
        <DisciplinePie slices={disciplineSlices} mode={disciplineMode} />
        <p className="mt-3 text-[10px] text-zinc-500">
          {IRON_MAN_DISCIPLINES.map((d) => d.label).join(" · ")} — mapování ze sportu v deníku
        </p>
      </section>

      {/* Weight */}
      <section className={cardClass()}>
        <h3 className="font-semibold text-zinc-100">Váhový progress</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ew-muted">Aktuální</p>
            <p className="text-2xl font-bold">{weightProgress.current.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-xs text-ew-muted">Zbývá</p>
            <p className="text-2xl font-bold">{weightProgress.remaining.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-xs text-ew-muted">Splnění cíle</p>
            <p className="text-2xl font-bold">{weightProgress.pct.toFixed(0)} %</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ew-blue to-ew-accent"
            style={{ width: `${weightProgress.pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
          <span>{IRON_MAN_START_WEIGHT_KG} kg</span>
          {WEIGHT_MILESTONES_KG.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Cíl {IRON_MAN_TARGET_WEIGHT_KG} kg · data z{" "}
          <Link href="/body-metrics" className="text-ew-blue-light hover:underline">
            tělesných měření
          </Link>
        </p>
      </section>

      {/* Phases */}
      <section className={cardClass()}>
        <h3 className="font-semibold text-zinc-100">Fáze a plnění</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Aktuální fáze: <strong className="text-white">{phase.label}</strong> — {phase.primaryGoal}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-xs text-ew-muted">
                <th className="pb-2">Fáze</th>
                <th className="pb-2">Období</th>
                <th className="pb-2">Tréninků/týden</th>
                <th className="pb-2">Hodin/týden</th>
              </tr>
            </thead>
            <tbody>
              {IRON_MAN_PHASES.map((ph: IronManPhase) => (
                <tr key={ph.id} className={ph.id === phase.id ? "text-white" : "text-zinc-500"}>
                  <td className="py-1">{ph.label}</td>
                  <td className="py-1">
                    {ph.from} – {ph.to}
                  </td>
                  <td className="py-1">
                    {ph.sessionsPerWeek[0]}–{ph.sessionsPerWeek[1]}
                  </td>
                  <td className="py-1">
                    {ph.hoursPerWeek[0]}–{ph.hoursPerWeek[1]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <p className="text-sm text-zinc-300">
            Plnění fáze:{" "}
            <span className="font-semibold text-white">
              {phaseCompletion.done} / {phaseCompletion.target}
            </span>{" "}
            ({phaseCompletion.pct.toFixed(0)} %)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-ew-blue" style={{ width: `${phaseCompletion.pct}%` }} />
          </div>
        </div>
        {missed.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase text-ew-muted">Vynechané / speciální dny</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm">
              {missed.slice(0, 12).map((row) => (
                <li key={row.date} className="text-zinc-400">
                  {row.date} · {row.status} — {row.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Calendar */}
      <section className={cardClass()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">Tréninkový kalendář</h3>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-ew-border px-2 py-1 text-xs"
              onClick={() =>
                setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
              }
            >
              ←
            </button>
            <span className="text-sm capitalize text-zinc-200">
              {calendarMonth.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              className="rounded border border-ew-border px-2 py-1 text-xs"
              onClick={() =>
                setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
              }
            >
              →
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-zinc-500">
          {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthCells(calendarMonth).map((cell) => {
            if (cell.day == null) return <div key={cell.key} />;
            const dayState = calendar[cell.key];
            const rawDay = state.calendar[cell.key];
            const meta = dayState ? CALENDAR_DAY_META[dayState.status] : null;
            const coachPlanned = Boolean(rawDay?.coachPlanId && state.coachWeeklyPlan?.approvedAt);
            const coachDone = isCoachDayConfirmed(rawDay, trainingDates.has(cell.key));
            return (
              <button
                key={cell.key}
                type="button"
                title={
                  coachPlanned
                    ? coachDone
                      ? "Plán potvrzen"
                      : "Čeká na potvrzení (import nebo ručně)"
                    : dayState
                      ? meta?.label
                      : "Klikni pro stav"
                }
                onClick={() => setCalendarDialog(cell.key)}
                className="relative flex h-9 flex-col items-center justify-center rounded text-xs"
                style={{
                  background: meta ? `${meta.color}33` : "transparent",
                  border: `1px solid ${meta?.color ?? "#334155"}`,
                }}
              >
                <span>{cell.day}</span>
                <div className="flex items-center gap-0.5">
                  {meta && <span className="text-[9px]">{meta.icon}</span>}
                  {coachPlanned && (
                    <span className={`text-[9px] ${coachDone ? "text-emerald-400" : "text-amber-400"}`}>
                      {coachDone ? "✓" : "☐"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          {Object.entries(monthStats).map(([status, count]) => (
            <span key={status} className="rounded bg-ew-bg px-2 py-1 text-zinc-400">
              {CALENDAR_DAY_META[status as CalendarDayStatus]?.label ?? status}: {count}
            </span>
          ))}
          {state.coachWeeklyPlan?.approvedAt && (
            <span className="rounded bg-violet-950/40 px-2 py-1 text-violet-300">
              ☐ čeká · ✓ potvrzeno (plán týdne)
            </span>
          )}
        </div>
      </section>

      {calendarDialog && (() => {
        const rawDay = state.calendar[calendarDialog];
        const session = sessionsByDate.get(calendarDialog);
        const coachPlanned = Boolean(rawDay?.coachPlanId && state.coachWeeklyPlan?.approvedAt);
        const coachDone = isCoachDayConfirmed(rawDay, Boolean(session));
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className={`${cardClass()} max-w-sm w-full`}>
              <h4 className="font-semibold text-white">Den {calendarDialog}</h4>

              {coachPlanned && (
                <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-950/20 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-violet-300">Plán AI trenéra</p>
                  <p className="mt-2 text-zinc-300">{rawDay?.reason ?? "—"}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Stav: {coachDone ? "✓ potvrzeno" : "☐ čeká na import / potvrzení"}
                  </p>
                  {session && (
                    <p className="mt-1 text-xs text-emerald-400/90">
                      Import / trénink: {session.sportType} · {session.durationMin} min
                      {session.title ? ` · ${session.title}` : ""}
                    </p>
                  )}
                  {!coachDone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href="/imports"
                        className="rounded border border-ew-border px-2 py-1 text-xs text-zinc-300 hover:bg-ew-bg"
                        onClick={() => setCalendarDialog(null)}
                      >
                        Importovat trénink
                      </Link>
                      <button
                        type="button"
                        className="rounded bg-emerald-800 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        onClick={() => void confirmCoachDay(calendarDialog)}
                      >
                        Potvrdit ručně
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 grid gap-2">
                {(Object.keys(CALENDAR_DAY_META) as CalendarDayStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="rounded-lg border border-ew-border px-3 py-2 text-left text-sm hover:bg-ew-bg"
                    onClick={() => setCalendarDay(calendarDialog, { status })}
                  >
                    {CALENDAR_DAY_META[status].icon} {CALENDAR_DAY_META[status].label}
                  </button>
                ))}
                <button
                  type="button"
                  className="text-xs text-zinc-500"
                  onClick={() => setCalendarDialog(null)}
                >
                  Zavřít
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Body & mind */}
      <section className="grid gap-4 lg:grid-cols-2">
        <BodyMindCard
          title="Otužování"
          sessionCount={state.coldSessions.length}
          totalMin={coldTotalMin}
          trend={coldTrend}
          onAdd={(type, durationMin) =>
            addColdSession({
              sessionAt: new Date().toISOString(),
              type,
              durationMin,
            })
          }
          types={[
            { id: "shower" as const, label: "Studená sprcha" },
            { id: "ice_bath" as const, label: "Ledová vana" },
            { id: "open_water" as const, label: "Voda (moře/jezero)" },
          ]}
        />
        <BodyMindCard
          title="Meditace & psychologická příprava"
          sessionCount={state.meditationSessions.length}
          totalMin={medTotalMin}
          trend={medTrend}
          onAdd={(_, durationMin, exerciseType) =>
            addMeditationSession({
              sessionAt: new Date().toISOString(),
              exerciseType: exerciseType || "Meditace",
              durationMin,
            })
          }
          types={[{ id: "med", label: "Meditace" }]}
          showExerciseInput
        />
      </section>

      <section className={cardClass()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-100">HRV trend</h3>
            <p className="mt-1 text-xs text-zinc-500">Posledních 7 dní — vstup pro AI trenéra.</p>
          </div>
          <Link href="/body-metrics#hrv" className="text-xs text-ew-blue-light underline">
            Spravovat HRV
          </Link>
        </div>
        <p className="mt-3 text-2xl font-semibold capitalize text-zinc-100">{hrvTrend.coachLabel}</p>
        <p className="mt-1 text-sm text-zinc-400">
          {hrvTrend.daysInWindow}/7 dní s daty
          {hrvTrend.avg7d != null ? ` · průměr ${hrvTrend.avg7d} ms` : ""}
          {hrvTrend.latestMs != null ? ` · poslední ${hrvTrend.latestMs} ms` : ""}
        </p>
      </section>

      <CoachCheckInPanel lastCheckIn={state.coachCheckIn} onSave={saveCoachCheckIn} />

      <CoachPlanPanel
        lastCheckIn={state.coachCheckIn}
        weeklyPlan={state.coachWeeklyPlan}
        useSupabase={useSupabase}
        onStateChange={setState}
      />

      {/* Data challenges */}
      {challenges.length > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4">
          <h3 className="font-semibold text-amber-100">Doplň chybějící data</h3>
          <ul className="mt-3 space-y-2">
            {challenges.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-amber-50/90">{c.label}</span>
                <Link href={c.href} className="rounded bg-amber-600/80 px-3 py-1 text-xs text-white hover:bg-amber-500">
                  Doplnit
                </Link>
              </li>
            ))}
          </ul>
          <MetricsInlineForm metrics={settings.athleteMetrics} onSave={(athleteMetrics) => updateSettings({ athleteMetrics })} />
        </section>
      )}

      {/* Info accordion */}
      <section className={cardClass()}>
        <h3 className="font-semibold text-zinc-100">Co je Ironman</h3>
        {[
          {
            id: "1406",
            title: "Ironman 140.6",
            body: "Plný Ironman = 3,8 km plavání + 180 km kolo + 42,2 km běh. Časový limit 17 hodin. Motto: Anything is Possible.",
          },
          {
            id: "703",
            title: "Ironman 70.3",
            body: "1,9 km plavání + 90 km kolo + 21,1 km běh. Limit 8,5 h. Ideální první závod nebo kvalifikace.",
          },
          {
            id: "mallorca",
            title: "Ironman 70.3 Mallorca",
            body: "Mallorca, Španělsko · cíl 24. 7. 2028 · Středozemní moře, Serra de Tramuntana.",
            link: "https://www.ironman.com/im703-mallorca",
          },
          {
            id: "thun",
            title: "Ironman Switzerland — Thun",
            body: "Thun · cíl 24. 7. 2030 · Thunersee, Alpy (+2200 m), historické centrum.",
            link: "https://www.ironman.com/im-switzerland",
          },
        ].map((block) => (
          <div key={block.id} className="mt-2 border-t border-ew-border pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-200"
              onClick={() => setOpenInfo(openInfo === block.id ? null : block.id)}
            >
              {block.title}
              <span>{openInfo === block.id ? "−" : "+"}</span>
            </button>
            {openInfo === block.id && (
              <p className="mt-2 text-sm text-zinc-400">
                {block.body}
                {"link" in block && block.link && (
                  <>
                    {" "}
                    <a href={block.link} className="text-ew-blue-light hover:underline" target="_blank" rel="noreferrer">
                      Oficiální stránka
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        ))}
      </section>

    </div>
  );
}

function MetricsInlineForm({
  metrics,
  onSave,
}: {
  metrics: IronMan2030Settings["athleteMetrics"];
  onSave: (m: IronMan2030Settings["athleteMetrics"]) => void;
}) {
  const [vo2, setVo2] = useState(String(metrics.vo2Max ?? ""));
  const [ftp, setFtp] = useState(String(metrics.ftpWatts ?? ""));
  const [swim, setSwim] = useState(String(metrics.swim100mSec ?? ""));
  const [carbs, setCarbs] = useState(String(metrics.carbsPerHour ?? ""));
  return (
    <form
      className="mt-4 grid gap-2 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          vo2Max: Number(vo2) || undefined,
          ftpWatts: Number(ftp) || undefined,
          swim100mSec: Number(swim) || undefined,
          carbsPerHour: Number(carbs) || undefined,
        });
      }}
    >
      <input className={formInputClass} placeholder="VO₂ Max" value={vo2} onChange={(e) => setVo2(e.target.value)} />
      <input className={formInputClass} placeholder="FTP (W)" value={ftp} onChange={(e) => setFtp(e.target.value)} />
      <input className={formInputClass} placeholder="Plavání 100 m (s)" value={swim} onChange={(e) => setSwim(e.target.value)} />
      <input className={formInputClass} placeholder="Sacharidy g/h" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
      <button type="submit" className="sm:col-span-2 rounded bg-ew-blue px-3 py-2 text-xs text-white">
        Uložit metriky zde
      </button>
    </form>
  );
}

function BodyMindCard({
  title,
  sessionCount,
  totalMin,
  trend,
  onAdd,
  types,
  showExerciseInput,
}: {
  title: string;
  sessionCount: number;
  totalMin: number;
  trend: number[];
  onAdd: (
    type: "shower" | "ice_bath" | "open_water",
    durationMin: number,
    exerciseType?: string,
  ) => void;
  types: { id: "shower" | "ice_bath" | "open_water" | "med"; label: string }[];
  showExerciseInput?: boolean;
}) {
  const [duration, setDuration] = useState("5");
  const [type, setType] = useState<"shower" | "ice_bath" | "open_water">("shower");
  const [exercise, setExercise] = useState("Meditace");

  return (
    <div className={cardClass()}>
      <h3 className="font-semibold text-zinc-100">{title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-ew-muted">Sessions</p>
          <p className="text-xl font-bold">{sessionCount}</p>
        </div>
        <div>
          <p className="text-xs text-ew-muted">Celkový čas</p>
          <p className="text-xl font-bold">{totalMin} min</p>
        </div>
      </div>
      <MiniWeekBars values={trend} label="Týdenní trend (8 týdnů)" />
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Math.max(1, Number(duration) || 5);
          if (showExerciseInput) onAdd("shower", d, exercise);
          else onAdd(type, d);
        }}
      >
        {!showExerciseInput && (
          <select className={formInputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        )}
        {showExerciseInput && (
          <input className={formInputClass} value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Typ cvičení" />
        )}
        <input type="number" className={`${formInputClass} w-20`} value={duration} onChange={(e) => setDuration(e.target.value)} />
        <button type="submit" className="rounded bg-ew-blue px-3 py-2 text-xs text-white">
          Zapsat
        </button>
      </form>
    </div>
  );
}
