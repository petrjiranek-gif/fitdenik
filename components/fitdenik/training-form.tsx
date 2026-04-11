"use client";

import { useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { SportType, TrainingSession } from "@/lib/types";
import { formInputClass } from "@/components/fitdenik/form-fields";

/** Formulář pro zápis nového tréninku (stránka /training/new). */
export function TrainingSessionCreateForm() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [title, setTitle] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [sportType, setSportType] = useState<SportType>("CrossFit");
  const [durationMin, setDurationMin] = useState(45);
  const [calories, setCalories] = useState(350);
  const [distanceKm, setDistanceKm] = useState(0);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sports = useMemo<SportType[]>(
    () => ["CrossFit", "Bodybuilding", "Cycling", "Walking", "Scooter", "Skiing", "Nordic walking"],
    [],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
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

    try {
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
      } else {
        repositories.training.create({
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
      }
      setTitle("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="grid gap-3 rounded-xl border border-ew-border bg-ew-panel p-4 md:grid-cols-3">
      <div className="md:col-span-3">
        <h3 className="text-base font-semibold text-zinc-100">Zapsat trénink</h3>
        <p className="text-xs text-zinc-500">
          Po uložení uvidíš záznam v přehledu na záložce Trénink.
        </p>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-zinc-400">Název tréninku</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Např. Karen / Push day / Ranní kolo"
          className={formInputClass}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-zinc-400">Datum</span>
        <input
          type="date"
          value={trainingDate}
          onChange={(e) => setTrainingDate(e.target.value)}
          className={formInputClass}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-zinc-400">Sport</span>
        <select
          value={sportType}
          onChange={(e) => setSportType(e.target.value as SportType)}
          className={formInputClass}
        >
          {sports.map((s) => (
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
        <input
          type="number"
          value={calories}
          onChange={(e) => setCalories(Number(e.target.value))}
          className={formInputClass}
        />
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
      <label className="grid gap-1 text-sm md:col-span-2">
        <span className="text-zinc-400">Poznámka</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jak ses cítil, scaling, tempo…"
          className={formInputClass}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark disabled:opacity-60 md:col-span-3"
      >
        {saving ? "Ukládám…" : "Uložit trénink"}
      </button>
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200 md:col-span-3">
          {errorMessage}
        </div>
      )}
    </form>
  );
}

/** @deprecated Použij TrainingSessionCreateForm; alias pro staré importy. */
export const TrainingLog = TrainingSessionCreateForm;
