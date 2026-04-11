import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NutritionEntry } from "@/lib/types";

type NutritionRow = {
  id: string;
  user_id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water_liters: number;
  body_weight_kg: number;
  notes: string;
};

function toEntry(row: NutritionRow): NutritionEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    waterLiters: row.water_liters,
    bodyWeightKg: row.body_weight_kg,
    notes: row.notes,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("nutrition_entries")
    .select("*")
    .order("date", { ascending: false })
    .limit(60);

  if (error) {
    return NextResponse.json(
      { error: `Chyba při načítání výživy: ${error.message}` },
      { status: 500 },
    );
  }

  const entries = (data as NutritionRow[]).map(toEntry);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as Omit<NutritionEntry, "id">;

  const insertPayload = {
    user_id: payload.userId,
    date: payload.date,
    calories: payload.calories,
    protein: payload.protein,
    carbs: payload.carbs,
    fat: payload.fat,
    fiber: payload.fiber,
    water_liters: payload.waterLiters,
    body_weight_kg: payload.bodyWeightKg,
    notes: payload.notes,
  };

  const { data, error } = await supabase
    .from("nutrition_entries")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Chyba při ukládání výživy: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ entry: toEntry(data as NutritionRow) }, { status: 201 });
}
