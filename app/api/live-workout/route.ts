import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Volitelné uložení živého výsledku na server. Vyžaduje tabulku např.:
 *
 * create table if not exists live_workout_logs (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text not null,
 *   sport_category text not null,
 *   wod_key text,
 *   wod_name text not null,
 *   duration_sec int not null,
 *   reps_completed int not null,
 *   reps_target int not null,
 *   notes text,
 *   created_at timestamptz default now()
 * );
 */
export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    sportCategory?: string;
    wodKey?: string;
    wodName?: string;
    durationSec?: number;
    repsCompleted?: number;
    repsTarget?: number;
    notes?: string;
  };

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, stored: false });
  }

  const { error } = await supabase.from("live_workout_logs").insert({
    user_id: body.userId ?? "u1",
    sport_category: body.sportCategory ?? "crossfit",
    wod_key: body.wodKey ?? null,
    wod_name: body.wodName ?? "",
    duration_sec: body.durationSec ?? 0,
    reps_completed: body.repsCompleted ?? 0,
    reps_target: body.repsTarget ?? 0,
    notes: body.notes ?? "",
  });

  if (error) {
    return NextResponse.json({ ok: true, stored: false, message: error.message });
  }

  return NextResponse.json({ ok: true, stored: true });
}
