import type { EmomMinuteBlock, LiveWodDefinition } from "@/lib/live-workout/live-wod-types";

export type FinisherWodKey =
  | "finisher_leg_burn_12"
  | "finisher_flush_10"
  | "finisher_simple_fire_10"
  | "finisher_iron_legs_12"
  | "finisher_burpee_burn_10";

export const FINISHER_DAY_TYPE_LABELS: Record<
  NonNullable<LiveWodDefinition["recommendedDayType"]>,
  string
> = {
  upper_body: "po upper body",
  lower_body: "po lower body",
  full_body: "po full body / CrossFit",
  crossfit: "po CrossFit",
  hyrox: "po HYROX / engine workoutu",
  hard_day: "ostrý den / 1× týdně",
};

export const FINISHER_WODS: Record<FinisherWodKey, LiveWodDefinition> = {
  finisher_leg_burn_12: {
    key: "finisher_leg_burn_12",
    kind: "finisher",
    name: "LEG BURN 12",
    subtitle: "Finisher · metabolický doplněk po hlavním tréninku",
    scoreType: "AMRAP 12",
    formatType: "AMRAP",
    durationMinutes: 12,
    timeCapMin: 12,
    liveFinishAnytime: true,
    recommendedDayType: "upper_body",
    prescription:
      "AMRAP 12 min: 15 step-ups, 12 squats to box, 10 wall balls, 20 kroků farmer carry — opakuj co nejvíce kol.",
    description:
      "Krátký závěrečný blok na nohy a tep po upper body dni. Cíl: spalování a metabolický stimul bez složité techniky.",
    goal: "Nohy, spalování, tep, metabolický stimul po upper body dni.",
    helpText:
      "Použij po tréninku horní poloviny těla (press, pull, ramena). Doplň nohy a engine bez další destrukce paží.",
    movements: [
      { label: "Step-ups", reps: 15, unit: "reps" },
      { label: "Squats to box", reps: 12, unit: "reps" },
      { label: "Wall balls", reps: 10, unit: "reps" },
      { label: "Farmer carry", reps: 20, unit: "kroků" },
    ],
    segments: [
      { label: "Step-ups", reps: 15 },
      { label: "Squats to box", reps: 12 },
      { label: "Wall balls", reps: 10 },
      { label: "Farmer carry (kroky)", reps: 20 },
    ],
    scoringFields: ["rounds", "extra_reps", "avg_hr", "kcal", "note"],
    tags: ["Finisher", "Upper Body Day", "Fat Burn", "Engine", "Ironman Support"],
    benchmarks: [{ level: "Tip", timeRange: "4–6+ kol podle tempa a váhy wall ballu" }],
    referenceUrl: "https://www.wodwell.com/",
    rxLoadDescription: "Wall ball a farmer carry dle úrovně; box výška dle mobility.",
  },
  finisher_flush_10: {
    key: "finisher_flush_10",
    kind: "finisher",
    name: "FLUSH 10",
    subtitle: "Finisher · flush po lower body",
    scoreType: "EMOM 10",
    formatType: "EMOM",
    durationMinutes: 10,
    timeCapMin: 10,
    liveFinishAnytime: true,
    recommendedDayType: "lower_body",
    prescription:
      "EMOM 10 min — liché: 10 TRX rows + 10 push-ups; sudé: 20 s wall sit + 10 squats to box.",
    description:
      "Šetrný metabolický závěr po lower body dni. Flush nohou, zvedne tep, ale bez další těžké destrukce.",
    goal: "Flush nohou, tep, bez zbytečné destrukce po lower body dni.",
    helpText:
      "Ideální po dřepovém / deadlift dni. Horní část lehká, nohy aktivní ale kontrolovaně.",
    movements: [
      { label: "TRX rows", reps: 10, unit: "reps", notes: "liché minuty" },
      { label: "Push-ups", reps: 10, unit: "reps", notes: "liché minuty" },
      { label: "Wall sit", reps: "20", unit: "s", notes: "sudé minuty" },
      { label: "Squats to box", reps: 10, unit: "reps", notes: "sudé minuty" },
    ],
    emomCycle: [
      {
        label: "Lichá minuta",
        movements: [
          { label: "TRX rows", reps: 10, unit: "reps" },
          { label: "Push-ups", reps: 10, unit: "reps" },
        ],
      },
      {
        label: "Sudá minuta",
        movements: [
          { label: "Wall sit", reps: "20", unit: "s" },
          { label: "Squats to box", reps: 10, unit: "reps" },
        ],
      },
    ],
    segments: [],
    scoringFields: ["completed", "avg_hr", "kcal", "note"],
    tags: ["Finisher", "Lower Body Day", "Recovery Engine", "Flush", "Low Impact"],
    benchmarks: [{ level: "Tip", timeRange: "Dokonči všech 10 minut v klidu — kvalita nad rychlostí" }],
    referenceUrl: "https://www.wodwell.com/",
    rxLoadDescription: "TRX úhel dle síly; box výška pohodlná po squat dni.",
  },
  finisher_simple_fire_10: {
    key: "finisher_simple_fire_10",
    kind: "finisher",
    name: "SIMPLE FIRE 10",
    subtitle: "Finisher · jednoduchý engine závěr",
    scoreType: "AMRAP 10",
    formatType: "AMRAP",
    durationMinutes: 10,
    timeCapMin: 10,
    liveFinishAnytime: true,
    recommendedDayType: "full_body",
    prescription:
      "AMRAP 10 min: 10 step-ups, 10 TRX rows, 10 squats to box, 10 push press s osou 20 kg.",
    description:
      "Jednoduchý full-body finisher po CrossFit nebo full body tréninku. Bezpečný metabolický závěr s nízkou technickou náročností.",
    goal: "Jednoduchý engine finisher, full body metabolický stimul, bezpečný závěr tréninku.",
    helpText:
      "Univerzální závěr po WOD nebo full body dni. Nízká skill náročnost — drž tempo, ne ego.",
    movements: [
      { label: "Step-ups", reps: 10, unit: "reps" },
      { label: "TRX rows", reps: 10, unit: "reps" },
      { label: "Squats to box", reps: 10, unit: "reps" },
      { label: "Push press", reps: 10, unit: "reps", weight: "osa 20 kg" },
    ],
    segments: [
      { label: "Step-ups", reps: 10 },
      { label: "TRX rows", reps: 10 },
      { label: "Squats to box", reps: 10 },
      { label: "Push press", reps: 10 },
    ],
    scoringFields: ["rounds", "extra_reps", "avg_hr", "kcal", "note"],
    tags: ["Finisher", "Full Body Day", "CrossFit Finish", "Engine", "Low Skill"],
    benchmarks: [{ level: "Tip", timeRange: "5–8+ kol — push press škáluj na 15–25 kg dle únavy" }],
    referenceUrl: "https://www.wodwell.com/",
    rxLoadDescription: "Push press s osou 20 kg (škáluj dle únavy po hlavním tréninku).",
  },
  finisher_iron_legs_12: {
    key: "finisher_iron_legs_12",
    kind: "finisher",
    name: "IRON LEGS 12",
    subtitle: "Finisher · nohy pro HYROX / engine",
    scoreType: "EMOM 12",
    formatType: "EMOM",
    durationMinutes: 12,
    timeCapMin: 12,
    liveFinishAnytime: true,
    recommendedDayType: "hyrox",
    prescription:
      "EMOM 12 min (4× cyklus): M1 — 20 step-ups; M2 — 10 wall balls + 10 s wall sit; M3 — 20 kroků farmer carry.",
    description:
      "Disciplinovaný leg finisher po HYROX nebo engine workoutu. Stereotyp, nohy, ironman support.",
    goal: "Nohy, disciplína, stereotyp, ironman support / low impact engine.",
    helpText:
      "Po běžeckém / HYROX / engine bloku. Drž tempo minut — nezávod, ale konzistentní práce.",
    movements: [
      { label: "Step-ups", reps: 20, unit: "reps", notes: "minuta 1" },
      { label: "Wall balls", reps: 10, unit: "reps", notes: "minuta 2" },
      { label: "Wall sit", reps: "10", unit: "s", notes: "minuta 2" },
      { label: "Farmer carry", reps: 20, unit: "kroků", notes: "minuta 3" },
    ],
    emomCycle: [
      {
        label: "Minuta 1",
        movements: [{ label: "Step-ups", reps: 20, unit: "reps" }],
      },
      {
        label: "Minuta 2",
        movements: [
          { label: "Wall balls", reps: 10, unit: "reps" },
          { label: "Wall sit", reps: "10", unit: "s" },
        ],
      },
      {
        label: "Minuta 3",
        movements: [{ label: "Farmer carry", reps: 20, unit: "kroků" }],
      },
    ],
    segments: [],
    scoringFields: ["completed", "avg_hr", "kcal", "note"],
    tags: ["Finisher", "HYROX Day", "Ironman Support", "Legs", "Monotony"],
    benchmarks: [{ level: "Tip", timeRange: "12/12 dokončených minut = plný flush" }],
    referenceUrl: "https://www.wodwell.com/",
    rxLoadDescription: "Wall ball a farmer carry dle HYROX setupu; step-up výška konzistentní.",
  },
  finisher_burpee_burn_10: {
    key: "finisher_burpee_burn_10",
    kind: "finisher",
    name: "BURPEE BURN 10",
    subtitle: "Finisher · ostrý metabolický závěr",
    scoreType: "AMRAP 10",
    formatType: "AMRAP",
    durationMinutes: 10,
    timeCapMin: 10,
    liveFinishAnytime: true,
    recommendedDayType: "hard_day",
    prescription: "AMRAP 10 min: 6 burpees, 10 wall balls, 12 step-ups — opakuj.",
    description:
      "Vyšší intenzita, silný spalovací finisher. Používej max. 1× týdně jako ostrý závěr.",
    goal: "Vyšší intenzita, silný metabolický závěr, spalovací finisher.",
    helpText:
      "Jen když máš v týdnu „ostrý den“ a chceš dorazit engine. Ne po těžkém max effort dni.",
    cautionNote: "Vyšší intenzita — max. 1× týdně. Ne po vyčerpávajícím max effort tréninku.",
    movements: [
      { label: "Burpees", reps: 6, unit: "reps" },
      { label: "Wall balls", reps: 10, unit: "reps" },
      { label: "Step-ups", reps: 12, unit: "reps" },
    ],
    segments: [
      { label: "Burpees", reps: 6 },
      { label: "Wall balls", reps: 10 },
      { label: "Step-ups", reps: 12 },
    ],
    scoringFields: ["rounds", "extra_reps", "avg_hr", "kcal", "note"],
    tags: ["Finisher", "Hard Day", "Burpee", "Fat Burn", "Weekly Sharpener"],
    benchmarks: [{ level: "Tip", timeRange: "4–7+ kol — burpee tempo podle zbytku energie" }],
    referenceUrl: "https://www.wodwell.com/",
    rxLoadDescription: "Wall ball dle úrovně; burpee na podložku pokud jsou zápěstí unavená.",
  },
};

export const FINISHER_WOD_ORDER: FinisherWodKey[] = [
  "finisher_leg_burn_12",
  "finisher_flush_10",
  "finisher_simple_fire_10",
  "finisher_iron_legs_12",
  "finisher_burpee_burn_10",
];

/** Kontext dnešního tréninku pro zvýraznění doporučených finisherů. */
export type FinisherTodayContext =
  | "upper_body"
  | "lower_body"
  | "crossfit"
  | "hyrox"
  | "light_day";

export const FINISHER_TODAY_CONTEXT_OPTIONS: { value: FinisherTodayContext; label: string }[] = [
  { value: "upper_body", label: "po upper body" },
  { value: "lower_body", label: "po lower body" },
  { value: "crossfit", label: "po CrossFit" },
  { value: "hyrox", label: "po HYROX" },
  { value: "light_day", label: "po lehkém dni" },
];

export function isFinisherRecommendedForContext(
  wod: LiveWodDefinition,
  context: FinisherTodayContext | null,
): boolean {
  if (!context || context === "light_day" || !wod.recommendedDayType) return false;
  if (context === "crossfit") {
    return wod.recommendedDayType === "crossfit" || wod.recommendedDayType === "full_body";
  }
  return wod.recommendedDayType === context;
}

export function finisherRepsPerRound(wod: LiveWodDefinition): number {
  return wod.segments.reduce((sum, s) => sum + s.reps, 0);
}

export function getEmomMinuteState(elapsedMs: number, durationMinutes: number) {
  const totalMs = durationMinutes * 60_000;
  const clamped = Math.min(Math.max(0, elapsedMs), totalMs);
  const minuteIndex = Math.min(Math.floor(clamped / 60_000), Math.max(0, durationMinutes - 1));
  const currentMinute = minuteIndex + 1;
  const msIntoMinute = clamped - minuteIndex * 60_000;
  const secRemaining = Math.max(0, 60 - Math.floor(msIntoMinute / 1000));
  const isComplete = elapsedMs >= totalMs;
  return { currentMinute, secRemaining, isComplete, totalMs, minuteIndex };
}

export function getEmomBlockForMinute(
  wod: LiveWodDefinition,
  minute1Based: number,
): EmomMinuteBlock | null {
  const cycle = wod.emomCycle;
  if (!cycle?.length) return null;
  return cycle[(minute1Based - 1) % cycle.length] ?? null;
}
