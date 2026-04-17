import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type StudyDocRow = {
  id: string;
  user_id: string;
  block: string;
  title: string;
  note: string;
  file_name: string;
  mime_type: string;
  data_url: string;
  file_size_bytes: number;
  created_at: string;
};

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const uid = getFitdenikUserId();
  const { data, error } = await supabase
    .from("study_documents")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    return NextResponse.json({ error: `Studijní dokumenty: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ entries: data as StudyDocRow[] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }
  const uid = getFitdenikUserId();
  const payload = (await request.json()) as {
    block: string;
    title: string;
    note: string;
    fileName: string;
    mimeType: string;
    dataUrl: string;
    fileSizeBytes: number;
  };

  const { data, error } = await supabase
    .from("study_documents")
    .insert({
      user_id: uid,
      block: payload.block,
      title: payload.title,
      note: payload.note,
      file_name: payload.fileName,
      mime_type: payload.mimeType,
      data_url: payload.dataUrl,
      file_size_bytes: payload.fileSizeBytes,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: `Uložení dokumentu: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ entry: data as StudyDocRow }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }
  const uid = getFitdenikUserId();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Chybí id dokumentu." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("study_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", uid)
    .select("id");

  if (error) {
    return NextResponse.json({ error: `Mazání dokumentu: ${error.message}` }, { status: 500 });
  }
  if (!data?.length) {
    return NextResponse.json({ error: "Dokument nebyl nalezen nebo chybí RLS DELETE politika." }, { status: 403 });
  }
  return NextResponse.json({ success: true });
}

