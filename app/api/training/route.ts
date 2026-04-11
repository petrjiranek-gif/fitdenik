import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TrainingSession } from "@/lib/types";

type TrainingRow = {
  id: string;
  user_id: string;
  date: string;
  sport_type: TrainingSession["sportType"];
  title: string;
  duration_min: number;
  distance_km: number;
  avg_heart_rate: number;
  calories: number;
  elevation: number;
  pace: string;
  effort: string;
  rpe: number;
  notes: string;
};

function toSession(row: TrainingRow): TrainingSession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    sportType: row.sport_type,
    title: row.title,
    durationMin: row.duration_min,
    distanceKm: row.distance_km,
    avgHeartRate: row.avg_heart_rate,
    calories: row.calories,
    elevation: row.elevation,
    pace: row.pace,
    effort: row.effort,
    rpe: row.rpe,
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
    .from("training_sessions")
    .select("*")
    .order("date", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: `Chyba při načítání tréninků: ${error.message}` },
      { status: 500 },
    );
  }

  const sessions = (data as TrainingRow[]).map(toSession);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as Omit<TrainingSession, "id">;

  const insertPayload = {
    user_id: payload.userId,
    date: payload.date,
    sport_type: payload.sportType,
    title: payload.title,
    duration_min: payload.durationMin,
    distance_km: payload.distanceKm,
    avg_heart_rate: payload.avgHeartRate,
    calories: payload.calories,
    elevation: payload.elevation,
    pace: payload.pace,
    effort: payload.effort,
    rpe: payload.rpe,
    notes: payload.notes,
  };

  const { data, error } = await supabase
    .from("training_sessions")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Chyba při ukládání tréninku: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: toSession(data as TrainingRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { id: string } & Partial<Omit<TrainingSession, "id" | "userId">>;
  const { id, ...rest } = body;
  if (!id) {
    return NextResponse.json({ error: "Chybí id tréninku." }, { status: 400 });
  }

  const row: Record<string, string | number> = {};
  if (rest.date !== undefined) row.date = rest.date;
  if (rest.sportType !== undefined) row.sport_type = rest.sportType;
  if (rest.title !== undefined) row.title = rest.title;
  if (rest.durationMin !== undefined) row.duration_min = rest.durationMin;
  if (rest.distanceKm !== undefined) row.distance_km = rest.distanceKm;
  if (rest.avgHeartRate !== undefined) row.avg_heart_rate = rest.avgHeartRate;
  if (rest.calories !== undefined) row.calories = rest.calories;
  if (rest.elevation !== undefined) row.elevation = rest.elevation;
  if (rest.pace !== undefined) row.pace = rest.pace;
  if (rest.effort !== undefined) row.effort = rest.effort;
  if (rest.rpe !== undefined) row.rpe = rest.rpe;
  if (rest.notes !== undefined) row.notes = rest.notes;

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "Žádná pole k úpravě." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Chyba při úpravě tréninku: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: toSession(data as TrainingRow) });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Chybí id tréninku pro smazání." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: `Chyba při mazání tréninku: ${error.message}` },
      { status: 500 },
    );
  }

  if (!data?.length) {
    return NextResponse.json(
      {
        error:
          "Žádný řádek se nesmazal. V Supabase přidej RLS politiku pro DELETE na tabulku training_sessions (viz README).",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
