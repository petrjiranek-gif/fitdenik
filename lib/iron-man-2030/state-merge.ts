import { DEFAULT_IRON_MAN_STATE, type IronMan2030State } from "@/lib/iron-man-2030/types";

export function mergeIronManState(raw: unknown): IronMan2030State {
  if (!raw || typeof raw !== "object") return DEFAULT_IRON_MAN_STATE;
  const p = raw as Partial<IronMan2030State>;
  return {
    settings: {
      ...DEFAULT_IRON_MAN_STATE.settings,
      ...p.settings,
      race703: { ...DEFAULT_IRON_MAN_STATE.settings.race703, ...p.settings?.race703 },
      race1406: { ...DEFAULT_IRON_MAN_STATE.settings.race1406, ...p.settings?.race1406 },
      athleteMetrics: {
        ...DEFAULT_IRON_MAN_STATE.settings.athleteMetrics,
        ...p.settings?.athleteMetrics,
      },
    },
    calendar: p.calendar ?? {},
    coldSessions: Array.isArray(p.coldSessions) ? p.coldSessions : [],
    meditationSessions: Array.isArray(p.meditationSessions) ? p.meditationSessions : [],
    coachCheckIn: p.coachCheckIn ?? null,
    coachCheckInHistory: Array.isArray(p.coachCheckInHistory) ? p.coachCheckInHistory : [],
  };
}
