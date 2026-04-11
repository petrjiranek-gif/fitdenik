"use client";

import { useRef, useState } from "react";
import { applyFitdenikBackup, downloadFitdenikBackup } from "@/lib/local-storage-backup";

export function LocalStorageBackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = applyFitdenikBackup(json);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Import hotový — obnovuji stránku…");
      window.setTimeout(() => window.location.reload(), 400);
    } catch {
      setMessage("Soubor nelze načíst (není platné JSON?).");
    }
  };

  return (
    <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
      <h3 className="text-base font-semibold text-white">Záloha dat v tomto prohlížeči</h3>
      <p className="mt-1 text-sm text-zinc-400">
        Baseline, tréninky a další údaje jsou ukládány lokálně podle domény. Stejný kód běží na{" "}
        <span className="text-zinc-300">fitdenik.ewattup.com</span> i na <span className="text-zinc-300">fitdenik.vercel.app</span>, ale
        každá adresa má vlastní úložiště. Stáhni zálohu tam, kde jsou správná čísla, a nahraj ji na druhé doméně.
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Pokud tě přesměrování z <code className="text-zinc-400">vercel.app</code> nepustí na stránku Importy, otevři jednorázově:{" "}
        <code className="break-all text-zinc-400">
          https://fitdenik.vercel.app/imports?fitdenikStayOnHost=1
        </code>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            downloadFitdenikBackup();
            setMessage("Soubor JSON byl stažen.");
          }}
          className="rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Stáhnout zálohu (JSON)
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-ew-blue px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Nahrát zálohu
        </button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
      </div>
      {message && <p className="mt-3 text-sm text-ew-blue">{message}</p>}
    </div>
  );
}
