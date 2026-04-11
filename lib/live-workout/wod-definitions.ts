/**
 * Strukturované informace o benchmark WOD (veřejně známé předpisy CrossFit).
 * Inspirace rozložením jako na WodWell — texty vlastní / zkrácené.
 */

export type CrossFitGirlKey = "annie" | "andi" | "angie" | "karen" | "kalsu" | "murph";

/** CrossFit Open (jednotlivé ročníky / části). */
export type OpenWodKey = "open_26_1";

export type LiveWodKey = CrossFitGirlKey | OpenWodKey;

export type WodBenchmarkRow = { level: string; timeRange: string };

export type WodSegment = { label: string; reps: number };

export type LiveWodDefinition = {
  key: LiveWodKey;
  /** Benchmark „Girl/Hero“ vs CrossFit Open. */
  kind: "benchmark" | "open";
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
  /** U Open WOD často oficiální cap (minuty). */
  timeCapMin?: number;
};

/** @deprecated použij LiveWodDefinition */
export type CrossFitWodDefinition = LiveWodDefinition;

export const CROSSFIT_WODS: Record<CrossFitGirlKey, LiveWodDefinition> = {
  annie: {
    key: "annie",
    kind: "benchmark",
    name: "Annie",
    subtitle: 'CrossFit „Girl" benchmark WOD',
    scoreType: "For Time",
    prescription: "50-40-30-20-10 double-underů a sit-upů (v každé rundě stejný počet obou).",
    description:
      "Na běžícím čase dokonči všechna opakování. Mezi rundami můžeš odpočívat. Skóre je celkový čas.",
    segments: [{ label: "Double-under + sit-up (součet všech opakování)", reps: 300 }],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 15–25 min" },
      { level: "Intermediate", timeRange: "cca 10–15 min" },
      { level: "Advanced", timeRange: "cca 7–10 min" },
      { level: "Elite", timeRange: "pod 7 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/annie/",
  },
  andi: {
    key: "andi",
    kind: "benchmark",
    name: "ANDI",
    subtitle: 'CrossFit „Girl" benchmark WOD',
    scoreType: "For Time",
    prescription:
      "100 hang power snatchů, 100 push pressů, 100 sumo deadlift high pullů, 100 front squatů (65/45 lb) — v tomto pořadí.",
    description:
      "Na běžícím čase dokonči všechna opakování v uvedeném pořadí co nejrychleji. Skóre je čas dokončení všech 400 opakování.",
    segments: [
      { label: "Hang power snatch", reps: 100 },
      { label: "Push press", reps: 100 },
      { label: "Sumo deadlift high pull", reps: 100 },
      { label: "Front squat", reps: 100 },
    ],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 30–45 min" },
      { level: "Intermediate", timeRange: "cca 22–30 min" },
      { level: "Advanced", timeRange: "cca 18–22 min" },
      { level: "Elite", timeRange: "pod 18 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/andi/",
  },
  angie: {
    key: "angie",
    kind: "benchmark",
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
    kind: "benchmark",
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
    kind: "benchmark",
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
    kind: "benchmark",
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

/** CrossFit Open — aktuálně jeden předpis; další ročníky lze doplnit stejně. */
export const OPEN_WODS: Record<OpenWodKey, LiveWodDefinition> = {
  open_26_1: {
    key: "open_26_1",
    kind: "open",
    name: "Open 26.1",
    subtitle: "2026 CrossFit Open — Workout #1",
    scoreType: "For Time",
    timeCapMin: 12,
    prescription:
      "20 wall ball (20/14 lb, cíl 10/9 ft) → 18 box jump-over (24/20 in) → 30 WB → 18 BJO → 40 WB → 18 medicine-ball box step-over (24/20 in) → 66 WB → 18 MB step-over → 40 WB → 18 BJO → 30 WB → 18 BJO → 20 WB.",
    description:
      "Na běžícím čase dokonči celý předpis v uvedeném pořadí. Oficiální časový limit je 12 minut — skóre je čas dokončení, nebo při nedokončení počet splněných opakování dle pravidel soutěže. Počítadlo níže sčítá všechna opakování (246 wall ball + 72 box jump-over + 36 step-over = 354) jako orientační průběh; striktně drž pořadí z předpisu.",
    segments: [{ label: "Chipper 26.1 (součet všech opakování)", reps: 354 }],
    benchmarks: [
      { level: "Cap", timeRange: "12:00" },
      { level: "Strategie", timeRange: "krátké série na wall ball, kontrolované tempo na boxech" },
      { level: "Škálování", timeRange: "váha míče, výška boxu dle Open / tvého boxu" },
      { level: "Detail", timeRange: "kompletní předpis a diskuze na WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-26-1/",
  },
};

export const OPEN_WOD_ORDER: OpenWodKey[] = ["open_26_1"];

export const LIVE_WODS: Record<LiveWodKey, LiveWodDefinition> = {
  ...CROSSFIT_WODS,
  ...OPEN_WODS,
};

export const CROSSFIT_WOD_ORDER: CrossFitGirlKey[] = ["annie", "andi", "angie", "karen", "kalsu", "murph"];

export function totalTargetReps(w: LiveWodDefinition): number {
  return w.segments.reduce((sum, s) => sum + s.reps, 0);
}
