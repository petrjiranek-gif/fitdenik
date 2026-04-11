import type { BodyMeasurementInput } from "@/lib/repositories/contracts";

/** Prázdný šablona pro nové měření (váha 0 = uživatel musí doplnit). */
export function createEmptyMeasurementInput(nowIso: string): BodyMeasurementInput {
  return {
    measuredAt: nowIso,
    weightKg: 0,
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
    waistCm: 0,
    hipsCm: 0,
    thighCm: 0,
    calfCm: 0,
    notes: "",
  };
}
