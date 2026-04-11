import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BenchmarkResult, SourceType } from "@/lib/types";

type BenchmarkRow = {
  id: string;
  user_id: string;
  date: string;
  benchmark_name: string;
  result_type: string;
  result_value: string;
  scaling: string;
  notes: string;
  source_type: SourceType;
  source_name: string;
  source_url: string;
};

function toResult(row: BenchmarkRow): BenchmarkResult {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    benchmarkName: row.benchmark_name,
    resultType: row.result_type,
    resultValue: row.result_value,
    scaling: row.scaling,
    notes: row.notes,
    sourceType: row.source_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("benchmark_results")
    .select("*")
    .eq("user_id", getFitdenikUserId())
    .order("date", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: `Chyba při načítání benchmarků: ${error.message}` },
      { status: 500 },
    );
  }

  const results = (data as BenchmarkRow[]).map(toResult);
  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const payload = (await request.json()) as Omit<BenchmarkResult, "id">;

  const insertPayload = {
    user_id: getFitdenikUserId(),
    date: payload.date,
    benchmark_name: payload.benchmarkName,
    result_type: payload.resultType,
    result_value: payload.resultValue,
    scaling: payload.scaling,
    notes: payload.notes,
    source_type: payload.sourceType,
    source_name: payload.sourceName,
    source_url: payload.sourceUrl,
  };

  const { data, error } = await supabase
    .from("benchmark_results")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Chyba při ukládání benchmarku: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ result: toResult(data as BenchmarkRow) }, { status: 201 });
}
