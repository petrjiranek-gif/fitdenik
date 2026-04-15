"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import { coerceSportType, SPORT_TYPE_OPTIONS } from "@/lib/sport-type";
import type { SportType, TrainingSession } from "@/lib/types";
import { formInputClass } from "@/components/fitdenik/form-fields";

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

function kcalPerMin(s: TrainingSession): number {
  if (s.durationMin <= 0) return 0;
  return s.calories / s.durationMin;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function addDays(d: Date, delta: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + delta);
  return out;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("cs-CZ", { month: "long", year: "numeric" });
}

function weekdayShortLabel(indexMondayFirst: number): string {
  const base = new Date(2025, 0, 6 + indexMondayFirst); // 2025-01-06 = pondělí
  return base.toLocaleDateString("cs-CZ", { weekday: "short" });
}

function SportPieChart({ bySport }: { bySport: { sport: string; count: number }[] }) {
  const total = bySport.reduce((a, b) => a + b.count, 0) || 1;
  let acc = 0;
  const parts = bySport.map((row, i) => {
    const pct = (row.count / total) * 100;
    const start = acc;
    acc += pct;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${acc}%`;
  });
  const gradient = parts.length ? `conic-gradient(${parts.join(", ")})` : "conic-gradient(#334155 0% 100%)";

  if (bySport.length === 0) {
    return <p className="text-sm text-ew-muted">Zatím žádné tréninky — nic k zobrazení.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="h-40 w-40 shrink-0 rounded-full border border-ew-border shadow-inner"
        style={{ background: gradient }}
        role="img"
        aria-label="Rozložení tréninků podle sportu"
      />
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {bySport.map((row, i) => (
          <li key={row.sport} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-zinc-300">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                aria-hidden
              />
              {row.sport}
            </span>
            <span className="text-ew-muted">
              {row.count}× ({Math.round((row.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrainingOverview() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [sessions, setSessions] = useState<TrainingSession[]>(() =>
    useSupabase ? [] : repositories.training.list(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarSportFilter, setCalendarSportFilter] = useState<string>("vše");

  const reloadLocal = useCallback(() => {
    if (!useSupabase) setSessions(repositories.training.list());
  }, [repositories, useSupabase]);

  const refreshRemoteSessions = useCallback(async () => {
    const res = await fetch("/api/training", { cache: "no-store" });
    if (!res.ok) return;
    const j = (await res.json()) as { sessions: TrainingSession[] };
    setSessions(j.sessions);
  }, []);

  useEffect(() => {
    if (!useSupabase) return;
    let mounted = true;
    void fetch("/api/training")
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          if (mounted) setErrorMessage(j.error ?? "Nepodařilo se načíst tréninky.");
          return;
        }
        const j = (await res.json()) as { sessions: TrainingSession[] };
        if (mounted) {
          setSessions(j.sessions);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (mounted) setErrorMessage("Nepodařilo se načíst tréninky.");
      });
    return () => {
      mounted = false;
    };
  }, [useSupabase]);

  const sorted = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const at = new Date(`${a.date}T00:00:00`).getTime();
        const bt = new Date(`${b.date}T00:00:00`).getTime();
        return bt - at;
      }),
    [sessions],
  );

  useEffect(() => {
    if (!selectedDate && sorted.length > 0) {
      setSelectedDate(sorted[0].date);
    }
  }, [selectedDate, sorted]);

  const stats = useMemo(() => {
    const bySportMap = new Map<string, number>();
    let totalMin = 0;
    let totalKcal = 0;
    for (const s of sessions) {
      bySportMap.set(s.sportType, (bySportMap.get(s.sportType) ?? 0) + 1);
      totalMin += s.durationMin;
      totalKcal += s.calories;
    }
    const bySport = [...bySportMap.entries()]
      .map(([sport, count]) => ({ sport, count }))
      .sort((a, b) => b.count - a.count);
    return {
      count: sessions.length,
      totalMin,
      totalKcal,
      bySport,
    };
  }, [sessions]);

  const topEfficiency = useMemo(() => {
    return [...sessions]
      .filter((s) => s.durationMin > 0 && s.calories > 0)
      .map((s) => ({ s, kpm: kcalPerMin(s) }))
      .sort((a, b) => b.kpm - a.kpm)
      .slice(0, 8);
  }, [sessions]);

  const calendarSessions = useMemo(
    () => sessions.filter((s) => calendarSportFilter === "vše" || s.sportType === calendarSportFilter),
    [sessions, calendarSportFilter],
  );

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, TrainingSession[]>();
    for (const s of calendarSessions) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [calendarSessions]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const dayShiftMondayFirst = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - dayShiftMondayFirst);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = toDateKey(date);
      return {
        date,
        key,
        inCurrentMonth: date.getMonth() === month,
        count: sessionsByDate.get(key)?.length ?? 0,
      };
    });
  }, [calendarMonth, sessionsByDate]);

  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    return [...(sessionsByDate.get(selectedDate) ?? [])].sort((a, b) => a.title.localeCompare(b.title, "cs-CZ"));
  }, [selectedDate, sessionsByDate]);

  const streakStats = useMemo(() => {
    const dayKeys = [...sessionsByDate.keys()].sort((a, b) => dateKeyToDate(a).getTime() - dateKeyToDate(b).getTime());
    if (dayKeys.length === 0) return { current: 0, best: 0 };

    const daySet = new Set(dayKeys);
    let best = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of dayKeys) {
      const d = dateKeyToDate(k);
      if (!prev) {
        run = 1;
      } else {
        const expected = toDateKey(addDays(prev, 1));
        run = expected === k ? run + 1 : 1;
      }
      if (run > best) best = run;
      prev = d;
    }

    let current = 0;
    const today = new Date();
    let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (daySet.has(toDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
    return { current, best };
  }, [sessionsByDate]);

  const onDelete = async (id: string) => {
    if (!confirm("Opravdu smazat tento trénink?")) return;
    setDeletingId(id);
    setErrorMessage(null);
    if (useSupabase) {
      const res = await fetch(`/api/training?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setErrorMessage(j.error ?? "Smazání se nezdařilo.");
        setDeletingId(null);
        return;
      }
      setSessions((prev) => prev.filter((x) => x.id !== id));
    } else {
      repositories.training.delete(id);
      reloadLocal();
    }
    setDeletingId(null);
  };

  const applySessionToList = (updated: TrainingSession) => {
    setSessions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Přehled všech zapsaných tréninků. Nový záznam přidáš na stránce{" "}
          <Link href="/training/new" className="font-medium text-ew-blue-light hover:underline">
            Nový trénink
          </Link>
          .
        </p>
        <Link
          href="/training/new"
          className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:border-ew-blue-light"
        >
          Zapsat trénink
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">{errorMessage}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <p className="text-xs text-ew-muted">Tréninků celkem</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.count}</p>
        </div>
        <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <p className="text-xs text-ew-muted">Součet času</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.totalMin} min</p>
        </div>
        <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <p className="text-xs text-ew-muted">Součet kalorií</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.totalKcal} kcal</p>
        </div>
      </div>

      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-3 text-base font-semibold text-zinc-100">Rozložení podle sportu</h3>
        <SportPieChart bySport={stats.bySport} />
      </section>

      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-1 text-base font-semibold text-zinc-100">Nejvyšší výkon — kalorie za minutu</h3>
        <p className="mb-3 text-xs text-ew-muted">
          Poměr kalorií k délce tréninku (vyšší = v daném čase víc „spáleno“). Jen záznamy s kaloriemi a délkou &gt; 0.
        </p>
        {topEfficiency.length === 0 ? (
          <p className="text-sm text-ew-muted">Žádné vhodné záznamy.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {topEfficiency.map(({ s, kpm }, i) => (
              <li
                key={`${s.id}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-ew-border/60 py-2 last:border-0"
              >
                <span className="text-zinc-300">
                  {s.date} · {s.title} ({s.sportType})
                </span>
                <span className="font-medium text-ew-accent">{kpm.toFixed(1)} kcal/min</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Kalendář tréninků</h3>
            <p className="text-xs text-ew-muted">Dny s tréninkem jsou zvýrazněné. Klikni na den pro detail.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded-md border border-ew-border px-3 py-1.5 text-sm text-zinc-300 hover:bg-ew-bg"
            >
              ←
            </button>
            <span className="min-w-36 text-center text-sm font-medium text-zinc-200 capitalize">{monthLabel(calendarMonth)}</span>
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded-md border border-ew-border px-3 py-1.5 text-sm text-zinc-300 hover:bg-ew-bg"
            >
              →
            </button>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="text-xs text-ew-muted">Filtr sportu:</span>
            <select
              value={calendarSportFilter}
              onChange={(e) => setCalendarSportFilter(e.target.value)}
              className="rounded-md border border-ew-border bg-ew-bg px-2 py-1.5 text-sm text-zinc-200"
            >
              <option value="vše">Vše</option>
              {SPORT_TYPE_OPTIONS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </label>
          <p className="rounded-md border border-ew-border bg-ew-bg px-2 py-1.5 text-xs text-zinc-300">
            Streak: <span className="font-semibold text-emerald-300">{streakStats.current} dní</span>
            {" · "}max: <span className="font-semibold text-zinc-200">{streakStats.best}</span>
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-ew-muted">
              {weekdayShortLabel(i)}
            </div>
          ))}
          {calendarCells.map((cell) => {
            const isSelected = selectedDate === cell.key;
            const intensityClass =
              cell.count >= 3
                ? "bg-emerald-500/30 text-emerald-100 border-emerald-400/40"
                : cell.count === 2
                  ? "bg-emerald-500/20 text-emerald-100 border-emerald-500/30"
                  : cell.count === 1
                    ? "bg-emerald-500/10 text-emerald-100 border-emerald-600/30"
                    : "bg-ew-bg text-zinc-500 border-ew-border";
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`relative h-10 rounded-md border text-sm transition ${intensityClass} ${
                  cell.inCurrentMonth ? "" : "opacity-45"
                } ${isSelected ? "ring-2 ring-ew-blue-light" : "hover:ring-1 hover:ring-ew-blue/40"}`}
                title={cell.count > 0 ? `${cell.key}: ${cell.count} trénink(y)` : `${cell.key}: bez tréninku`}
              >
                <span>{cell.date.getDate()}</span>
                {cell.count > 0 && (
                  <span className="absolute right-1 top-1 rounded bg-emerald-500/30 px-1 text-[10px] leading-none text-emerald-100">
                    {cell.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-ew-border bg-ew-bg p-3">
          <p className="text-xs font-medium text-zinc-300">
            {selectedDate ? `Detail dne ${selectedDate}` : "Vyber den v kalendáři"}
          </p>
          {selectedSessions.length === 0 ? (
            <p className="mt-2 text-sm text-ew-muted">V tento den není zapsaný žádný trénink.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {selectedSessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-ew-border/70 pb-2 last:border-0">
                  <span className="text-zinc-200">
                    {s.title} <span className="text-ew-muted">({s.sportType})</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-ew-muted">
                      {s.durationMin} min · {s.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveError(null);
                        setEditing(s);
                      }}
                      className="text-ew-blue-light hover:underline"
                    >
                      Upravit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-ew-border bg-ew-panel">
        <h3 className="border-b border-ew-border bg-ew-bg px-4 py-3 text-base font-semibold text-zinc-100">Všechny tréninky</h3>
        <div className="max-h-[min(28rem,70vh)] overflow-auto">
          <table className="w-full border-collapse bg-ew-bg text-sm">
            <thead className="sticky top-0 z-[1] bg-ew-bg text-left text-xs text-ew-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Datum</th>
                <th className="px-3 py-2 font-medium">Název</th>
                <th className="px-3 py-2 font-medium">Sport</th>
                <th className="px-3 py-2 font-medium">Čas</th>
                <th className="px-3 py-2 font-medium">kcal</th>
                <th className="px-3 py-2 font-medium">kcal/min</th>
                <th className="px-3 py-2 font-medium">Poznámka</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="bg-ew-bg">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-ew-muted">
                    Zatím nic v deníku.
                  </td>
                </tr>
              ) : (
                sorted.map((s) => (
                  <tr key={s.id} className="border-t border-ew-border bg-ew-bg text-zinc-300">
                    <td className="whitespace-nowrap px-3 py-2">{s.date}</td>
                    <td className="max-w-[10rem] truncate px-3 py-2">{s.title}</td>
                    <td className="px-3 py-2">{s.sportType}</td>
                    <td className="px-3 py-2">{s.durationMin} min</td>
                    <td className="px-3 py-2">{s.calories}</td>
                    <td className="px-3 py-2">{s.durationMin > 0 ? kcalPerMin(s).toFixed(1) : "—"}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2 text-ew-muted">{s.notes || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveError(null);
                          setEditing(s);
                        }}
                        className="mr-2 text-ew-blue-light hover:underline"
                      >
                        Upravit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(s.id)}
                        className="text-rose-400 hover:underline"
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? "…" : "Smazat"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <EditTrainingModal
          key={editing.id}
          session={editing}
          saving={saving}
          error={saveError}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            setSaving(true);
            setSaveError(null);
            try {
              if (useSupabase) {
                const res = await fetch("/api/training", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: editing.id, ...patch }),
                });
                if (!res.ok) {
                  const j = (await res.json()) as { error?: string };
                  setSaveError(j.error ?? "Uložení se nezdařilo.");
                  return;
                }
                await refreshRemoteSessions();
              } else {
                const updated = repositories.training.update(editing.id, patch);
                if (updated) applySessionToList(updated);
                reloadLocal();
              }
              setEditing(null);
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}

function EditTrainingModal({
  session,
  saving,
  error,
  onClose,
  onSave,
}: {
  session: TrainingSession;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (patch: Partial<Omit<TrainingSession, "id" | "userId">>) => void | Promise<void>;
}) {
  const [date, setDate] = useState(session.date);
  const [title, setTitle] = useState(session.title);
  const [sportType, setSportType] = useState(() => coerceSportType(session.sportType));
  const [durationMin, setDurationMin] = useState(session.durationMin);
  const [calories, setCalories] = useState(session.calories);
  const [distanceKm, setDistanceKm] = useState(session.distanceKm);
  const [notes, setNotes] = useState(session.notes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ew-border bg-ew-panel p-4 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Upravit trénink</h3>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void onSave({
              date,
              title,
              sportType,
              durationMin,
              calories,
              distanceKm,
              notes,
            });
          }}
        >
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={formInputClass} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Název</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={formInputClass} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Sport</span>
            <select value={sportType} onChange={(e) => setSportType(e.target.value as SportType)} className={formInputClass}>
              {SPORT_TYPE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Délka (min)</span>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className={formInputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Kalorie</span>
            <input type="number" value={calories} onChange={(e) => setCalories(Number(e.target.value))} className={formInputClass} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Vzdálenost (km)</span>
            <input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className={formInputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Poznámka / komentář</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={formInputClass} />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-ew-blue px-4 py-2 text-sm text-white hover:bg-ew-blue-dark disabled:opacity-50"
            >
              {saving ? "Ukládám…" : "Uložit"}
            </button>
            <button type="button" onClick={onClose} className="rounded-md border border-ew-border px-4 py-2 text-sm text-zinc-300">
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
