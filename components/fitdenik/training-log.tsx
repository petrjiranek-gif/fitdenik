"use client";

import { useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { SportType, TrainingSession } from "@/lib/types";

export function TrainingLog() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [sessions, setSessions] = useState<TrainingSession[]>(() =>
    useSupabase ? [] : repositories.training.list(),
  );
  const [title, setTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [sportType, setSportType] = useState<SportType>("CrossFit");
  const [durationMin, setDurationMin] = useState(45);
  const [calories, setCalories] = useState(350);
  const [distanceKm, setDistanceKm] = useState(0);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sports = useMemo<SportType[]>(
    () => ["CrossFit", "Bodybuilding", "Cycling", "Walking", "Scooter", "Skiing", "Nordic walking"],
    [],
  );

  useEffect(() => {
    if (!useSupabase) return;
    let mounted = true;

    async function loadSessions() {
      const response = await fetch("/api/training");
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        if (mounted) {
          setErrorMessage(result.error ?? "Nepodařilo se načíst tréninky ze serveru.");
        }
        return;
      }
      const result = (await response.json()) as { sessions: TrainingSession[] };
      if (mounted) {
        setSessions(result.sessions);
      }
    }

    void loadSessions();
    return () => {
      mounted = false;
    };
  }, [useSupabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: Omit<TrainingSession, "id"> = {
      userId: "u1",
      date: trainingDate,
      sportType,
      title: title || "Nový trénink",
      durationMin,
      distanceKm,
      avgHeartRate: 130,
      calories,
      elevation: 0,
      pace: "-",
      effort: "střední",
      rpe: 6,
      notes,
    };

    if (useSupabase) {
      const response = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setErrorMessage(result.error ?? "Nepodařilo se uložit trénink.");
        return;
      }

      const result = (await response.json()) as { session: TrainingSession };
      setSessions((prev) => sortSessionsByDateDesc([result.session, ...prev]));
    } else {
      const created = repositories.training.create({
        date: input.date,
        sportType: input.sportType,
        title: input.title,
        durationMin: input.durationMin,
        distanceKm: input.distanceKm,
        avgHeartRate: input.avgHeartRate,
        calories: input.calories,
        elevation: input.elevation,
        pace: input.pace,
        effort: input.effort,
        rpe: input.rpe,
        notes: input.notes,
      });
      setSessions((prev) => sortSessionsByDateDesc([created, ...prev]));
    }

    setTitle("");
    setNotes("");
    setErrorMessage(null);
  };

  const onDeleteSession = async (id: string) => {
    if (!confirm("Opravdu chceš tento trénink smazat?")) return;
    setDeletingId(id);
    setErrorMessage(null);

    if (useSupabase) {
      const response = await fetch(`/api/training?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setErrorMessage(result.error ?? "Nepodařilo se smazat trénink.");
        setDeletingId(null);
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeletingId(null);
      return;
    }

    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeletingId(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-ew-border bg-ew-panel p-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <h3 className="text-base font-semibold">Přidat nový trénink</h3>
          <p className="text-xs text-zinc-500">
            Vyplň základní údaje o tréninku. Povinné jsou název, sport a délka.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Název tréninku</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Např. Karen / Push day / Ranní kolo"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Datum</span>
          <input
            type="date"
            value={trainingDate}
            onChange={(e) => setTrainingDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Sport</span>
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value as SportType)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {sports.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Délka (min)</span>
          <input
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            placeholder="Např. 45"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Kalorie</span>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            placeholder="Např. 350"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Vzdálenost (km)</span>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            placeholder="Např. 5.2"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Poznámka</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jak ses cítil, scaling, tempo..."
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white md:col-span-3">Přidat trénink</button>
      </form>
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-3 font-semibold">Poslední tréninky</h3>
        <div className="space-y-2 text-sm">
          {sessions.slice(0, 8).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-zinc-50 p-2">
              <span>{s.date} - {s.title} ({s.sportType})</span>
              <div className="flex items-center gap-3">
                <span>{s.durationMin} min / {s.calories} kcal</span>
                <button
                  onClick={() => void onDeleteSession(s.id)}
                  className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? "Mažu..." : "Smazat"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function sortSessionsByDateDesc(sessions: TrainingSession[]): TrainingSession[] {
  return [...sessions].sort((a, b) => {
    const aTime = new Date(`${a.date}T00:00:00`).getTime();
    const bTime = new Date(`${b.date}T00:00:00`).getTime();
    return bTime - aTime;
  });
}
