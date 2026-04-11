import { NextResponse } from "next/server";
import { createBaselineDefaults } from "@/lib/baseline-defaults";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BaselineInput } from "@/lib/repositories/contracts";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const uid = getFitdenikUserId();
  const { data, error } = await supabase.from("baseline_profiles").select("data").eq("user_id", uid).maybeSingle();

  if (error) {
    return NextResponse.json({ error: `Baseline: ${error.message}` }, { status: 500 });
  }

  const raw = (data?.data as Partial<BaselineInput> | null) ?? {};
  const baseline: BaselineInput = { ...createBaselineDefaults(), ...raw };
  return NextResponse.json({ baseline });
}

export async function PUT(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const body = (await request.json()) as BaselineInput;
  const uid = getFitdenikUserId();

  const { error } = await supabase.from("baseline_profiles").upsert(
    {
      user_id: uid,
      data: body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: `Uložení baseline: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
