"use client";

import Link from "next/link";
import type { LiveWorkoutLogEntry } from "@/lib/live-workout/persist-log";
import { formatLiveWorkoutDuration } from "@/lib/live-workout/training-link";

const SPORT_LABELS: Record<string, string> = {
  crossfit: "CrossFit",
  hyrox: "HYROX",
  bodybuilding: "Bodybuilding",
  bodyweight: "Bodyweight",
};

export function LiveWorkoutDetailModal({
  entry,
  onClose,
}: {
  entry: LiveWorkoutLogEntry;
  onClose: () => void;
}) {
  const sportLabel = SPORT_LABELS[entry.sportCategory] ?? entry.sportCategory;
  const repsLine =
    entry.repsTarget > 0 && entry.repsTarget < 9000
      ? `${entry.repsCompleted} / ${entry.repsTarget} opakování`
      : `${entry.repsCompleted} opakování`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="live-workout-detail-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-ew-border bg-ew-bg p-4 shadow-xl">
        <h3 id="live-workout-detail-title" className="text-lg font-semibold text-white">
          Živý trénink z aplikace
        </h3>
        <p className="mt-1 text-sm text-zinc-400">{new Date(entry.createdAt).toLocaleString("cs-CZ")}</p>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">WOD / session</dt>
            <dd className="mt-0.5 font-semibold text-zinc-100">{entry.wodName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Typ</dt>
            <dd className="mt-0.5 text-zinc-200">{sportLabel}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Čas</dt>
              <dd className="mt-0.5 font-mono text-lg text-white tabular-nums">
                {formatLiveWorkoutDuration(entry.durationSec)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Opakování</dt>
              <dd className="mt-0.5 font-mono text-lg text-white tabular-nums">{repsLine}</dd>
            </div>
          </div>
          {entry.loadUsed ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Váhy / škálování</dt>
              <dd className="mt-0.5 text-zinc-200">{entry.loadUsed}</dd>
            </div>
          ) : null}
          {entry.notes ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Detail z živého tréninku</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-ew-border bg-ew-panel px-3 py-2 text-zinc-300 leading-snug">
                {entry.notes}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-ew-border pt-4">
          <Link
            href="/training/live"
            className="rounded-md border border-ew-border px-3 py-2 text-sm text-ew-blue-light hover:border-ew-blue-light"
          >
            Otevřít živý trénink
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-ew-blue px-4 py-2 text-sm text-white hover:bg-ew-blue-dark"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
