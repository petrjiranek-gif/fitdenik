import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type DashboardSummaryResponse = {
  weeklyTrainingCount: number;
  weeklyMinutes: number;
  weeklyCalories: number;
  avgProtein: number;
  latestBenchmarkLabel: string;
};

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

  const [trainingResult, nutritionResult, benchmarkResult] = await Promise.all([
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
    (sum, row) => sum + Number(row.duration_min ?? 0),
    0,
  );
  const weeklyCalories = trainingRows.reduce(
    (sum, row) => sum + Number(row.calories ?? 0),
    0,
  );
  const avgProtein = Math.round(
    nutritionRows.reduce((sum, row) => sum + Number(row.protein ?? 0), 0) /
      (nutritionRows.length || 1),
  );

  const response: DashboardSummaryResponse = {
    weeklyTrainingCount,
    weeklyMinutes,
    weeklyCalories,
    avgProtein,
    latestBenchmarkLabel: latestBenchmark
      ? `${latestBenchmark.benchmark_name} ${latestBenchmark.result_value}`
      : "Bez benchmarku",
  };

  return NextResponse.json(response);
}
