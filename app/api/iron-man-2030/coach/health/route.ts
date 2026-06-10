import { NextResponse } from "next/server";
import { IRON_MAN_COACH_MODEL, isCoachApiConfigured } from "@/lib/iron-man-2030/coach-config";

/** Kontrola, zda je AI trenér na serveru připraven (bez odhalení klíče). */
export async function GET() {
  return NextResponse.json({
    configured: isCoachApiConfigured(),
    model: IRON_MAN_COACH_MODEL,
    hint: isCoachApiConfigured()
      ? "API klíč je nastavený. Pro ověření spojení zavolej POST /api/iron-man-2030/coach/test"
      : "Přidej ANTHROPIC_API_KEY do .env.local (lokálně) nebo do Vercel Environment Variables (produkce).",
  });
}
