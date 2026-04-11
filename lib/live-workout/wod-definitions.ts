/**
 * Strukturované informace o benchmark WOD (veřejně známé předpisy CrossFit).
 * Inspirace rozložením jako na WodWell — texty vlastní / zkrácené.
 */

export type CrossFitGirlKey = "annie" | "angie" | "karen" | "kalsu" | "murph";

export type WodBenchmarkRow = { level: string; timeRange: string };

export type WodSegment = { label: string; reps: number };

export type CrossFitWodDefinition = {
  key: CrossFitGirlKey;
  /** Zobrazovaný název */
  name: string;
  subtitle: string;
  scoreType: string;
  prescription: string;
  description: string;
  /** Jedna součtová série nebo více bloků (Angie, Murph…) */
  segments: WodSegment[];
  benchmarks: WodBenchmarkRow[];
  referenceUrl: string;
};

export const CROSSFIT_WODS: Record<CrossFitGirlKey, CrossFitWodDefinition> = {
  annie: {
    key: "annie",
    name: "Annie",
    subtitle: 'CrossFit „Girl" benchmark WOD',
    scoreType: "For Time",
    prescription: "50-40-30-20-10 Double-Unders a sit-upů (stejný počet obou v každé rundě).",
    description:
      "Na běžícím čase dokonči všechny opakování. Mezi rundami můžeš odpočívat. Výsledek je celkový čas.",
    segments: [{ label: "Double-Unders + sit-upy (součet všech opakování)", reps: 300 }],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 15–25 min" },
      { level: "Intermediate", timeRange: "cca 10–15 min" },
      { level: "Advanced", timeRange: "cca 7–10 min" },
      { level: "Elite", timeRange: "pod 7 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/annie/",
  },
  angie: {
    key: "angie",
    name: "Angie",
    subtitle: 'CrossFit „Girl" benchmark WOD',
    scoreType: "For Time",
    prescription: "100 pull-upů, 100 push-upů, 100 sit-upů, 100 dřepů (v tomto pořadí).",
    description:
      "Dokonči všechna opakování v uvedeném pořadí co nejrychleji. Skóre je čas dokončení všech 400 opakování.",
    segments: [
      { label: "Pull-upy", reps: 100 },
      { label: "Kliky", reps: 100 },
      { label: "Sedy-lehy", reps: 100 },
      { label: "Dřepy", reps: 100 },
    ],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 25–40 min" },
      { level: "Intermediate", timeRange: "cca 18–25 min" },
      { level: "Advanced", timeRange: "cca 12–18 min" },
      { level: "Elite", timeRange: "pod 12 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/angie/",
  },
  karen: {
    key: "karen",
    name: "Karen",
    subtitle: 'CrossFit „Girl" benchmark WOD',
    scoreType: "For Time",
    prescription: "150 wall ball shotů (typicky 20/14 lb, cíl 10/9 ft).",
    description:
      "Na běžícím čase dokonči 150 opakování wall ballu. Odpočívej podle potřeby. Skóre je čas dokončení všech 150 opakování.",
    segments: [{ label: "Wall ball shoty", reps: 150 }],
    benchmarks: [
      { level: "Beginner", timeRange: "12–15 min" },
      { level: "Intermediate", timeRange: "8–11 min" },
      { level: "Advanced", timeRange: "6–7 min" },
      { level: "Elite", timeRange: "pod 5 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/karen/",
  },
  kalsu: {
    key: "kalsu",
    name: "Kalsu",
    subtitle: "Hero WOD",
    scoreType: "For Time",
    prescription: "100 thrusterů (100/135 lb) — typicky 10 rep na začátku každé minuty (EMOM styl), dokud není 100 hotovo.",
    description:
      "Klasický předpis kombinuje thrustery s během nebo jiným členěním podle verze. Tady počítáme 100 thrusterů jako jeden cíl; uprav si škálování podle boxu.",
    segments: [{ label: "Thruster (součet)", reps: 100 }],
    benchmarks: [
      { level: "Scaled", timeRange: "záleží na váze / členění" },
      { level: "Rx", timeRange: "elite časy pod ~15 min (orientačně)" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/kalsu/",
  },
  murph: {
    key: "murph",
    name: "Murph",
    subtitle: "Hero WOD (Lt. Michael P. Murphy)",
    scoreType: "For Time",
    prescription:
      "1 mil běh, pak 100 pull-upů, 200 kliků, 300 dřepů (lze rozdělit do sad), pak 1 mil běh. Volitelně s vestou 20/14 lb.",
    description:
      "Kompletní Murph je velký objem — škáluj podle potřeby (např. poloviční objemy). Skóre je celkový čas. Běhy si zapisuj zvlášť; počítadlo níže sleduje střední blok 600 opakování.",
    segments: [{ label: "Střední blok (pull-upy + kliky + dřepy)", reps: 600 }],
    benchmarks: [
      { level: "Beginner (škálovaný)", timeRange: "45–60+ min" },
      { level: "Intermediate", timeRange: "cca 40–50 min" },
      { level: "Advanced", timeRange: "cca 35–40 min" },
      { level: "Elite", timeRange: "pod 35 min (bez vesty / s vestou dle pravidel)" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/murph/",
  },
};

export const CROSSFIT_WOD_ORDER: CrossFitGirlKey[] = ["annie", "angie", "karen", "kalsu", "murph"];

export function totalTargetReps(w: CrossFitWodDefinition): number {
  return w.segments.reduce((sum, s) => sum + s.reps, 0);
}
