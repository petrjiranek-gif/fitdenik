import { NextResponse } from "next/server";
import { ensurePlanDays, replaceDayLineInPlan, swapDaysInPlan } from "@/lib/iron-man-2030/coach-plan-mutate";
import { loadCoachData, saveIronManState } from "@/lib/iron-man-2030/coach-load-context";
import { CoachApiError, callClaudeCoach } from "@/lib/iron-man-2030/coach-client";
import { buildCoachSystemPrompt } from "@/lib/iron-man-2030/coach-prompt";
import type { IronMan2030State, IronManCoachWeeklyPlan } from "@/lib/iron-man-2030/types";

type Body =
  | { action: "swap"; dayA: number; dayB: number }
  | { action: "regenerate"; dayIndex: number; hint?: string }
  | { action: "update"; dayIndex: number; line: string };

function persistPlan(state: IronMan2030State, plan: IronManCoachWeeklyPlan): IronMan2030State {
  return {
    ...state,
    coachWeeklyPlan: plan,
    coachPlanHistory: (state.coachPlanHistory ?? []).map((p) => (p.id === plan.id ? plan : p)),
  };
}

export async function POST(request: Request) {
  try {
    const loaded = await loadCoachData();
    if (!loaded) {
      return NextResponse.json({ ok: false, error: "Supabase není nakonfigurován." }, { status: 503 });
    }

    const { state, promptContext } = loaded;
    const plan = state.coachWeeklyPlan;
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Žádný aktivní plán." }, { status: 400 });
    }
    if (plan.approvedAt) {
      return NextResponse.json({ ok: false, error: "Schválený plán nelze upravovat — vygeneruj nový týden." }, { status: 400 });
    }

    const body = (await request.json()) as Body;
    let nextPlan = ensurePlanDays(plan);

    if (body.action === "swap") {
      if (body.dayA < 0 || body.dayA > 6 || body.dayB < 0 || body.dayB > 6) {
        return NextResponse.json({ ok: false, error: "Neplatný index dne (0–6)." }, { status: 400 });
      }
      nextPlan = swapDaysInPlan(plan, body.dayA, body.dayB);
    } else if (body.action === "update") {
      if (body.dayIndex < 0 || body.dayIndex > 6) {
        return NextResponse.json({ ok: false, error: "Neplatný index dne (0–6)." }, { status: 400 });
      }
      nextPlan = replaceDayLineInPlan(plan, body.dayIndex, body.line);
    } else if (body.action === "regenerate") {
      if (body.dayIndex < 0 || body.dayIndex > 6) {
        return NextResponse.json({ ok: false, error: "Neplatný index dne (0–6)." }, { status: 400 });
      }
      const days = ensurePlanDays(plan).days!;
      const day = days[body.dayIndex];
      const hint = body.hint?.trim();
      const userMessage = [
        `Navrhni jen jeden den týdenního tréninkového plánu.`,
        `Den: ${day.dayLabel} (${day.date})`,
        `Současný návrh: ${day.line}`,
        hint ? `Požadavek atleta: ${hint}` : "Navrhni vhodnou alternativu k současnému návrhu.",
        `Odpověz přesně jedním řádkem ve formátu "${day.dayLabel}: aktivita — délka — cíl".`,
      ].join("\n");

      const line = await callClaudeCoach({
        system: buildCoachSystemPrompt(promptContext),
        messages: [{ role: "user", content: userMessage }],
        maxTokens: 400,
      });

      const firstLine = line.split("\n").map((l) => l.trim()).find(Boolean) ?? line.trim();
      nextPlan = replaceDayLineInPlan(plan, body.dayIndex, firstLine);
    } else {
      return NextResponse.json({ ok: false, error: "Neznámá akce." }, { status: 400 });
    }

    const nextState = persistPlan(state, nextPlan);

    const saveErr = await saveIronManState(nextState);
    if (saveErr) {
      return NextResponse.json({ ok: false, error: saveErr }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      plan: nextPlan,
      state: nextState,
    });
  } catch (err) {
    if (err instanceof CoachApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
