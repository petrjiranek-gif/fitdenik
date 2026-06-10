"use client";

import { useEffect, useState } from "react";
import { isCheckInFresh } from "@/lib/iron-man-2030/coach-check-in";
import { formatDateCs } from "@/lib/iron-man-2030/coach-data";
import type { IronMan2030State, IronManCoachCheckIn, IronManCoachWeeklyPlan } from "@/lib/iron-man-2030/types";

export function CoachPlanPanel({
  lastCheckIn,
  weeklyPlan,
  useSupabase,
  onStateChange,
}: {
  lastCheckIn: IronManCoachCheckIn | null | undefined;
  weeklyPlan: IronManCoachWeeklyPlan | null | undefined;
  useSupabase: boolean;
  onStateChange: (state: IronMan2030State) => void;
}) {
  const [loading, setLoading] = useState<"generate" | "approve" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<IronManCoachWeeklyPlan | null | undefined>(weeklyPlan);

  useEffect(() => {
    setPlan(weeklyPlan);
  }, [weeklyPlan]);

  const checkInOk = isCheckInFresh(lastCheckIn);
  const canGenerate = useSupabase && checkInOk && lastCheckIn?.feeling && lastCheckIn?.priority;
  const canApprove = useSupabase && plan && !plan.approvedAt;

  const handleGenerate = async () => {
    setError(null);
    setLoading("generate");
    try {
      const res = await fetch("/api/iron-man-2030/coach/generate", { method: "POST" });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        plan?: IronManCoachWeeklyPlan;
        state?: IronMan2030State;
      };
      if (!res.ok || !j.ok || !j.plan) {
        setError(j.error ?? "Generování selhalo.");
        return;
      }
      setPlan(j.plan);
      if (j.state) onStateChange(j.state);
    } catch {
      setError("Síťová chyba při generování plánu.");
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async () => {
    setError(null);
    setLoading("approve");
    try {
      const res = await fetch("/api/iron-man-2030/coach/approve", { method: "POST" });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        plan?: IronManCoachWeeklyPlan;
        state?: IronMan2030State;
        calendarDaysUpdated?: number;
      };
      if (!res.ok || !j.ok) {
        setError(j.error ?? "Schválení selhalo.");
        return;
      }
      if (j.plan) setPlan(j.plan);
      if (j.state) onStateChange(j.state);
    } catch {
      setError("Síťová chyba při schvalování plánu.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-violet-100">AI Trenér — plán týdne</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Vygeneruje plán na příští týden (Po–Ne) podle check-inu, HRV, váhy a tréninků z deníku.
          </p>
        </div>
        {plan?.approvedAt ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-xs text-emerald-300">
            Schváleno
          </span>
        ) : plan ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-0.5 text-xs text-amber-200">
            Návrh
          </span>
        ) : null}
      </div>

      {!useSupabase && (
        <p className="mt-3 text-sm text-amber-200/90">
          Generování plánu vyžaduje Supabase režim (server volá Claude API a ukládá stav).
        </p>
      )}

      {useSupabase && !checkInOk && (
        <p className="mt-3 text-sm text-amber-200/90">
          Pro generování potřebuješ aktuální check-in (platnost 7 dní).
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canGenerate || loading !== null}
          onClick={() => void handleGenerate()}
          className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "generate" ? "Generuji…" : "Vygenerovat plán týdne"}
        </button>

        {canApprove && (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleApprove()}
            className="rounded-md border border-emerald-500/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "approve" ? "Ukládám…" : "Schválit a zapsat do kalendáře"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {plan && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-zinc-500">
            Týden od {formatDateCs(plan.weekStart)} · vygenerováno{" "}
            {new Date(plan.createdAt).toLocaleString("cs-CZ")}
            {plan.approvedAt
              ? ` · schváleno ${new Date(plan.approvedAt).toLocaleString("cs-CZ")}`
              : null}
          </p>
          <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-ew-border/60 bg-ew-bg/60 p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">{plan.markdown}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
