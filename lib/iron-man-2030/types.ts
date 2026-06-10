import type { CalendarDayStatus, IronManDisciplineId } from "@/lib/iron-man-2030/constants";

export type IronManRaceRegistration = {
  registered: boolean;
  registeredAt?: string;
  actualRaceDate?: string;
};

export type IronManAthleteMetrics = {
  vo2Max?: number;
  ftpWatts?: number;
  swim100mSec?: number;
  carbsPerHour?: number;
  hrvLastDate?: string;
};

export type IronMan2030Settings = {
  race703: IronManRaceRegistration;
  race1406: IronManRaceRegistration;
  athleteMetrics: IronManAthleteMetrics;
  /** 0 = neděle … 1 = pondělí (výchozí regenerace = úterý → 2) */
  regenerationWeekday: number;
};

export type IronManCalendarDay = {
  status: CalendarDayStatus;
  reason?: string;
  /** Vazba na schválený týdenní plán trenéra. */
  coachPlanId?: string;
  /** Ručně nebo automaticky (import tréninku) potvrzený den plánu. */
  coachConfirmedAt?: string;
  coachMatchedSessionId?: string;
};

export type IronManColdSession = {
  id: string;
  sessionAt: string;
  type: "shower" | "ice_bath" | "open_water";
  durationMin: number;
  notes?: string;
};

export type IronManMeditationSession = {
  id: string;
  sessionAt: string;
  exerciseType: string;
  durationMin: number;
  notes?: string;
};

/** Check-in před generováním týdenního plánu AI trenéra. */
export type IronManCoachCheckIn = {
  id: string;
  createdAt: string;
  feeling: string;
  limitations: string;
  equipment: string;
  priority: string;
  comment?: string;
};

export type IronManCoachPlanDayKind = "training" | "rest" | "regeneration";

/** Jeden den týdenního plánu AI trenéra. */
export type IronManCoachPlanDay = {
  date: string;
  dayLabel: string;
  line: string;
  kind: IronManCoachPlanDayKind;
};

/** Vygenerovaný týdenní plán od AI trenéra. */
export type IronManCoachWeeklyPlan = {
  id: string;
  createdAt: string;
  /** Pondělí plánovaného týdne (ISO). */
  weekStart: string;
  markdown: string;
  /** Strukturované dny pro úpravy a kalendář. */
  days?: IronManCoachPlanDay[];
  approvedAt?: string;
};

export type IronMan2030State = {
  settings: IronMan2030Settings;
  calendar: Record<string, IronManCalendarDay>;
  coldSessions: IronManColdSession[];
  meditationSessions: IronManMeditationSession[];
  /** Poslední check-in pro AI trenéra. */
  coachCheckIn?: IronManCoachCheckIn | null;
  /** Historie check-inů (nejnovější první). */
  coachCheckInHistory?: IronManCoachCheckIn[];
  /** Poslední vygenerovaný plán (návrh nebo schválený). */
  coachWeeklyPlan?: IronManCoachWeeklyPlan | null;
  /** Historie plánů (nejnovější první). */
  coachPlanHistory?: IronManCoachWeeklyPlan[];
};

export const DEFAULT_IRON_MAN_SETTINGS: IronMan2030Settings = {
  race703: { registered: false },
  race1406: { registered: false },
  athleteMetrics: {},
  regenerationWeekday: 2,
};

export const DEFAULT_IRON_MAN_STATE: IronMan2030State = {
  settings: DEFAULT_IRON_MAN_SETTINGS,
  calendar: {},
  coldSessions: [],
  meditationSessions: [],
};

export type IronManDisciplineSlice = {
  id: IronManDisciplineId;
  label: string;
  color: string;
  hours: number;
  calories: number;
};
