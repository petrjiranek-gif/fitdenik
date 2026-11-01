import { NextResponse } from "next/server";
import { isCheckInFresh } from "@/lib/iron-man-2030/coach-check-in";
import { lastApprovedWeekStart, planWeekMonday } from "@/lib/iron-man-2030/coach-data";
import { loadCoachData, saveIronManState } from "@/lib/iron-man-2030/coach-load-context";
import { CoachApiError, callClaudeCoach } from "@/lib/iron-man-2030/coach-client";
import { buildCoachSystemPrompt, buildCoachUserMessage } from "@/lib/iron-man-2030/coach-prompt";
import { ensurePlanDays } from "@/lib/iron-man-2030/coach-plan-mutate";
import type { IronManCoachWeeklyPlan } from "@/lib/iron-man-2030/types";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const previewOnly = url.searchParams.get("preview") === "1";

    const loaded = await loadCoachData();
    if (!loaded) {
      return NextResponse.json(
        { ok: false, error: "Supabase není nakonfigurován nebo tabulka iron_man_2030_state chybí." },
        { status: 503 },
      );
    }

    const { state, promptContext } = loaded;
    const now = new Date();
    const weekStart = planWeekMonday(now, lastApprovedWeekStart(state));
    const promptForWeek = { ...promptContext, now, weekStart };
    const system = buildCoachSystemPrompt(promptForWeek);

    if (previewOnly) {
      return NextResponse.json({
        ok: true,
        preview: true,
        system,
      });
    }

    if (!state.coachCheckIn) {
      return NextResponse.json(
        { ok: false, error: "Nejdřív ulož check-in týdne (stav + priorita)." },
        { status: 400 },
      );
    }

    if (!isCheckInFresh(state.coachCheckIn)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Check-in je starší než 7 dní. Vyplň nový check-in před generováním plánu.",
        },
        { status: 400 },
      );
    }

    const markdown = await callClaudeCoach({
      system,
      messages: [{ role: "user", content: buildCoachUserMessage(weekStart) }],
    });

    const plan = ensurePlanDays({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      weekStart,
      markdown,
    });

    const nextState = {
      ...state,
      coachWeeklyPlan: plan,
      coachPlanHistory: [plan, ...(state.coachPlanHistory ?? [])].slice(0, 8),
    };

    const saveErr = await saveIronManState(nextState);
    if (saveErr) {
      return NextResponse.json({ ok: false, error: `Plán vygenerován, ale uložení selhalo: ${saveErr}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      plan,
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
