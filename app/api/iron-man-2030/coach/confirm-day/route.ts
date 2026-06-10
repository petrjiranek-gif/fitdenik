import { NextResponse } from "next/server";
import { loadCoachData, saveIronManState } from "@/lib/iron-man-2030/coach-load-context";

export async function POST(request: Request) {
  try {
    const loaded = await loadCoachData();
    if (!loaded) {
      return NextResponse.json({ ok: false, error: "Supabase není nakonfigurován." }, { status: 503 });
    }

    const { state } = loaded;
    const body = (await request.json()) as { date: string; sessionId?: string };
    const date = body.date?.trim();
    if (!date) {
      return NextResponse.json({ ok: false, error: "Chybí datum." }, { status: 400 });
    }

    const day = state.calendar[date];
    if (!day?.coachPlanId) {
      return NextResponse.json({ ok: false, error: "Tento den nemá plán od AI trenéra." }, { status: 400 });
    }

    const nextDay = {
      ...day,
      coachConfirmedAt: new Date().toISOString(),
      coachMatchedSessionId: body.sessionId,
    };
    const nextState = {
      ...state,
      calendar: { ...state.calendar, [date]: nextDay },
    };

    const saveErr = await saveIronManState(nextState);
    if (saveErr) {
      return NextResponse.json({ ok: false, error: saveErr }, { status: 500 });
    }

    return NextResponse.json({ ok: true, state: nextState, day: nextDay });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
