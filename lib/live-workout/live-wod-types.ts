/** Sdílené typy pro benchmark i Open (bez kruhových importů). */

export type WodBenchmarkRow = { level: string; timeRange: string };

export type WodSegment = { label: string; reps: number };

export type LiveWodDefinition = {
  key: string;
  /** Benchmark Girl/Hero, Open, nebo čistě bodyweight benchmark. */
  kind: "benchmark" | "open" | "bodyweight";
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
};
