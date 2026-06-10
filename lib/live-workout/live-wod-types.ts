/** Sdílené typy pro benchmark, Open, bodyweight i finisher (bez kruhových importů). */

export type WodBenchmarkRow = { level: string; timeRange: string };

export type WodSegment = { label: string; reps: number };

export type WodMovement = {
  label: string;
  reps?: number | string;
  unit?: string;
  weight?: string;
  notes?: string;
};

export type FinisherDayType =
  | "upper_body"
  | "lower_body"
  | "full_body"
  | "crossfit"
  | "hyrox"
  | "hard_day";

export type FinisherFormatType = "AMRAP" | "EMOM" | "For Time" | "Interval";

export type FinisherScoringField =
  | "rounds"
  | "extra_reps"
  | "completed"
  | "avg_hr"
  | "kcal"
  | "note";

/** Jedna minuta (nebo blok) v EMOM cyklu — opakuje se po celou délku. */
export type EmomMinuteBlock = {
  label: string;
  movements: WodMovement[];
};

export type LiveWodDefinition = {
  key: string;
  /** Benchmark Girl/Hero, Open, bodyweight benchmark, nebo krátký finisher. */
  kind: "benchmark" | "open" | "bodyweight" | "finisher";
  /** Zobrazovaný název */
  name: string;
  subtitle: string;
  scoreType: string;
  prescription: string;
  description: string;
  /** Jedna součtová série nebo více bloků (Angie, Murph…) */
  segments: WodSegment[];
  benchmarks: WodBenchmarkRow[];
  referenceUrl: string;
  /** U Open WOD často oficiální cap (minuty). */
  timeCapMin?: number;
  /** AMRAP, chipper s kcal apod. — dokončit výsledek i bez „plného“ počtu rep v počítadle. */
  liveFinishAnytime?: boolean;
  /** Rx / typické váhy a nářadí (zobrazí se u CrossFitu nad polem pro vlastní zátěž). */
  rxLoadDescription?: string;

  /** Finisher — doporučený typ dne (po čem ho použít). */
  recommendedDayType?: FinisherDayType;
  durationMinutes?: number;
  formatType?: FinisherFormatType;
  /** Krátký cíl finisheru. */
  goal?: string;
  movements?: WodMovement[];
  scoringFields?: FinisherScoringField[];
  tags?: string[];
  cautionNote?: string;
  /** Kdy použít / po jakém tréninku / účel. */
  helpText?: string;
  /** EMOM — opakující se bloky minut (lichá/sudá nebo 3min cyklus). */
  emomCycle?: EmomMinuteBlock[];
};
