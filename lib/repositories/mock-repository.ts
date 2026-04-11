import type { BaselineInput } from "@/lib/repositories/contracts";
import {
  getDashboardSummaryFromRepositories,
  localStorageRepositories,
} from "@/lib/repositories/local-storage-adapter";

export type { BaselineInput };

export function getBaselineDefaults(): BaselineInput {
  return localStorageRepositories.baseline.getDefaults();
}

export function getBaselineFromStorage(): BaselineInput | null {
  return localStorageRepositories.baseline.get();
}

export function saveBaselineToStorage(input: BaselineInput): void {
  localStorageRepositories.baseline.save(input);
}

export function getDashboardSummary() {
  return getDashboardSummaryFromRepositories();
}

export function getTrainingSessions() {
  return localStorageRepositories.training.list();
}

export function addTrainingSession(input: Parameters<typeof localStorageRepositories.training.create>[0]) {
  return localStorageRepositories.training.create(input);
}

export function getNutritionEntries() {
  return localStorageRepositories.nutrition.list();
}

export function addNutritionEntry(input: Parameters<typeof localStorageRepositories.nutrition.create>[0]) {
  return localStorageRepositories.nutrition.create(input);
}

export function getBenchmarkResults() {
  return localStorageRepositories.benchmarks.list();
}

export function addBenchmarkResult(input: Parameters<typeof localStorageRepositories.benchmarks.create>[0]) {
  return localStorageRepositories.benchmarks.create(input);
}
