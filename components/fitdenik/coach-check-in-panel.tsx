"use client";

import { useState } from "react";
import { formInputClass } from "@/components/fitdenik/form-fields";
import {
  CHECKIN_EQUIPMENT_PRESETS,
  CHECKIN_FEELING_PRESETS,
  CHECKIN_LIMITATION_PRESETS,
  CHECKIN_PRIORITY_PRESETS,
  createCoachCheckIn,
  isCheckInFresh,
} from "@/lib/iron-man-2030/coach-check-in";
import type { IronManCoachCheckIn } from "@/lib/iron-man-2030/types";

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs ${
        selected
          ? "border-ew-blue-light bg-ew-blue/20 text-white"
          : "border-ew-border text-zinc-400 hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

export function CoachCheckInPanel({
  lastCheckIn,
  onSave,
}: {
  lastCheckIn: IronManCoachCheckIn | null | undefined;
  onSave: (checkIn: IronManCoachCheckIn) => void;
}) {
  const [feeling, setFeeling] = useState(lastCheckIn?.feeling ?? "");
  const [limitations, setLimitations] = useState(lastCheckIn?.limitations ?? "");
  const [equipment, setEquipment] = useState(lastCheckIn?.equipment ?? "");
  const [priority, setPriority] = useState(lastCheckIn?.priority ?? "");
  const [comment, setComment] = useState(lastCheckIn?.comment ?? "");
  const [savedFlash, setSavedFlash] = useState(false);

  const togglePreset = (current: string, value: string, set: (v: string) => void) => {
    const parts = current
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.includes(value)) {
      set(parts.filter((p) => p !== value).join(", "));
    } else {
      set([...parts, value].join(", "));
    }
  };

  const hasPreset = (current: string, value: string) =>
    current
      .split(",")
      .map((p) => p.trim())
      .includes(value);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeling.trim() || !priority.trim()) return;
    const entry = createCoachCheckIn({
      feeling: feeling.trim(),
      limitations: limitations.trim() || "Žádná omezení",
      equipment: equipment.trim() || "—",
      priority: priority.trim(),
      comment: comment.trim() || undefined,
    });
    onSave(entry);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2500);
  };

  const fresh = isCheckInFresh(lastCheckIn);

  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-950/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-violet-100">AI Trenér — check-in týdne</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Jak se cítíš a co je reálné tento týden? Data použije trenér při generování plánu (krok 4–5).
          </p>
        </div>
        {lastCheckIn && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              fresh ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700/50 text-zinc-400"
            }`}
          >
            {fresh ? "Aktuální" : "Zastaralý"} ·{" "}
            {new Date(lastCheckIn.createdAt).toLocaleString("cs-CZ", {
              day: "numeric",
              month: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">1. Fyzický stav *</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHECKIN_FEELING_PRESETS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={hasPreset(feeling, p)}
                onClick={() => togglePreset(feeling, p, setFeeling)}
              />
            ))}
          </div>
          <input
            type="text"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            placeholder="např. Dobře, mírná únava v nohách"
            className={formInputClass}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">2. Omezení</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHECKIN_LIMITATION_PRESETS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={hasPreset(limitations, p)}
                onClick={() => togglePreset(limitations, p, setLimitations)}
              />
            ))}
          </div>
          <input
            type="text"
            value={limitations}
            onChange={(e) => setLimitations(e.target.value)}
            placeholder="např. Cestování St–Čt, hotel bez bazénu"
            className={formInputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">3. Dostupné vybavení</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHECKIN_EQUIPMENT_PRESETS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={hasPreset(equipment, p)}
                onClick={() => togglePreset(equipment, p, setEquipment)}
              />
            ))}
          </div>
          <input
            type="text"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            placeholder="např. Gumy, vlastní váha, běžecká obuv"
            className={formInputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">4. Priorita týdne *</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {CHECKIN_PRIORITY_PRESETS.map((p) => (
              <Chip
                key={p}
                label={p}
                selected={priority === p}
                onClick={() => setPriority(p)}
              />
            ))}
          </div>
          <input
            type="text"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="např. Spalování"
            className={formInputClass}
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">5. Komentář (volitelné)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Cokoli navíc pro trenéra…"
            className={formInputClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600"
          >
            Uložit check-in
          </button>
          {savedFlash && <span className="text-sm text-emerald-400">Check-in uložen.</span>}
        </div>
      </form>

      {lastCheckIn && (
        <div className="mt-4 rounded-lg border border-ew-border/60 bg-ew-bg/50 p-3 text-xs text-zinc-400">
          <p className="font-medium text-zinc-300">Poslední check-in</p>
          <p className="mt-1">Stav: {lastCheckIn.feeling}</p>
          <p>Omezení: {lastCheckIn.limitations}</p>
          <p>Vybavení: {lastCheckIn.equipment}</p>
          <p>Priorita: {lastCheckIn.priority}</p>
          {lastCheckIn.comment ? <p>Komentář: {lastCheckIn.comment}</p> : null}
        </div>
      )}

    </section>
  );
}
