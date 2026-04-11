"use client";

import { useState } from "react";

export function WorkoutProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>
          {completed}/{total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-4 rounded-full bg-zinc-200">
        <div className="h-4 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function LiveWorkoutTimer() {
  return <div className="rounded-xl bg-zinc-900 p-4 text-center text-3xl font-bold text-white">12:47</div>;
}

export function RepCounterPad() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[1, 5, 10, 15].map((n) => (
        <button key={n} className="rounded-xl bg-blue-600 p-6 text-2xl font-bold text-white shadow hover:bg-blue-700">
          +{n}
        </button>
      ))}
      <button className="col-span-2 rounded-xl border border-zinc-300 p-4 font-medium sm:col-span-4">Vrátit poslední akci</button>
    </div>
  );
}

export function SetChecklist() {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4">
      {[1, 2, 3, 4].map((set) => (
        <label key={set} className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4" /> Série {set} dokončena
        </label>
      ))}
    </div>
  );
}

export function SplitHistoryList() {
  return (
    <ul className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm">
      <li>50 reps - 03:58</li>
      <li>100 reps - 08:43</li>
      <li>150 reps - 14:03</li>
    </ul>
  );
}

export function ExerciseStepTracker() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">Angie - kroky</h3>
      {["Pull-ups", "Push-ups", "Sit-ups", "Squats"].map((step) => (
        <div key={step} className="mb-2 flex items-center justify-between rounded-lg bg-zinc-50 p-2 text-sm">
          <span>{step}</span>
          <span>0/100</span>
        </div>
      ))}
    </div>
  );
}

export function FinishWorkoutSummary() {
  return (
    <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
      Trénink uložen. Výsledek: Karen 14:03, pacing stabilní.
    </div>
  );
}

export function LiveCounterDemo() {
  const [reps, setReps] = useState(70);
  return (
    <div className="space-y-4">
      <LiveWorkoutTimer />
      <WorkoutProgressBar completed={reps} total={150} />
      <RepCounterPad />
      <div className="flex gap-2">
        <button onClick={() => setReps((v) => Math.min(150, v + 1))} className="rounded-md border px-3 py-2 text-sm">
          +1 test
        </button>
        <button onClick={() => setReps((v) => Math.max(0, v - 1))} className="rounded-md border px-3 py-2 text-sm">
          -1 test
        </button>
      </div>
      <SplitHistoryList />
    </div>
  );
}

export function ScreenshotUploadCard() {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-white p-6">
      <p className="font-medium">Nahraj screenshot z Apple Fitness / Kondice</p>
      <p className="text-sm text-zinc-500">OCR zatím není aktivní. Zobrazí se parser-ready mock data k ruční úpravě.</p>
      <button className="mt-4 rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">Vybrat soubor</button>
    </div>
  );
}
