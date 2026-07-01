import type { LiveWodKey } from "@/lib/live-workout/wod-definitions";
import type { LiveSportCategory } from "@/lib/types";

const STORAGE_KEY = "fitdenik.liveWorkoutLogs.v1";

export type LiveWorkoutLogEntry = {
  id: string;
  userId: string;
  createdAt: string;
  sportCategory: LiveSportCategory;
  wodKey?: LiveWodKey;
  wodName: string;
  durationSec: number;
  repsCompleted: number;
  /** U AMRAP / obecného Open bez pevného cíle může být 0 (viz živý trénink). */
  repsTarget: number;
  notes?: string;
  /** Vlastní váhy / škálování zadané při živém tréninku (CrossFit). */
  loadUsed?: string;
  /** Propojení se záznamem v Trénink (import z Kondice / Apple Fitness). */
  linkedTrainingSessionId?: string;
};

export function readLiveWorkoutLogs(): LiveWorkoutLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LiveWorkoutLogEntry[];
  } catch {
    return [];
  }
}

export function saveLiveWorkoutLog(
  input: Omit<LiveWorkoutLogEntry, "id" | "createdAt" | "userId"> & { userId?: string },
): LiveWorkoutLogEntry {
  const entry: LiveWorkoutLogEntry = {
    ...input,
    id: crypto.randomUUID(),
    userId: input.userId ?? "u1",
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...readLiveWorkoutLogs()].slice(0, 40);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function findLiveWorkoutById(id: string): LiveWorkoutLogEntry | null {
  return readLiveWorkoutLogs().find((e) => e.id === id) ?? null;
}

/** Propojí jeden nebo více živých tréninků se záznamem v deníku (localStorage). */
export function linkLiveWorkoutsToTrainingSession(
  liveWorkoutIds: string[],
  trainingSessionId: string,
): void {
  if (typeof window === "undefined") return;
  const idSet = new Set(liveWorkoutIds.filter(Boolean));
  if (idSet.size === 0) return;
  const logs = readLiveWorkoutLogs();
  const next = logs.map((e) => (idSet.has(e.id) ? { ...e, linkedTrainingSessionId: trainingSessionId } : e));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** @deprecated Použij linkLiveWorkoutsToTrainingSession — zachováno pro jednoduché volání. */
export function linkLiveWorkoutToTrainingSession(liveWorkoutId: string, trainingSessionId: string): void {
  linkLiveWorkoutsToTrainingSession([liveWorkoutId], trainingSessionId);
}
