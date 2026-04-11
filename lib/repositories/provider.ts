import type { AppRepositories } from "@/lib/repositories/contracts";
import { localStorageRepositories } from "@/lib/repositories/local-storage-adapter";
import { supabaseRepositories } from "@/lib/repositories/supabase-adapter";

type RepositoryMode = "localStorage" | "supabase";

function getRepositoryMode(): RepositoryMode {
  const mode = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY;
  return mode === "supabase" ? "supabase" : "localStorage";
}

export function getRepositories(): AppRepositories {
  if (getRepositoryMode() !== "supabase") {
    return localStorageRepositories;
  }

  return supabaseRepositories;
}

export function getDashboardSummaryFromProvider() {
  const repositories = getRepositories();
  const sessions = repositories.training.list();
  const nutrition = repositories.nutrition.list();
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
