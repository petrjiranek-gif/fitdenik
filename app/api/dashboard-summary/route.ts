import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardSummaryResponse = {
  weeklyTrainingCount: number;
  weeklyMinutes: number;
  weeklyCalories: number;
  avgProtein: number;
  latestBenchmarkLabel: string;
  latestBodyWeightKg: number | null;
  latestWeightDate: string | null;
  loggedTrainingToday: boolean;
  loggedNutritionToday: boolean;
  loggedWeightToday: boolean;
  recentTrainings: Array<{
    date: string;
    title: string;
    sport_type: string;
    duration_min: number;
  }>;
};

function calendarTodayPrague(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Prague" });
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 7);
  const fromDate = from.toISOString().slice(0, 10);
  const todayStr = calendarTodayPrague();

  const [
    trainingResult,
    nutritionResult,
    benchmarkResult,
    latestWeightResult,
    trainingTodayResult,
    nutritionTodayResult,
    weightTodayResult,
    recentTrainingsResult,
  ] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("duration_min, calories")
      .gte("date", fromDate),
    supabase.from("nutrition_entries").select("protein").gte("date", fromDate),
    supabase
      .from("benchmark_results")
      .select("benchmark_name, result_value, date")
      .order("date", { ascending: false })
      .limit(1),
    supabase
      .from("nutrition_entries")
      .select("body_weight_kg, date")
      .gt("body_weight_kg", 0)
      .order("date", { ascending: false })
      .limit(1),
    supabase.from("training_sessions").select("id").eq("date", todayStr).limit(1),
    supabase.from("nutrition_entries").select("id").eq("date", todayStr).limit(1),
    supabase
      .from("nutrition_entries")
      .select("id")
      .eq("date", todayStr)
      .gt("body_weight_kg", 0)
      .limit(1),
    supabase
      .from("training_sessions")
      .select("date, title, sport_type, duration_min")
      .order("date", { ascending: false })
      .limit(8),
  ]);

  if (trainingResult.error) {
    return NextResponse.json(
      { error: `Chyba tréninkového souhrnu: ${trainingResult.error.message}` },
      { status: 500 },
    );
  }
  if (nutritionResult.error) {
    return NextResponse.json(
      { error: `Chyba výživového souhrnu: ${nutritionResult.error.message}` },
      { status: 500 },
    );
  }
  if (benchmarkResult.error) {
    return NextResponse.json(
      { error: `Chyba benchmark souhrnu: ${benchmarkResult.error.message}` },
      { status: 500 },
    );
  }

  const trainingRows = trainingResult.data ?? [];
  const nutritionRows = nutritionResult.data ?? [];
  const latestBenchmark = benchmarkResult.data?.[0];

  const weeklyTrainingCount = trainingRows.length;
  const weeklyMinutes = trainingRows.reduce(
    (sum, row) => sum + Number((row as { duration_min?: number }).duration_min ?? 0),
    0,
  );
  const weeklyCalories = trainingRows.reduce(
    (sum, row) => sum + Number((row as { calories?: number }).calories ?? 0),
    0,
  );
  const avgProtein = Math.round(
    nutritionRows.reduce((sum, row) => sum + Number((row as { protein?: number }).protein ?? 0), 0) /
      (nutritionRows.length || 1),
  );

  const wRow = latestWeightResult.data?.[0] as { body_weight_kg?: number; date?: string } | undefined;
  const latestBodyWeightKg =
    wRow && wRow.body_weight_kg != null ? Number(wRow.body_weight_kg) : null;
  const latestWeightDate = wRow?.date ?? null;

  const response: DashboardSummaryResponse = {
    weeklyTrainingCount,
    weeklyMinutes,
    weeklyCalories,
    avgProtein,
    latestBenchmarkLabel: latestBenchmark
      ? `${latestBenchmark.benchmark_name} ${latestBenchmark.result_value}`
      : "Bez benchmarku",
    latestBodyWeightKg,
    latestWeightDate,
    loggedTrainingToday: trainingTodayResult.error ? false : Boolean(trainingTodayResult.data?.length),
    loggedNutritionToday: nutritionTodayResult.error ? false : Boolean(nutritionTodayResult.data?.length),
    loggedWeightToday: weightTodayResult.error ? false : Boolean(weightTodayResult.data?.length),
    recentTrainings: (recentTrainingsResult.data ?? []) as DashboardSummaryResponse["recentTrainings"],
  };

  if (latestWeightResult.error || recentTrainingsResult.error) {
    // Nepřerušuj hlavní souhrn; chybějící vedlejší data doplníme null / prázdné
    if (latestWeightResult.error) {
      response.latestBodyWeightKg = null;
      response.latestWeightDate = null;
    }
    if (recentTrainingsResult.error) {
      response.recentTrainings = [];
    }
  }

  return NextResponse.json(response);
}
