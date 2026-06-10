"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isCheckInFresh } from "@/lib/iron-man-2030/coach-check-in";
import { formatDateCs } from "@/lib/iron-man-2030/coach-data";
import { ensurePlanDays } from "@/lib/iron-man-2030/coach-plan-mutate";
import { PLAN_DAY_LABELS } from "@/lib/iron-man-2030/coach-plan-parse";
import type {
  IronMan2030State,
  IronManCoachCheckIn,
  IronManCoachPlanDay,
  IronManCoachWeeklyPlan,
} from "@/lib/iron-man-2030/types";

const KIND_LABEL: Record<IronManCoachPlanDay["kind"], string> = {
  training: "Trénink",
  rest: "Volno",
  regeneration: "Regenerace",
};

function CoachPlanDayCard({
  day,
  dayIndex,
  editable,
  busy,
  onSwap,
  onRegenerate,
}: {
  day: IronManCoachPlanDay;
  dayIndex: number;
  editable: boolean;
  busy: boolean;
  onSwap: (targetIndex: number) => void;
  onRegenerate: (hint: string) => void;
}) {
  const [swapTarget, setSwapTarget] = useState("");
  const [hint, setHint] = useState("");
  const [showRegen, setShowRegen] = useState(false);

  return (
    <div className="rounded-lg border border-ew-border/70 bg-ew-bg/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-100">
            {day.dayLabel}{" "}
            <span className="font-normal text-zinc-500">· {formatDateCs(day.date)}</span>
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
              day.kind === "training"
                ? "bg-emerald-900/50 text-emerald-300"
                : day.kind === "regeneration"
                  ? "bg-amber-900/40 text-amber-200"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {KIND_LABEL[day.kind]}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{day.line}</p>

      {editable && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-ew-border/40 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={swapTarget}
              disabled={busy}
              onChange={(e) => setSwapTarget(e.target.value)}
              className="rounded border border-ew-border bg-ew-bg px-2 py-1 text-xs text-zinc-300"
            >
              <option value="">Vyměnit s dnem…</option>
              {PLAN_DAY_LABELS.map((label, i) =>
                i === dayIndex ? null : (
                  <option key={label} value={String(i)}>
                    {label}
                  </option>
                ),
              )}
            </select>
            <button
              type="button"
              disabled={busy || swapTarget === ""}
              onClick={() => {
                onSwap(Number(swapTarget));
                setSwapTarget("");
              }}
              className="rounded border border-ew-border px-2 py-1 text-xs text-zinc-300 hover:bg-ew-panel disabled:opacity-50"
            >
              Vyměnit
            </button>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowRegen((v) => !v)}
            className="rounded border border-violet-500/40 px-2 py-1 text-xs text-violet-200 hover:bg-violet-950/40 disabled:opacity-50"
          >
            Jiný návrh
          </button>
        </div>
      )}

      {editable && showRegen && (
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={hint}
            disabled={busy}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Co změnit? (volitelné)"
            className="min-w-[12rem] flex-1 rounded border border-ew-border bg-ew-bg px-2 py-1 text-xs text-zinc-200"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onRegenerate(hint);
              setHint("");
              setShowRegen(false);
            }}
            className="rounded bg-violet-800 px-3 py-1 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {busy ? "…" : "Navrhnout"}
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [dayBusy, setDayBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<IronManCoachWeeklyPlan | null | undefined>(weeklyPlan);

  useEffect(() => {
    setPlan(weeklyPlan);
  }, [weeklyPlan]);

  const checkInOk = isCheckInFresh(lastCheckIn);
  const canGenerate = useSupabase && checkInOk && lastCheckIn?.feeling && lastCheckIn?.priority;
  const canApprove = useSupabase && plan && !plan.approvedAt;
  const editable = Boolean(plan && !plan.approvedAt);
  const days = plan ? ensurePlanDays(plan).days ?? [] : [];

  const runPlanDay = async (body: Record<string, unknown>, busyIndex?: number) => {
    setError(null);
    setDayBusy(busyIndex ?? null);
    try {
      const res = await fetch("/api/iron-man-2030/coach/plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        plan?: IronManCoachWeeklyPlan;
        state?: IronMan2030State;
      };
      if (!res.ok || !j.ok || !j.plan) {
        setError(j.error ?? "Úprava dne selhala.");
        return;
      }
      setPlan(j.plan);
      if (j.state) onStateChange(j.state);
    } catch {
      setError("Síťová chyba při úpravě plánu.");
    } finally {
      setDayBusy(null);
    }
  };

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
            Uprav dny před schválením (výměna volna, jiný trénink). Po schválení kalendář čeká na potvrzení importem.
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
          disabled={!canGenerate || loading !== null || dayBusy !== null}
          onClick={() => void handleGenerate()}
          className="rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "generate" ? "Generuji…" : "Vygenerovat plán týdne"}
        </button>

        {canApprove && (
          <button
            type="button"
            disabled={loading !== null || dayBusy !== null}
            onClick={() => void handleApprove()}
            className="rounded-md border border-emerald-500/50 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "approve" ? "Ukládám…" : "Schválit a zapsat do kalendáře"}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {plan && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-zinc-500">
            Týden od {formatDateCs(plan.weekStart)} · vygenerováno{" "}
            {new Date(plan.createdAt).toLocaleString("cs-CZ")}
            {plan.approvedAt
              ? ` · schváleno ${new Date(plan.approvedAt).toLocaleString("cs-CZ")}`
              : null}
          </p>

          {editable && (
            <p className="text-xs text-violet-300/80">
              Tip: u volna/regenerace vyber „Vyměnit s dnem…“ a přesuň ho na jiný den v týdnu.
            </p>
          )}

          <div className="space-y-2">
            {days.map((day, index) => (
              <CoachPlanDayCard
                key={day.date}
                day={day}
                dayIndex={index}
                editable={editable}
                busy={dayBusy === index}
                onSwap={(target) => void runPlanDay({ action: "swap", dayA: index, dayB: target })}
                onRegenerate={(hint) =>
                  void runPlanDay({ action: "regenerate", dayIndex: index, hint: hint || undefined }, index)
                }
              />
            ))}
          </div>

          {plan.approvedAt && (
            <p className="text-xs text-zinc-500">
              V kalendáři níže u každého dne uvidíš ☐/✓ — po importu tréninku se den automaticky potvrdí.{" "}
              <Link href="/imports" className="text-violet-300 hover:underline">
                Importy
              </Link>
            </p>
          )}

          <details className="text-xs text-zinc-600">
            <summary className="cursor-pointer text-zinc-500">Celý text plánu</summary>
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-ew-border/40 p-2 text-zinc-400">
              {plan.markdown}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
