"use client";

import { useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { NutritionEntry } from "@/lib/types";

export function NutritionLog() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [entries, setEntries] = useState<NutritionEntry[]>(() =>
    useSupabase ? [] : repositories.nutrition.list(),
  );
  const [calories, setCalories] = useState(2200);
  const [protein, setProtein] = useState(170);
  const [carbs, setCarbs] = useState(230);
  const [fat, setFat] = useState(70);
  const [waterLiters, setWaterLiters] = useState(2.5);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!useSupabase) return;
    void fetch("/api/nutrition")
      .then(async (response) => {
        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          setErrorMessage(result.error ?? "Nepodařilo se načíst výživu ze serveru.");
          return;
        }
        const result = (await response.json()) as { entries: NutritionEntry[] };
        setEntries(result.entries);
      })
      .catch(() => {
        setErrorMessage("Nepodařilo se načíst výživu ze serveru.");
      });
  }, [useSupabase]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: Omit<NutritionEntry, "id"> = {
      userId: "u1",
      date: new Date().toISOString().slice(0, 10),
      calories,
      protein,
      carbs,
      fat,
      fiber: 30,
      waterLiters,
      bodyWeightKg: 85.5,
      notes,
    };

    if (useSupabase) {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setErrorMessage(result.error ?? "Nepodařilo se uložit výživu.");
        return;
      }
      const result = (await response.json()) as { entry: NutritionEntry };
      setEntries((prev) => [result.entry, ...prev]);
    } else {
      const created = repositories.nutrition.create({
        date: input.date,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        fiber: input.fiber,
        waterLiters: input.waterLiters,
        bodyWeightKg: input.bodyWeightKg,
        notes: input.notes,
      });
      setEntries((prev) => [created, ...prev]);
    }

    setNotes("");
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-ew-border bg-ew-panel p-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <h3 className="text-base font-semibold">Přidat denní výživu</h3>
          <p className="text-xs text-zinc-500">
            Zadej souhrn za den. Čísla jsou v kcal, gramech a litrech.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Kalorie (kcal)</span>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            placeholder="Např. 2200"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Bílkoviny (g)</span>
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            placeholder="Např. 170"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Sacharidy (g)</span>
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(Number(e.target.value))}
            placeholder="Např. 230"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Tuky (g)</span>
          <input
            type="number"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            placeholder="Např. 70"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Voda (litry)</span>
          <input
            type="number"
            step="0.1"
            value={waterLiters}
            onChange={(e) => setWaterLiters(Number(e.target.value))}
            placeholder="Např. 2.5"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-zinc-600">Poznámka</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Např. vyšší sacharidy po těžkém tréninku"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white md:col-span-3">Přidat výživu</button>
      </form>
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="mb-3 font-semibold">Poslední dny</h3>
        <div className="space-y-2 text-sm">
          {entries.slice(0, 8).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-zinc-900"
            >
              <span>{e.date}</span>
              <span>{e.calories} kcal / P {e.protein} g / S {e.carbs} g / T {e.fat} g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
