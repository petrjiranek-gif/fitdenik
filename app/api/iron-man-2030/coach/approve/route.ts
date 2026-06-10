import { NextResponse } from "next/server";
import { applyWeeklyPlanToCalendar } from "@/lib/iron-man-2030/coach-plan-apply";
import { loadCoachData, saveIronManState } from "@/lib/iron-man-2030/coach-load-context";

export async function POST() {
  try {
    const loaded = await loadCoachData();
    if (!loaded) {
      return NextResponse.json(
        { ok: false, error: "Supabase není nakonfigurován nebo tabulka iron_man_2030_state chybí." },
        { status: 503 },
      );
    }

    const { state } = loaded;
    const plan = state.coachWeeklyPlan;
    if (!plan?.markdown) {
      return NextResponse.json({ ok: false, error: "Žádný plán ke schválení. Nejdřív vygeneruj plán." }, { status: 400 });
    }

    if (plan.approvedAt) {
      return NextResponse.json({ ok: false, error: "Tento plán je už schválený." }, { status: 400 });
    }

    const calendarPatch = applyWeeklyPlanToCalendar(
      plan.markdown,
      plan.weekStart,
      state.settings.regenerationWeekday,
    );

    const approvedPlan = { ...plan, approvedAt: new Date().toISOString() };
    const nextCalendar = { ...state.calendar, ...calendarPatch };
    const nextState = {
      ...state,
      calendar: nextCalendar,
      coachWeeklyPlan: approvedPlan,
      coachPlanHistory: (state.coachPlanHistory ?? []).map((p) => (p.id === plan.id ? approvedPlan : p)),
    };

    const saveErr = await saveIronManState(nextState);
    if (saveErr) {
      return NextResponse.json({ ok: false, error: `Schválení selhalo: ${saveErr}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      plan: approvedPlan,
      calendarDaysUpdated: Object.keys(calendarPatch).length,
      state: nextState,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
