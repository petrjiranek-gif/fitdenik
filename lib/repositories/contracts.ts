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
