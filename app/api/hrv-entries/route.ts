import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { HrvEntry, HrvSource } from "@/lib/types";

type Row = {
  id: string;
  user_id: string;
  payload: Omit<HrvEntry, "id" | "userId">;
};

function toEntry(row: Row): HrvEntry {
  return {
    id: row.id,
    userId: row.user_id,
    ...row.payload,
  };
}

function tableHint(errorMessage: string) {
  return errorMessage.includes("Could not find the table")
    ? { hint: "V Supabase → SQL spusť supabase/migrations/003_hrv_entries.sql." }
    : {};
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const uid = getFitdenikUserId();
  const { data, error } = await supabase
    .from("hrv_entries")
    .select("id, user_id, payload")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    return NextResponse.json({ error: `HRV: ${error.message}`, ...tableHint(error.message) }, { status: 500 });
  }

  return NextResponse.json({ entries: (data as Row[]).map(toEntry) });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const body = (await request.json()) as
    | { bulk?: boolean; entries?: Omit<HrvEntry, "id" | "userId">[] }
    | Omit<HrvEntry, "id" | "userId">;

  const uid = getFitdenikUserId();
  const payloads: Omit<HrvEntry, "id" | "userId">[] = [];

  if ("bulk" in body && body.bulk && Array.isArray(body.entries)) {
    payloads.push(...body.entries);
  } else if ("hrvMs" in body && "recordedAt" in body) {
    payloads.push(body);
  } else {
    return NextResponse.json({ error: "Neplatný payload — jeden záznam nebo { bulk: true, entries: [...] }." }, { status: 400 });
  }

  const valid = payloads.filter((p) => p.hrvMs > 0 && p.hrvMs < 500 && p.recordedAt);
  if (valid.length === 0) {
    return NextResponse.json({ error: "Žádný platný HRV záznam k uložení." }, { status: 400 });
  }

  const rows = valid.map((payload) => ({
    user_id: uid,
    payload: {
      ...payload,
      source: (payload.source ?? "manual") as HrvSource,
    },
  }));

  const { data, error } = await supabase.from("hrv_entries").insert(rows).select("id, user_id, payload");

  if (error) {
    return NextResponse.json({ error: `Uložení HRV: ${error.message}`, ...tableHint(error.message) }, { status: 500 });
  }

  return NextResponse.json(
    { entries: (data as Row[]).map(toEntry), count: (data as Row[]).length },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Chybí id záznamu." }, { status: 400 });
  }

  const uid = getFitdenikUserId();
  const { data, error } = await supabase.from("hrv_entries").delete().eq("id", id).eq("user_id", uid).select("id");

  if (error) {
    return NextResponse.json({ error: `Smazání HRV: ${error.message}` }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
