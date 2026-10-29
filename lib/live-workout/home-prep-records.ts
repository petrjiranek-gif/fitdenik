import { MOVEMENT_STANDARD_LABELS, type MovementStandard } from "@/lib/live-workout/home-prep-standards";
import type { LiveWorkoutLogEntry } from "@/lib/live-workout/persist-log";
import { LIVE_WODS, type LiveWodKey } from "@/lib/live-workout/wod-definitions";

const OWN_PR_KEYS = new Set<string>([
  "open_12_1",
  "home_burpee_60",
  "home_karen_legs",
  "home_double_karen_legs",
  "home_2500_333",
]);

export type HomePrepRecord = {
  wodKey: string;
  wodName: string;
  movementStandard: MovementStandard;
  standardLabel: string;
  reps: number;
  durationSec: number;
  date: string;
  id: string;
};

export function isOwnBenchmarkKey(wodKey: string | undefined): boolean {
  return Boolean(wodKey && OWN_PR_KEYS.has(wodKey));
}

export function isHomeSessionCompleteEligible(
  wodKey: string | undefined,
  repsCompleted: number,
  durationSec: number,
): boolean {
  if (!wodKey) return false;
  if (wodKey === "home_karen_legs") return repsCompleted >= 150;
  if (wodKey === "home_double_karen_legs") return repsCompleted >= 300;
  if (wodKey === "home_2500_333") return repsCompleted >= 2500 && durationSec <= 3 * 3600 + 33 * 60;
  if (wodKey === "home_burpee_60") return durationSec >= 60 * 60;
  if (wodKey === "open_12_1") return durationSec >= 7 * 60;
  if (wodKey === "home_circuit_6min" || wodKey === "home_circuit_carving") return durationSec >= 18 * 60;
  return false;
}

/** Osobní rekord jen z dokončených pokusů se stejným standardem. Částečné se ignorují. */
export function ownPersonalRecords(logs: LiveWorkoutLogEntry[]): HomePrepRecord[] {
  const best = new Map<string, HomePrepRecord>();
  for (const entry of logs) {
    if (entry.completion !== "complete") continue;
    if (!entry.wodKey || !isOwnBenchmarkKey(entry.wodKey)) continue;
    const standard = entry.movementStandard;
    if (!standard) continue;
    const key = `${entry.wodKey}::${standard}`;
    const wodName = LIVE_WODS[entry.wodKey as LiveWodKey]?.name ?? entry.wodName;
    const candidate: HomePrepRecord = {
      wodKey: entry.wodKey,
      wodName,
      movementStandard: standard,
      standardLabel: MOVEMENT_STANDARD_LABELS[standard],
      reps: entry.repsCompleted,
      durationSec: entry.durationSec,
      date: entry.createdAt.slice(0, 10),
      id: entry.id,
    };
    const prev = best.get(key);
    if (!prev || isBetterOwnRecord(candidate, prev)) {
      best.set(key, candidate);
    }
  }
  return [...best.values()].sort((a, b) => a.wodName.localeCompare(b.wodName, "cs"));
}

function isBetterOwnRecord(next: HomePrepRecord, prev: HomePrepRecord): boolean {
  const forTime = next.wodKey === "home_karen_legs" || next.wodKey === "home_double_karen_legs" || next.wodKey === "home_2500_333";
  if (forTime) {
    if (next.reps !== prev.reps) return next.reps > prev.reps;
    return next.durationSec > 0 && (prev.durationSec === 0 || next.durationSec < prev.durationSec);
  }
  if (next.reps !== prev.reps) return next.reps > prev.reps;
  return false;
}
