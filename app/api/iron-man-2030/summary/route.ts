import { NextResponse } from "next/server";
import { getFitdenikUserId } from "@/lib/fitdenik-user-id";
import {
  computeDisciplineBreakdown,
  computePhaseCompletion,
  computeProjectStats,
  computeWeightProgress,
  getActivePhase,
  mergeCalendarWithTrainings,
  missedDaysWithReasons,
} from "@/lib/iron-man-2030/compute";
import { IRON_MAN_PROJECT_START } from "@/lib/iron-man-2030/constants";
import { mergeIronManState } from "@/lib/iron-man-2030/state-merge";
import { coerceSportType } from "@/lib/sport-type";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { computeHrvTrend } from "@/lib/hrv/compute";
import type { BodyMeasurementEntry, HrvEntry, TrainingSession } from "@/lib/types";

type TrainingRow = {
  id: string;
  user_id: string;
  date: string;
  sport_type: string;
  title: string;
  duration_min: number;
  distance_km: number;
  avg_heart_rate: number;
  calories: number;
  elevation: number;
  pace: string;
  effort: string;
  rpe: number;
  notes: string;
  iron_man_2030_project?: boolean;
  iron_man_discipline?: string | null;
};

function toSession(row: TrainingRow): TrainingSession {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    sportType: coerceSportType(row.sport_type),
    title: row.title,
    durationMin: Math.round(Number(row.duration_min)) || 0,
    distanceKm: Number(row.distance_km),
    avgHeartRate: Math.round(Number(row.avg_heart_rate)) || 0,
    calories: Math.round(Number(row.calories)) || 0,
    elevation: Math.round(Number(row.elevation)) || 0,
    pace: row.pace ?? "",
    effort: row.effort ?? "",
    rpe: Math.round(Number(row.rpe)) || 0,
    notes: row.notes ?? "",
    ironMan2030Project: Boolean(row.iron_man_2030_project),
    ironManDiscipline: row.iron_man_discipline as TrainingSession["ironManDiscipline"],
  };
}

function toHrvEntry(row: { id: string; user_id: string; payload: Record<string, unknown> }): HrvEntry {
  const p = row.payload;
  return {
    id: row.id,
    userId: row.user_id,
    recordedAt: String(p.recordedAt ?? ""),
    hrvMs: Math.round(Number(p.hrvMs)) || 0,
    source: (p.source as HrvEntry["source"]) ?? "manual",
    sourceLabel: p.sourceLabel ? String(p.sourceLabel) : undefined,
    notes: p.notes ? String(p.notes) : undefined,
  };
}

function toBodyEntry(row: { id: string; user_id: string; payload: Record<string, unknown> }): BodyMeasurementEntry {
  const p = row.payload;
  return {
    id: row.id,
    userId: row.user_id,
    measuredAt: String(p.measuredAt ?? ""),
    weightKg: Number(p.weightKg) || 0,
    scaleBmi: Number(p.scaleBmi) || 0,
    scaleBodyFatPct: Number(p.scaleBodyFatPct) || 0,
    scaleMuscleMassKg: Number(p.scaleMuscleMassKg) || 0,
    scaleBodyWaterPct: Number(p.scaleBodyWaterPct) || 0,
    scaleLeanMassKg: Number(p.scaleLeanMassKg) || 0,
    scaleBoneMassKg: Number(p.scaleBoneMassKg) || 0,
    scaleProteinPct: Number(p.scaleProteinPct) || 0,
    scaleVisceralFat: Number(p.scaleVisceralFat) || 0,
    scaleBmrKcal: Number(p.scaleBmrKcal) || 0,
    scaleMetabolicAge: Number(p.scaleMetabolicAge) || 0,
    neckCm: Number(p.neckCm) || 0,
    chestRelaxedCm: Number(p.chestRelaxedCm) || 0,
    chestFlexedCm: Number(p.chestFlexedCm) || 0,
    armRelaxedCm: Number(p.armRelaxedCm) || 0,
    armFlexedCm: Number(p.armFlexedCm) || 0,
    waistCm: Number(p.waistCm) || 0,
    hipsCm: Number(p.hipsCm) || 0,
    thighCm: Number(p.thighCm) || 0,
    calfCm: Number(p.calfCm) || 0,
    notes: String(p.notes ?? ""),
  };
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase není nakonfigurován." }, { status: 503 });
  }

  const uid = getFitdenikUserId();

  const [stateRes, trainingRes, bodyRes, hrvRes] = await Promise.all([
    supabase.from("iron_man_2030_state").select("data").eq("user_id", uid).maybeSingle(),
    supabase
      .from("training_sessions")
      .select("*")
      .eq("user_id", uid)
      .gte("date", IRON_MAN_PROJECT_START)
      .order("date", { ascending: false })
      .limit(500),
    supabase.from("body_measurement_entries").select("id, user_id, payload").eq("user_id", uid).limit(200),
    supabase.from("hrv_entries").select("id, user_id, payload").eq("user_id", uid).limit(400),
  ]);

  if (trainingRes.error) {
    return NextResponse.json({ error: trainingRes.error.message }, { status: 500 });
  }

  const state = mergeIronManState(stateRes.data?.data);
  const sessions = ((trainingRes.data ?? []) as TrainingRow[]).map(toSession);
  const bodyEntries = ((bodyRes.data ?? []) as { id: string; user_id: string; payload: Record<string, unknown> }[]).map(
    toBodyEntry,
  );
  const hrvEntries = ((hrvRes.data ?? []) as { id: string; user_id: string; payload: Record<string, unknown> }[]).map(
    toHrvEntry,
  );

  const phase = getActivePhase();
  const calendar = mergeCalendarWithTrainings(state.calendar, sessions);

  return NextResponse.json({
    state: { ...state, calendar },
    sessions,
    bodyEntries,
    hrvEntries,
    hrvTrend: computeHrvTrend(hrvEntries),
    phase,
    projectStats: computeProjectStats(sessions),
    disciplineHours: computeDisciplineBreakdown(sessions, "hours"),
    disciplineCalories: computeDisciplineBreakdown(sessions, "calories"),
    weightProgress: computeWeightProgress(bodyEntries),
    phaseCompletion: computePhaseCompletion(sessions, phase, phase.id),
    missedDays: missedDaysWithReasons({ ...state, calendar }, sessions),
  });
}
