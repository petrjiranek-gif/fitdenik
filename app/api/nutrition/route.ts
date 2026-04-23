import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function toInt(value: unknown): number {
  return Math.round(toNumber(value));
}

function toText(value: unknown): string {
  return String(value ?? "");
}

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
    .eq("user_id", getFitdenikUserId())
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
    user_id: getFitdenikUserId(),
    date: toText(payload.date),
    calories: toInt(payload.calories),
    protein: toInt(payload.protein),
    carbs: toInt(payload.carbs),
    fat: toInt(payload.fat),
    fiber: toInt(payload.fiber),
    water_liters: toNumber(payload.waterLiters),
    body_weight_kg: toNumber(payload.bodyWeightKg),
    notes: toText(payload.notes),
  };

  const { data, error } = await supabase
    .from("nutrition_entries")
    .insert(insertPayload)
    .select("*")
    .single();

  if (!error) {
    return NextResponse.json({ entry: toEntry(data as NutritionRow) }, { status: 201 });
  }

  // Pokud už pro daný den existuje záznam (unikátní klíč user+date),
  // přepiš jej importem / novým vstupem místo pádu.
  if (/duplicate key|unique/i.test(error.message)) {
    const { data: updated, error: updateError } = await supabase
      .from("nutrition_entries")
      .update({
        calories: insertPayload.calories,
        protein: insertPayload.protein,
        carbs: insertPayload.carbs,
        fat: insertPayload.fat,
        fiber: insertPayload.fiber,
        water_liters: insertPayload.water_liters,
        body_weight_kg: insertPayload.body_weight_kg,
        notes: insertPayload.notes,
      })
      .eq("user_id", insertPayload.user_id)
      .eq("date", insertPayload.date)
      .select("*")
      .single();
    if (updateError) {
      return NextResponse.json(
        { error: `Chyba při aktualizaci výživy: ${updateError.message}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ entry: toEntry(updated as NutritionRow), updated: true }, { status: 200 });
  }

  return NextResponse.json(
    { error: `Chyba při ukládání výživy: ${error.message}` },
    { status: 500 },
  );
}
