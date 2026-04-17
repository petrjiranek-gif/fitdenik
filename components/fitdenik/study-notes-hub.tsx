"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formInputClass } from "@/components/fitdenik/form-fields";

type StudyEntry = {
  id: string;
  createdAt: string;
  block: string;
  title: string;
  note: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  fileSizeBytes: number;
};

const STORAGE_KEY = "fitdenik.studyDocs.v1";

const BLOCK_OPTIONS = [
  "AI modul",
  "Automation & Robotics",
  "IoT",
  "Online Marketing + AI",
  "Project I – Qualitative/Quantitative",
  "Project II – Information Literacy & AI",
  "Project III – Dissertation Writing I",
  "Project IV – Dissertation Writing II",
  "Project V – Defense preparation",
  "Disertace",
  "Jiné",
] as const;

type ApiRow = {
  id: string;
  created_at: string;
  block: string;
  title: string;
  note: string;
  file_name: string;
  mime_type: string;
  data_url: string;
  file_size_bytes: number;
};

function fromApiRow(row: ApiRow): StudyEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    block: row.block,
    title: row.title,
    note: row.note,
    fileName: row.file_name,
    mimeType: row.mime_type,
    dataUrl: row.data_url,
    fileSizeBytes: row.file_size_bytes,
  };
}

function readEntries(): StudyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudyEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeEntries(entries: StudyEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function bytesToHuman(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function toInputDate(iso: string): string {
  return new Date(iso).toLocaleString("cs-CZ", { dateStyle: "medium", timeStyle: "short" });
}

export function StudyNotesHub() {
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [entries, setEntries] = useState<StudyEntry[]>(() => (useSupabase ? [] : readEntries()));
  const [block, setBlock] = useState<string>(BLOCK_OPTIONS[0]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedBlock, setSelectedBlock] = useState<string>("vše");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshRemote = useCallback(async () => {
    const res = await fetch("/api/study-docs", { cache: "no-store" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setError(j.error ?? "Nepodařilo se načíst studijní dokumenty.");
      return;
    }
    const j = (await res.json()) as { entries: ApiRow[] };
    setEntries(j.entries.map(fromApiRow));
  }, []);

  useEffect(() => {
    if (!useSupabase) return;
    void refreshRemote();
  }, [useSupabase, refreshRemote]);

  const filtered = useMemo(
    () => (selectedBlock === "vše" ? entries : entries.filter((x) => x.block === selectedBlock)),
    [entries, selectedBlock],
  );

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    if (file.size > 8 * 1024 * 1024) {
      setError("Soubor je příliš velký (max 8 MB pro lokální uložení).");
      return;
    }
    if (!title.trim()) {
      setError("Doplň název materiálu.");
      return;
    }

    setSaving(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Soubor se nepodařilo načíst."));
        reader.readAsDataURL(file);
      });

      const nextPayload = {
        block,
        title: title.trim(),
        note: note.trim(),
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        fileSizeBytes: file.size,
      };
      if (useSupabase) {
        const response = await fetch("/api/study-docs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextPayload),
        });
        if (!response.ok) {
          const j = (await response.json()) as { error?: string };
          throw new Error(j.error ?? "Uložení do Supabase se nepovedlo.");
        }
        await refreshRemote();
      } else {
        const next: StudyEntry = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          block: nextPayload.block,
          title: nextPayload.title,
          note: nextPayload.note,
          fileName: nextPayload.fileName,
          mimeType: nextPayload.mimeType,
          dataUrl: nextPayload.dataUrl,
          fileSizeBytes: nextPayload.fileSizeBytes,
        };
        const merged = [next, ...entries].slice(0, 120);
        setEntries(merged);
        writeEntries(merged);
      }
      setMessage("Materiál uložen. Je dostupný níže v seznamu.");
      setTitle("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uložení selhalo.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (useSupabase) {
      const response = await fetch(`/api/study-docs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const j = (await response.json()) as { error?: string };
        setError(j.error ?? "Mazání dokumentu se nepovedlo.");
        return;
      }
      await refreshRemote();
      return;
    }
    const next = entries.filter((x) => x.id !== id);
    setEntries(next);
    writeEntries(next);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <h3 className="text-base font-semibold text-zinc-100">Nahrát studijní materiál</h3>
        <p className="mt-1 text-xs text-ew-muted">
          {useSupabase
            ? "Dokumenty se ukládají do Supabase a sdílí se mezi zařízeními."
            : "V1 ukládá dokumenty lokálně v tomto prohlížeči (na daném zařízení). Hodí se na rychlé třídění podkladů po modulech."}
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Blok</span>
            <select value={block} onChange={(e) => setBlock(e.target.value)} className={formInputClass}>
              {BLOCK_OPTIONS.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400">Název materiálu</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Např. Project II – poznámky k AI metodice" className={formInputClass} />
          </label>
        </div>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="text-zinc-400">Poznámka</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={formInputClass} placeholder="Co je v dokumentu důležité, návaznost na disertaci, TODO..." />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:border-ew-blue-light">
            Vybrat soubor
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.rtf,.odt,.ods,.odp"
              className="sr-only"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-xs text-ew-muted">
            {saving ? "Ukládám..." : "Podporováno: PDF, DOCX, PPTX, XLSX, TXT... (max 8 MB na soubor)"}
          </span>
        </div>
        {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-zinc-100">Studijní knihovna</h3>
          <select value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)} className="rounded-md border border-ew-border bg-ew-bg px-3 py-1.5 text-sm text-zinc-200">
            <option value="vše">Všechny bloky</option>
            {BLOCK_OPTIONS.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ew-muted">Zatím tu nic není. Nahraj první studijní dokument.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((x) => (
              <li key={x.id} className="rounded-lg border border-ew-border bg-ew-bg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-zinc-100">{x.title}</p>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{x.block}</span>
                </div>
                <p className="mt-1 text-xs text-ew-muted">
                  {toInputDate(x.createdAt)} · {x.fileName} ({bytesToHuman(x.fileSizeBytes)})
                </p>
                {x.note ? <p className="mt-2 text-sm text-zinc-300">{x.note}</p> : null}
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <a href={x.dataUrl} download={x.fileName} className="text-ew-blue-light hover:underline">
                    Stáhnout
                  </a>
                  <button type="button" onClick={() => void onDelete(x.id)} className="text-rose-300 hover:underline">
                    Smazat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

