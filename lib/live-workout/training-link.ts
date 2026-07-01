import type { LiveWorkoutLogEntry } from "@/lib/live-workout/persist-log";
import {
  findLiveWorkoutById,
  linkLiveWorkoutsToTrainingSession,
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

export function extractAllLiveWorkoutIdsFromNotes(notes: string): string[] {
  const ids: string[] = [];
  const re = new RegExp(LIVE_WORKOUT_LINK_RE.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(notes)) !== null) {
    if (m[1] && !ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

/** První propojený živý trénink (zpětná kompatibilita). */
export function extractLiveWorkoutIdFromNotes(notes: string): string | null {
  return extractAllLiveWorkoutIdsFromNotes(notes)[0] ?? null;
}

export function embedLiveWorkoutLinksInNotes(notes: string, liveWorkoutIds: string[]): string {
  const unique = [...new Set(liveWorkoutIds.filter(Boolean))];
  const base = stripLiveWorkoutLinkMarker(notes);
  if (unique.length === 0) return base;
  const markers = unique.map((id) => `[[fitdenik-live-workout:${id}]]`).join("\n");
  return base ? `${base}\n\n${markers}` : markers;
}

export function embedLiveWorkoutLinkInNotes(notes: string, liveWorkoutId: string): string {
  return embedLiveWorkoutLinksInNotes(notes, [liveWorkoutId]);
}

function uniqueLiveWorkoutEntries(entries: Array<LiveWorkoutLogEntry | null | undefined>): LiveWorkoutLogEntry[] {
  const out: LiveWorkoutLogEntry[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
  }
  return out;
}

export function resolveLiveWorkoutsForSession(session: TrainingSession): LiveWorkoutLogEntry[] {
  const bySession = readLiveWorkoutLogs().filter((e) => e.linkedTrainingSessionId === session.id);
  const fromNotes = extractAllLiveWorkoutIdsFromNotes(session.notes)
    .map((id) => findLiveWorkoutById(id))
    .filter((e): e is LiveWorkoutLogEntry => e != null);
  return uniqueLiveWorkoutEntries([...bySession, ...fromNotes]);
}

export function resolveLiveWorkoutForSession(session: TrainingSession): LiveWorkoutLogEntry | null {
  return resolveLiveWorkoutsForSession(session)[0] ?? null;
}

export function attachLiveWorkoutsToTraining(
  liveWorkoutIds: string[],
  sessionId: string,
  notes: string,
): string {
  const unique = [...new Set(liveWorkoutIds.filter(Boolean))];
  if (unique.length > 0) {
    linkLiveWorkoutsToTrainingSession(unique, sessionId);
  }
  return embedLiveWorkoutLinksInNotes(notes, unique);
}

export function attachLiveWorkoutToTraining(
  liveWorkoutId: string,
  sessionId: string,
  notes: string,
): string {
  return attachLiveWorkoutsToTraining([liveWorkoutId], sessionId, notes);
}

export function parseLinkedLiveWorkoutIdsFromImport(data: Record<string, string | number>): string[] {
  const multi = data.linkedLiveWorkoutIds;
  if (typeof multi === "string" && multi.trim()) {
    return [...new Set(multi.split(",").map((s) => s.trim()).filter(Boolean))];
  }
  const single = String(data.linkedLiveWorkoutId ?? "").trim();
  return single ? [single] : [];
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
