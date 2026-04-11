import { createBaselineDefaults } from "@/lib/baseline-defaults";
import { benchmarkResults, nutritionEntries, trainingSessions } from "@/lib/mock-data";
import type { BenchmarkResult, NutritionEntry, TrainingSession } from "@/lib/types";
import type { AppRepositories, BaselineInput } from "@/lib/repositories/contracts";

function notImplemented(action: string): never {
  throw new Error(
    `Supabase adapter: "${action}" zatím není implementováno. ` +
      "Doplň Supabase klienta a SQL mapování v lib/repositories/supabase-adapter.ts.",
  );
}

function getBaselineDefaults(): BaselineInput {
  return createBaselineDefaults();
}

export const supabaseRepositories: AppRepositories = {
  baseline: {
    getDefaults() {
      return getBaselineDefaults();
    },
    get() {
      // TODO: read baseline from Supabase profile/baseline table.
      return null;
    },
    save(input) {
      void input;
      notImplemented("baseline.save");
    },
  },
  training: {
    list() {
      // TODO: read training sessions from Supabase.
      return trainingSessions as TrainingSession[];
    },
    create(input) {
      void input;
      notImplemented("training.create");
    },
    update() {
      notImplemented("training.update");
    },
    delete() {
      notImplemented("training.delete");
    },
  },
  nutrition: {
    list() {
      // TODO: read nutrition entries from Supabase.
      return nutritionEntries as NutritionEntry[];
    },
    create(input) {
      void input;
      notImplemented("nutrition.create");
    },
  },
  benchmarks: {
    list() {
      // TODO: read benchmark results from Supabase.
      return benchmarkResults as BenchmarkResult[];
    },
    create(input) {
      void input;
      notImplemented("benchmarks.create");
    },
  },
  bodyMeasurements: {
    list() {
      return [];
    },
    create(input) {
      void input;
      notImplemented("bodyMeasurements.create");
    },
  },
};
