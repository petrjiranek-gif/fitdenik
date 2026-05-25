import { DEFAULT_IRON_MAN_STATE, type IronMan2030State } from "@/lib/iron-man-2030/types";

const STORAGE_KEY = "fitdenik.ironMan2030.v1";

export function readIronManLocalState(): IronMan2030State {
  if (typeof window === "undefined") return DEFAULT_IRON_MAN_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_IRON_MAN_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<IronMan2030State>;
    return {
      settings: { ...DEFAULT_IRON_MAN_STATE.settings, ...parsed.settings },
      calendar: parsed.calendar ?? {},
      coldSessions: parsed.coldSessions ?? [],
      meditationSessions: parsed.meditationSessions ?? [],
    };
  } catch {
    return DEFAULT_IRON_MAN_STATE;
  }
}

export function writeIronManLocalState(state: IronMan2030State): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
