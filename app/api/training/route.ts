import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { coerceSportType } from "@/lib/sport-type";
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
    /** DB / PostgREST může vracet jiné casing než enum v aplikaci → select musí dostat kanonický SportType. */
    sportType: coerceSportType(row.sport_type),
    title: row.title,
    durationMin: Math.round(Number(row.duration_min)) || 0,
    distanceKm: Number(row.distance_km),
    avgHeartRate: Math.round(Number(row.avg_heart_rate)) || 0,
    calories: Math.round(Number(row.calories)) || 0,
    elevation: Math.round(Number(row.elevation)) || 0,
    pace: row.pace ?? "",
    effort: row.effort ?? "",
    rpe: Math.round(Number(row.rpe)) || 0,
    notes: row.notes ?? "",
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
    .eq("user_id", getFitdenikUserId())
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
    user_id: getFitdenikUserId(),
    date: payload.date,
    sport_type: coerceSportType(payload.sportType),
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
  if (rest.sportType !== undefined) row.sport_type = coerceSportType(rest.sportType);
  if (rest.title !== undefined) row.title = rest.title;
  if (rest.durationMin !== undefined) row.duration_min = Math.round(Number(rest.durationMin)) || 0;
  if (rest.distanceKm !== undefined) row.distance_km = Number(rest.distanceKm);
  if (rest.avgHeartRate !== undefined) row.avg_heart_rate = Math.round(Number(rest.avgHeartRate)) || 0;
  if (rest.calories !== undefined) row.calories = Math.round(Number(rest.calories)) || 0;
  if (rest.elevation !== undefined) row.elevation = Math.round(Number(rest.elevation)) || 0;
  if (rest.pace !== undefined) row.pace = rest.pace;
  if (rest.effort !== undefined) row.effort = rest.effort;
  if (rest.rpe !== undefined) row.rpe = Math.round(Number(rest.rpe)) || 0;
  if (rest.notes !== undefined) row.notes = rest.notes;

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "Žádná pole k úpravě." }, { status: 400 });
  }

  // Bez .single(): při RLS nebo prázdném RETURNING PostgREST občas vrátí 0 řádků a .single() hodí
  // „Cannot coerce the result to a single JSON object“.
  const { data: updatedRows, error: updateError } = await supabase
    .from("training_sessions")
    .update(row)
    .eq("id", id)
    .eq("user_id", getFitdenikUserId())
    .select("*");

  if (updateError) {
    return NextResponse.json(
      { error: `Chyba při úpravě tréninku: ${updateError.message}` },
      { status: 500 },
    );
  }

  let dataRow = updatedRows?.[0] as TrainingRow | undefined;
  if (!dataRow) {
    const { data: fetched, error: fetchError } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", getFitdenikUserId())
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        {
          error: `Chyba při načtení upraveného tréninku: ${fetchError.message}`,
        },
        { status: 500 },
      );
    }
    if (!fetched) {
      return NextResponse.json(
        {
          error:
            "Žádný řádek se neaktualizoval nebo ho nelze načíst. Zkontroluj RLS (UPDATE a SELECT) na tabulce training_sessions.",
        },
        { status: 404 },
      );
    }
    dataRow = fetched as TrainingRow;
  }

  return NextResponse.json({ session: toSession(dataRow) });
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
    .eq("user_id", getFitdenikUserId())
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
