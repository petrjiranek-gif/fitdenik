"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { BodyMeasurementEntry } from "@/lib/types";

export default function BodyMetricsPage() {
  const repositories = useMemo(() => getRepositories(), []);
  const useSupabase = process.env.NEXT_PUBLIC_FITDENIK_REPOSITORY === "supabase";
  const [rows, setRows] = useState<BodyMeasurementEntry[]>(() =>
    useSupabase ? [] : [...repositories.bodyMeasurements.list()].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)),
  );

  useEffect(() => {
    if (!useSupabase) return;
    void fetch("/api/body-measurements")
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { entries: BodyMeasurementEntry[] };
        setRows([...result.entries].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)));
      })
      .catch(() => {});
  }, [useSupabase]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Tělesná data</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Historie měření váhy a obvodů. Nový záznam přidáš přes{" "}
            <strong className="font-medium text-zinc-300">Nové měření</strong> v horní liště.
            {useSupabase && " Data jsou v Supabase — stejná na všech zařízeních a doménách."}
          </p>
        </div>
        <Link
          href="/measurements/new"
          className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
        >
          Nové měření
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-ew-border bg-ew-panel">
        <table className="w-full text-sm">
          <thead className="bg-ew-bg text-left text-xs text-ew-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Datum a čas</th>
              <th className="px-3 py-2 font-medium">Váha (kg)</th>
              <th className="px-3 py-2 font-medium">Pas (cm)</th>
              <th className="px-3 py-2 font-medium">Poznámka</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-ew-muted">
                  Zatím žádné měření. Přidej první přes „Nové měření“.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-ew-border text-zinc-300">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.measuredAt).toLocaleString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2">{r.weightKg > 0 ? r.weightKg : "—"}</td>
                  <td className="px-3 py-2">{r.waistCm > 0 ? r.waistCm : "—"}</td>
                  <td className="max-w-xs truncate px-3 py-2 text-ew-muted">{r.notes || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
