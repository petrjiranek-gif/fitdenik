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

  const uid = getFitdenikUserId();

  // Několik levných SELECT head/count — čisté čtení, žádný zápis.
  const checks = await Promise.all([
    supabase
      .from("training_sessions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", uid)
      .limit(1),
    supabase
      .from("nutrition_entries")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", uid)
      .limit(1),
    supabase
      .from("benchmark_results")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", uid)
      .limit(1),
  ]);

  const failed = checks.find((c) => c.error);
  if (failed?.error) {
    return NextResponse.json(
      { ok: false, supabase: "error", message: failed.error.message },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    supabase: "ok",
    queries: checks.length,
    ms: Date.now() - started,
  });
}
