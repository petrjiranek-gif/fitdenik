import type { BenchmarkResult, NutritionEntry, TrainingSession, UserProfile } from "@/lib/types";

export type BaselineInput = Pick<
  UserProfile,
  | "age"
  | "heightCm"
  | "baselineWeightKg"
  | "waistCm"
  | "estimatedBodyFatPct"
  | "restingHeartRate"
  | "activityLevel"
  | "limitations"
  | "notes"
> & {
  goalsText: string;
  /** Hlavní cíl — cílová váha (kg). */
  targetWeightKg: number;
  /** Volitelné datum cíle (YYYY-MM-DD). */
  targetDate?: string;
  /** Datum měření z chytré váhy (YYYY-MM-DD). */
  scaleMeasuredAt: string;
  /** Hodnoty z chytré váhy (0 = nevyplněno; váha = baselineWeightKg jako výchozí bod). */
  scaleBmi: number;
  scaleBodyFatPct: number;
  scaleMuscleMassKg: number;
  scaleBodyWaterPct: number;
  scaleLeanMassKg: number;
  scaleBoneMassKg: number;
  scaleProteinPct: number;
  scaleVisceralFat: number;
  scaleBmrKcal: number;
  scaleMetabolicAge: number;
  /** Obvody těla (cm) — baseline pro porovnání. */
  neckCm: number;
  chestRelaxedCm: number;
  chestFlexedCm: number;
  armRelaxedCm: number;
  armFlexedCm: number;
  hipsCm: number;
  thighCm: number;
  calfCm: number;
};

export interface BaselineRepository {
  getDefaults(): BaselineInput;
  get(): BaselineInput | null;
  save(input: BaselineInput): void;
}

export interface TrainingRepository {
  list(): TrainingSession[];
  create(input: Omit<TrainingSession, "id" | "userId">): TrainingSession;
}

export interface NutritionRepository {
  list(): NutritionEntry[];
  create(input: Omit<NutritionEntry, "id" | "userId">): NutritionEntry;
}

export interface BenchmarkRepository {
  list(): BenchmarkResult[];
  create(input: Omit<BenchmarkResult, "id" | "userId">): BenchmarkResult;
}

export interface AppRepositories {
  baseline: BaselineRepository;
  training: TrainingRepository;
  nutrition: NutritionRepository;
  benchmarks: BenchmarkRepository;
}
