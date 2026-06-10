import { NextResponse } from "next/server";
import { IRON_MAN_COACH_MODEL } from "@/lib/iron-man-2030/coach-config";
import { CoachApiError, callClaudeCoach } from "@/lib/iron-man-2030/coach-client";

/**
 * Minimální test spojení s Claude API.
 * Volání stojí pár tokenů — používej jen pro ověření po nastavení klíče.
 */
export async function POST() {
  try {
    const reply = await callClaudeCoach({
      system:
        "Jsi testovací endpoint FitDenik AI Trenéra. Odpověz přesně jedním slovem: OK",
      messages: [{ role: "user", content: "Ping" }],
      maxTokens: 16,
    });

    return NextResponse.json({
      ok: true,
      model: IRON_MAN_COACH_MODEL,
      reply,
    });
  } catch (err) {
    if (err instanceof CoachApiError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Neznámá chyba";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
