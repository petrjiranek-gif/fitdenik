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
  repsTarget: number;
  notes?: string;
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
