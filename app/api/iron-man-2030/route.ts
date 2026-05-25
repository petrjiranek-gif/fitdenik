import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { mergeIronManState } from "@/lib/iron-man-2030/state-merge";
import type { IronMan2030State } from "@/lib/iron-man-2030/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function loadState(): Promise<IronMan2030State | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const uid = getFitdenikUserId();
  const { data, error } = await supabase
    .from("iron_man_2030_state")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return null;
  return mergeIronManState(data?.data);
}

async function saveState(state: IronMan2030State): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return "Supabase není nakonfigurován.";
  const uid = getFitdenikUserId();
  const { error } = await supabase.from("iron_man_2030_state").upsert(
    {
      user_id: uid,
      data: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  return error ? error.message : null;
}

export async function GET() {
  const state = await loadState();
  if (!state) {
    return NextResponse.json(
      { error: "Supabase není nakonfigurován nebo tabulka iron_man_2030_state chybí (spusť migraci 002)." },
      { status: 503 },
    );
  }
  return NextResponse.json({ state });
}

export async function PATCH(request: Request) {
  const current = await loadState();
  if (!current) {
    return NextResponse.json({ error: "Nelze načíst stav modulu." }, { status: 503 });
  }

  const body = (await request.json()) as Partial<IronMan2030State>;
  const next = mergeIronManState({ ...current, ...body, settings: { ...current.settings, ...body.settings } });
  const err = await saveState(next);
  if (err) {
    return NextResponse.json({ error: `Chyba při ukládání: ${err}` }, { status: 500 });
  }
  return NextResponse.json({ state: next });
}
