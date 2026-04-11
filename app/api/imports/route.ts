import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ImportRow = {
  id: string;
  user_id: string;
  created_at: string;
  source_app: string;
  image_name: string;
  import_target: "training" | "nutrition";
  parsed_json: Record<string, string | number>;
  status: "draft" | "saved" | "converted";
};

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("screenshot_imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: `Chyba při načítání importů: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ imports: data as ImportRow[] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    userId: string;
    sourceApp: string;
    imageName: string;
    importTarget: "training" | "nutrition";
    parsedJson: Record<string, string | number>;
    status: "draft" | "saved" | "converted";
  };

  const { data, error } = await supabase
    .from("screenshot_imports")
    .insert({
      user_id: payload.userId,
      source_app: payload.sourceApp,
      image_name: payload.imageName,
      import_target: payload.importTarget,
      parsed_json: payload.parsedJson,
      status: payload.status,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: `Chyba při ukládání importu: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ importRecord: data as ImportRow }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Chybí id importu pro smazání." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("screenshot_imports")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: `Chyba při mazání importu: ${error.message}` }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json(
      {
        error:
          "Žádný řádek se nesmazal. V Supabase přidej RLS politiku pro DELETE na tabulku screenshot_imports (viz README).",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
