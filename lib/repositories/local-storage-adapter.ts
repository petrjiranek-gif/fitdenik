import {
  benchmarkResults,
  nutritionEntries,
  trainingSessions,
  userProfile,
} from "@/lib/mock-data";
import type { BenchmarkResult, NutritionEntry, TrainingSession } from "@/lib/types";
import type {
  AppRepositories,
  BaselineInput,
  BenchmarkRepository,
  NutritionRepository,
  TrainingRepository,
} from "@/lib/repositories/contracts";

const BASELINE_STORAGE_KEY = "fitdenik.baseline.v1";
const TRAINING_STORAGE_KEY = "fitdenik.training.v1";
const NUTRITION_STORAGE_KEY = "fitdenik.nutrition.v1";
const BENCHMARK_STORAGE_KEY = "fitdenik.benchmarks.v1";

function readStorage<T>(key: string): T[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(data));
}

const trainingRepo: TrainingRepository = {
  list() {
    return readStorage<TrainingSession>(TRAINING_STORAGE_KEY) ?? trainingSessions;
  },
  create(input) {
    const next: TrainingSession = { id: crypto.randomUUID(), userId: "u1", ...input };
    writeStorage(TRAINING_STORAGE_KEY, [next, ...this.list()]);
    return next;
  },
};

const nutritionRepo: NutritionRepository = {
  list() {
    return readStorage<NutritionEntry>(NUTRITION_STORAGE_KEY) ?? nutritionEntries;
  },
  create(input) {
    const next: NutritionEntry = { id: crypto.randomUUID(), userId: "u1", ...input };
    writeStorage(NUTRITION_STORAGE_KEY, [next, ...this.list()]);
    return next;
  },
};

const benchmarkRepo: BenchmarkRepository = {
  list() {
    return readStorage<BenchmarkResult>(BENCHMARK_STORAGE_KEY) ?? benchmarkResults;
  },
  create(input) {
    const next: BenchmarkResult = { id: crypto.randomUUID(), userId: "u1", ...input };
    writeStorage(BENCHMARK_STORAGE_KEY, [next, ...this.list()]);
    return next;
  },
};

function getBaselineDefaults(): BaselineInput {
  return {
    age: userProfile.age,
    heightCm: userProfile.heightCm,
    baselineWeightKg: userProfile.baselineWeightKg,
    waistCm: userProfile.waistCm,
    estimatedBodyFatPct: userProfile.estimatedBodyFatPct,
    restingHeartRate: userProfile.restingHeartRate,
    activityLevel: userProfile.activityLevel,
    goalsText: userProfile.goals.join(", "),
    limitations: userProfile.limitations,
    notes: userProfile.notes,
  };
}

export const localStorageRepositories: AppRepositories = {
  baseline: {
    getDefaults() {
      return getBaselineDefaults();
    },
    get() {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(BASELINE_STORAGE_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as BaselineInput;
      } catch {
        return null;
      }
    },
    save(input) {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(input));
    },
  },
  training: trainingRepo,
  nutrition: nutritionRepo,
  benchmarks: benchmarkRepo,
};

export function getDashboardSummaryFromRepositories() {
  const sessions = localStorageRepositories.training.list();
  const nutrition = localStorageRepositories.nutrition.list();
  const weeklyMinutes = sessions.reduce((sum, t) => sum + t.durationMin, 0);
  const weeklyCalories = sessions.reduce((sum, t) => sum + t.calories, 0);
  const avgProtein = Math.round(
    nutrition.reduce((sum, n) => sum + n.protein, 0) / (nutrition.length || 1),
  );
  return {
    weeklyTrainingCount: sessions.length,
    weeklyMinutes,
    weeklyCalories,
    avgProtein,
  };
}
