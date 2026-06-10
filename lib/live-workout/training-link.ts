import type { LiveWorkoutLogEntry } from "@/lib/live-workout/persist-log";
import {
  findLiveWorkoutById,
  linkLiveWorkoutToTrainingSession,
  readLiveWorkoutLogs,
} from "@/lib/live-workout/persist-log";
import type { TrainingSession } from "@/lib/types";

/** Skrytý marker v poznámkách tréninku (parsování bez DB sloupce). */
export const LIVE_WORKOUT_LINK_RE = /\[\[fitdenik-live-workout:([0-9a-f-]{36})\]\]/gi;

export function formatLiveWorkoutDuration(durationSec: number): string {
  const s = Math.max(0, Math.round(durationSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function describeLiveWorkoutEntry(entry: LiveWorkoutLogEntry): string {
  const reps =
    entry.repsTarget > 0 && entry.repsTarget < 9000
      ? `${entry.repsCompleted}/${entry.repsTarget} rep`
      : `${entry.repsCompleted} rep`;
  const when = new Date(entry.createdAt).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${when} · ${entry.wodName} · ${formatLiveWorkoutDuration(entry.durationSec)} · ${reps}`;
}

export function stripLiveWorkoutLinkMarker(notes: string): string {
  return notes.replace(LIVE_WORKOUT_LINK_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractLiveWorkoutIdFromNotes(notes: string): string | null {
  const m = notes.match(/\[\[fitdenik-live-workout:([0-9a-f-]{36})\]\]/i);
  return m?.[1] ?? null;
}

export function embedLiveWorkoutLinkInNotes(notes: string, liveWorkoutId: string): string {
  const base = stripLiveWorkoutLinkMarker(notes);
  const marker = `[[fitdenik-live-workout:${liveWorkoutId}]]`;
  return base ? `${base}\n\n${marker}` : marker;
}

export function resolveLiveWorkoutForSession(session: TrainingSession): LiveWorkoutLogEntry | null {
  const bySession = readLiveWorkoutLogs().find((e) => e.linkedTrainingSessionId === session.id);
  if (bySession) return bySession;
  const fromNotes = extractLiveWorkoutIdFromNotes(session.notes);
  if (fromNotes) return findLiveWorkoutById(fromNotes);
  return null;
}

export function attachLiveWorkoutToTraining(
  liveWorkoutId: string,
  sessionId: string,
  notes: string,
): string {
  linkLiveWorkoutToTrainingSession(liveWorkoutId, sessionId);
  return embedLiveWorkoutLinkInNotes(notes, liveWorkoutId);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tréninky v deníku pro zadaný den (výchozí dnes). */
export function listTrainingSessionsForDate(
  sessions: TrainingSession[],
  dateIso = todayIsoDate(),
): TrainingSession[] {
  return sessions
    .filter((s) => s.date === dateIso || s.date.startsWith(dateIso))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function buildFinisherTrainingNoteAppendix(input: {
  finisherName: string;
  durationLabel: string;
  scoreSummary: string;
}): string {
  return `Finisher: ${input.finisherName} — ${input.scoreSummary}, ${input.durationLabel} (doplněk po hlavním tréninku).`;
}
