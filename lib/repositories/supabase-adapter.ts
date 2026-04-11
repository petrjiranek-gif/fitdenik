import { createBaselineDefaults } from "@/lib/baseline-defaults";
import type { BenchmarkResult, NutritionEntry, TrainingSession } from "@/lib/types";
import type { AppRepositories, BaselineInput } from "@/lib/repositories/contracts";

/**
 * Repositář pro režim Supabase: čtení/zápis probíhá přes `/api/*` v komponentách.
 * Tento objekt slouží jako bezpečný fallback (prázdné listy, baseline null).
 */
function getBaselineDefaults(): BaselineInput {
  return createBaselineDefaults();
}

export const supabaseRepositories: AppRepositories = {
  baseline: {
    getDefaults() {
      return getBaselineDefaults();
    },
    get() {
      return null;
    },
    save() {
      /* zápis přes PUT /api/baseline */
    },
  },
  training: {
    list() {
      return [] as TrainingSession[];
    },
    create() {
      throw new Error("Tréninky přes POST /api/training.");
    },
    update() {
      throw new Error("Tréninky přes PATCH /api/training.");
    },
    delete() {
      throw new Error("Tréninky přes DELETE /api/training.");
    },
  },
  nutrition: {
    list() {
      return [] as NutritionEntry[];
    },
    create() {
      throw new Error("Výživa přes POST /api/nutrition.");
    },
  },
  benchmarks: {
    list() {
      return [] as BenchmarkResult[];
    },
    create() {
      throw new Error("Benchmarky přes POST /api/benchmarks.");
    },
  },
  bodyMeasurements: {
    list() {
      return [];
    },
    create() {
      throw new Error("Měření přes POST /api/body-measurements.");
    },
  },
};
