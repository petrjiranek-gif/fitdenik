import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BodyMeasurementEntry } from "@/lib/types";

type Row = {
  id: string;
  user_id: string;
  payload: Omit<BodyMeasurementEntry, "id" | "userId">;
};

function toEntry(row: Row): BodyMeasurementEntry {
  return {
    id: row.id,
    userId: row.user_id,
    ...row.payload,
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const uid = getFitdenikUserId();
  const { data, error } = await supabase
    .from("body_measurement_entries")
    .select("id, user_id, payload")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      {
        error: `Měření: ${error.message}`,
        ...(error.message.includes("Could not find the table") && {
          hint: "V Supabase → SQL spusť soubor supabase/migrations/001_baseline_body_measurements.sql (vytvoří tabulku body_measurement_entries).",
        }),
      },
      { status: 500 },
    );
  }

  const entries = (data as Row[]).map(toEntry);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const payload = (await request.json()) as Omit<BodyMeasurementEntry, "id" | "userId">;
  const uid = getFitdenikUserId();

  const { data, error } = await supabase
    .from("body_measurement_entries")
    .insert({ user_id: uid, payload })
    .select("id, user_id, payload")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: `Uložení měření: ${error.message}`,
        ...(error.message.includes("Could not find the table") && {
          hint: "V Supabase → SQL spusť soubor supabase/migrations/001_baseline_body_measurements.sql (vytvoří tabulku body_measurement_entries).",
        }),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ entry: toEntry(data as Row) }, { status: 201 });
}
