import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Denní keep-alive: levné čtení do Supabase, bez zápisu a bez Claude.
 * Vercel Cron volá GET /api/keep-alive jednou denně (viz vercel.json).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, supabase: "missing-config" },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from("training_sessions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", getFitdenikUserId())
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, supabase: "error", message: error.message },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    supabase: "ok",
    ms: Date.now() - started,
  });
}
