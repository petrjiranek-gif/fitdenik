import { userProfile } from "@/lib/mock-data";
import type { BaselineInput } from "@/lib/repositories/contracts";

/** Jednotný výchozí stav baseline (localStorage i náhradní Supabase). */
export function createBaselineDefaults(): BaselineInput {
  return {
    age: userProfile.age,
    heightCm: userProfile.heightCm,
    baselineWeightKg: userProfile.baselineWeightKg,
    waistCm: userProfile.waistCm,
    estimatedBodyFatPct: userProfile.estimatedBodyFatPct,
    restingHeartRate: userProfile.restingHeartRate,
    activityLevel: userProfile.activityLevel,
    goalsText: userProfile.goals.join(", "),
    limitations: userProfile.limitations,
    notes: userProfile.notes,
    targetWeightKg: 0,
    targetDate: "",
    scaleMeasuredAt: "",
    scaleBmi: 0,
    scaleBodyFatPct: 0,
    scaleMuscleMassKg: 0,
    scaleBodyWaterPct: 0,
    scaleLeanMassKg: 0,
    scaleBoneMassKg: 0,
    scaleProteinPct: 0,
    scaleVisceralFat: 0,
    scaleBmrKcal: 0,
    scaleMetabolicAge: 0,
    neckCm: 0,
    chestRelaxedCm: 0,
    chestFlexedCm: 0,
    armRelaxedCm: 0,
    armFlexedCm: 0,
    hipsCm: 0,
    thighCm: 0,
    calfCm: 0,
  };
}
