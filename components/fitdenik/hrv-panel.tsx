"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formInputClass } from "@/components/fitdenik/form-fields";
import { computeHrvTrend } from "@/lib/hrv/compute";
import { HRV_SOURCE_OPTIONS, parseHrvImportText } from "@/lib/hrv/parse-import";
import { getRepositories } from "@/lib/repositories/provider";
import { datetimeLocalValueToIso, isoToDatetimeLocalValue } from "@/lib/datetime-local";
import type { HrvEntry, HrvSource } from "@/lib/types";

const TREND_COLORS: Record<string, string> = {
  stabilní: "text-emerald-300 border-emerald-500/40 bg-emerald-950/30",
  klesající: "text-amber-200 border-amber-500/40 bg-amber-950/30",
  rostoucí: "text-sky-200 border-sky-500/40 bg-sky-950/30",
  nedostatek_dat: "text-zinc-400 border-ew-border bg-ew-bg",
};

export function HrvPanel() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";

  const [entries, setEntries] = useState<HrvEntry[]>(() =>
    useSupabase ? [] : [...repositories.hrv.list()].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [hrvMs, setHrvMs] = useState("");
  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString());
  const [source, setSource] = useState<HrvSource>("apple_watch");
  const [sourceLabel, setSourceLabel] = useState("");
  const [notes, setNotes] = useState("");

  const [importText, setImportText] = useState("");
  const [importSource, setImportSource] = useState<HrvSource>("apple_watch");
  const [importSourceLabel, setImportSourceLabel] = useState("");

  const reload = useCallback(async () => {
    if (!useSupabase) {
      setEntries([...repositories.hrv.list()].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
      return;
    }
    const res = await fetch("/api/hrv-entries", { cache: "no-store" });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string; hint?: string };
      setError([j.error, j.hint].filter(Boolean).join(" "));
      return;
    }
    const j = (await res.json()) as { entries: HrvEntry[] };
    setEntries([...j.entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)));
    setError(null);
  }, [repositories, useSupabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const trend = useMemo(() => computeHrvTrend(entries), [entries]);

  const saveOne = async (payload: Omit<HrvEntry, "id" | "userId">) => {
    if (useSupabase) {
      const res = await fetch("/api/hrv-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string; hint?: string };
        throw new Error([j.error, j.hint].filter(Boolean).join(" "));
      }
      return;
    }
    repositories.hrv.create(payload);
  };

  const onManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const ms = Math.round(Number(hrvMs.replace(",", ".")));
    if (!Number.isFinite(ms) || ms <= 0 || ms >= 500) {
      setError("Zadej HRV v ms (typicky 20–120).");
      return;
    }
    try {
      await saveOne({
        recordedAt,
        hrvMs: ms,
        source,
        sourceLabel: source === "other_app" ? sourceLabel.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
      });
      setHrvMs("");
      setNotes("");
      setMessage("HRV záznam uložen.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení se nezdařilo.");
    }
  };

  const onBulkImport = async () => {
    setError(null);
    setMessage(null);
    const parsed = parseHrvImportText(importText);
    if (parsed.rows.length === 0) {
      setError(parsed.errors[0]?.message ?? "Žádný řádek k importu.");
      return;
    }
    const payloads = parsed.rows.map((r) => ({
      recordedAt: r.recordedAt,
      hrvMs: r.hrvMs,
      source: importSource,
      sourceLabel: importSource === "other_app" ? importSourceLabel.trim() || undefined : undefined,
      notes: "Import hromadný",
    }));

    try {
      if (useSupabase) {
        const res = await fetch("/api/hrv-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: true, entries: payloads }),
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string; hint?: string };
          throw new Error([j.error, j.hint].filter(Boolean).join(" "));
        }
        const j = (await res.json()) as { count: number };
        setMessage(`Importováno ${j.count} záznamů.${parsed.errors.length ? ` ${parsed.errors.length} řádků přeskočeno.` : ""}`);
      } else {
        repositories.hrv.createMany(payloads);
        setMessage(`Importováno ${payloads.length} záznamů.`);
      }
      setImportText("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import se nezdařil.");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Smazat tento HRV záznam?")) return;
    setDeletingId(id);
    setError(null);
    if (useSupabase) {
      const res = await fetch(`/api/hrv-entries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? "Smazání se nezdařilo.");
        setDeletingId(null);
        return;
      }
    } else {
      repositories.hrv.delete(id);
    }
    setDeletingId(null);
    await reload();
  };

  return (
    <section id="hrv" className="space-y-4 scroll-mt-20">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">HRV (variabilita srdečního tepu)</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">
          Pro AI trenéra a Iron Man 2030. Hodnota v <strong className="font-medium text-zinc-300">ms</strong> z Apple
          Watch (aplikace Zdraví), jiné aplikace nebo ručně. Trend počítáme z posledních 7 dní.
        </p>
      </div>

      <div className={`rounded-xl border p-4 ${TREND_COLORS[trend.label] ?? TREND_COLORS.nedostatek_dat}`}>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Trend (7 dní)</p>
        <p className="mt-1 text-xl font-semibold capitalize">{trend.coachLabel}</p>
        <p className="mt-2 text-sm opacity-90">
          {trend.daysInWindow}/7 dní s daty
          {trend.avg7d != null ? ` · průměr ${trend.avg7d} ms` : ""}
          {trend.latestMs != null ? ` · poslední ${trend.latestMs} ms` : ""}
        </p>
        {trend.label === "klesající" && (
          <p className="mt-2 text-xs opacity-90">
            Klesající HRV 3+ dny za sebou — trenér upřednostní regeneraci před objemem.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={(e) => void onManualSubmit(e)} className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Ruční záznam / jedna hodnota</h3>
          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-xs text-zinc-400">
              Datum a čas měření
              <input
                type="datetime-local"
                value={isoToDatetimeLocalValue(recordedAt)}
                onChange={(e) => setRecordedAt(datetimeLocalValueToIso(e.target.value))}
                className={formInputClass}
              />
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={hrvMs}
              onChange={(e) => setHrvMs(e.target.value)}
              placeholder="HRV (ms), např. 45"
              className={formInputClass}
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as HrvSource)}
              className={formInputClass}
            >
              {HRV_SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {source === "other_app" && (
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="Název aplikace (Garmin, Whoop…)"
                className={formInputClass}
              />
            )}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Poznámka (volitelné)"
              className={formInputClass}
            />
            <button type="submit" className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark">
              Uložit HRV
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-ew-border bg-ew-panel p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Import z Apple Watch / jiné app</h3>
          <p className="mt-2 text-xs text-zinc-500">
            V <strong>Zdraví</strong> → Procházet → Srdeční → Variabilita srdečního tepu → zapiš denní hodnoty (ms).
            Jedna hodnota na řádek, např. <code className="text-zinc-400">2026-06-10 45</code> nebo{" "}
            <code className="text-zinc-400">10.6.2026; 42 ms</code>.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder={"# příklad\n2026-06-08 52\n2026-06-09 48\n2026-06-10 45"}
            className={`${formInputClass} mt-3 font-mono text-xs`}
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              value={importSource}
              onChange={(e) => setImportSource(e.target.value as HrvSource)}
              className={formInputClass}
            >
              {HRV_SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {importSource === "other_app" && (
              <input
                type="text"
                value={importSourceLabel}
                onChange={(e) => setImportSourceLabel(e.target.value)}
                placeholder="Název aplikace"
                className={formInputClass}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => void onBulkImport()}
            className="mt-3 rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:border-ew-blue-light"
          >
            Importovat řádky
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ew-border bg-ew-panel">
        <table className="w-full text-sm">
          <thead className="bg-ew-bg text-left text-xs text-ew-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Datum</th>
              <th className="px-3 py-2 font-medium">HRV (ms)</th>
              <th className="px-3 py-2 font-medium">Zdroj</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-ew-muted">
                  Zatím žádné HRV. Přidej dnešní hodnotu z Apple Watch nebo ručně.
                </td>
              </tr>
            ) : (
              entries.slice(0, 30).map((e) => (
                <tr key={e.id} className="border-t border-ew-border text-zinc-300">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(e.recordedAt).toLocaleString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">{e.hrvMs}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {HRV_SOURCE_OPTIONS.find((o) => o.value === e.source)?.label ?? e.source}
                    {e.sourceLabel ? ` · ${e.sourceLabel}` : ""}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void onDelete(e.id)}
                      disabled={deletingId === e.id}
                      className="text-rose-400 hover:underline disabled:opacity-50"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
