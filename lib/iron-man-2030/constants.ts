/** Iron Man 2030 — pevné parametry projektu (dokument v1.0). */

export const IRON_MAN_PROJECT_START = "2026-05-23";
export const IRON_MAN_COUNTDOWN_START = "2026-07-24";
export const IRON_MAN_RACE_703_DEFAULT = "2028-07-24";
export const IRON_MAN_RACE_1406_DEFAULT = "2030-07-24";
export const IRON_MAN_START_WEIGHT_KG = 127.9;
export const IRON_MAN_TARGET_WEIGHT_KG = 105;

export const IRON_MAN_MOTTO = "Anything is Possible";

export type IronManPhaseId = "foundation" | "build" | "peak";

export type IronManPhase = {
  id: IronManPhaseId;
  label: string;
  from: string;
  to: string;
  sessionsPerWeek: [number, number];
  hoursPerWeek: [number, number];
  primaryGoal: string;
};

export const IRON_MAN_PHASES: IronManPhase[] = [
  {
    id: "foundation",
    label: "1 — Základ",
    from: "2026-05-23",
    to: "2027-12-31",
    sessionsPerWeek: [8, 10],
    hoursPerWeek: [8, 12],
    primaryGoal: "Váha + aerobní základ",
  },
  {
    id: "build",
    label: "2 — Budování",
    from: "2028-01-01",
    to: "2028-07-24",
    sessionsPerWeek: [9, 11],
    hoursPerWeek: [10, 14],
    primaryGoal: "Mallorca 70.3 prep",
  },
  {
    id: "peak",
    label: "3 — Peak",
    from: "2028-07-25",
    to: "2030-07-24",
    sessionsPerWeek: [10, 13],
    hoursPerWeek: [12, 16],
    primaryGoal: "Plný Ironman 140.6",
  },
];

export type IronManDisciplineId =
  | "swim"
  | "scooter"
  | "gravel"
  | "nordic_walk"
  | "run"
  | "golf"
  | "crossfit"
  | "bodybuilding";

export const IRON_MAN_DISCIPLINES: {
  id: IronManDisciplineId;
  label: string;
  color: string;
  subA?: string;
  subB?: string;
}[] = [
  { id: "swim", label: "Plavání", color: "#0ea5e9", subA: "80% bazén", subB: "20% volná voda" },
  { id: "scooter", label: "Koloběžka", color: "#f59e0b", subA: "80% z cyklo objemu" },
  { id: "gravel", label: "Gravel kolo", color: "#22c55e", subA: "20% z cyklo objemu" },
  { id: "nordic_walk", label: "Nordic walking", color: "#a855f7", subA: "část chůze/běh bloku" },
  { id: "run", label: "Běh", color: "#ef4444", subA: "část chůze/běh bloku" },
  { id: "golf", label: "Golf", color: "#84cc16", subA: "doplňková aktivita" },
  { id: "crossfit", label: "CrossFit", color: "#ec4899", subA: "z existující sekce" },
  { id: "bodybuilding", label: "Kulturistika", color: "#6366f1", subA: "z existující sekce" },
];

export type CalendarDayStatus =
  | "training"
  | "regeneration"
  | "rest"
  | "sick"
  | "injury"
  | "travel";

export const CALENDAR_DAY_META: Record<
  CalendarDayStatus,
  { label: string; color: string; icon: string }
> = {
  training: { label: "Trénink", color: "#22c55e", icon: "✅" },
  regeneration: { label: "Regenerace", color: "#eab308", icon: "🟡" },
  rest: { label: "Volno", color: "#64748b", icon: "⬜" },
  sick: { label: "Nemoc", color: "#ef4444", icon: "🔴" },
  injury: { label: "Zranění", color: "#f97316", icon: "🤕" },
  travel: { label: "Cestování", color: "#3b82f6", icon: "✈️" },
};

export const WEIGHT_MILESTONES_KG = [127.9, 122.9, 117.9, 112.9, 107.9, 105];

export const IRON_MAN_AUDIO_TRACKS = [
  { id: "champions", title: "Queen — We Are The Champions", placeholder: true },
  { id: "mirai", title: "Mirai — Když nemůžeš, přidej víc", placeholder: true },
] as const;
