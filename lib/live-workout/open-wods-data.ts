import type { LiveWodDefinition } from "@/lib/live-workout/live-wod-types";

/** Poslední rok Open v nabídce (aktuální sezóna). */
export const OPEN_YEAR_MAX = 2026;
/** Nejstarší rok v přepínači (2010 = před zavedením Open — viz prázdná nabídka). */
export const OPEN_YEAR_MIN = 2010;

/** Ročníky od nejnovějšího dolů (2010–OPEN_YEAR_MAX). */
export const OPEN_SEASON_YEAR_ORDER = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010,
] as const;

export type OpenSeasonYear = (typeof OPEN_SEASON_YEAR_ORDER)[number];

/** Rok v URL / názvu Open (11 = 2011 … 26 = 2026). CrossFit Open oficiálně od 2011. */
type OpenYearSuffix = 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26;

export type OpenWodKey = `open_${OpenYearSuffix}_${1 | 2 | 3}`;

function stubOpenWod(yy: OpenYearSuffix, part: 1 | 2 | 3, calendarYear: number): LiveWodDefinition {
  const key: OpenWodKey = `open_${yy}_${part}`;
  return {
    key,
    kind: "open",
    name: `Open ${yy}.${part}`,
    subtitle: `${calendarYear} CrossFit Open — Workout #${part}`,
    scoreType: "Dle předpisu",
    prescription:
      "Kompletní předpis, váhy, časové limity a skóre najdeš na WodWell a u oficiálních pravidel CrossFit Games. Tato karta slouží jako rozcestník a pro živý záznam.",
    description:
      "Základní informace pro tento Open WOD. Přesný rozpis pohybů, cap a škálování je vždy na odkazu níže — použij ho jako zdroj pravdy před tréninkem.",
    segments: [{ label: "Dle předpisu (orientační počet)", reps: 200 }],
    benchmarks: [
      { level: "Zdroj pravdy", timeRange: "WodWell + games.crossfit.com" },
      { level: "Sezóna", timeRange: String(calendarYear) },
    ],
    referenceUrl: `https://www.wodwell.com/wod/open-${yy}-${part}/`,
    liveFinishAnytime: true,
  };
}

/** Ručně doplněné předpisy (přepíší generickou šablonu). */
const OPEN_WOD_OVERRIDES: Partial<Record<OpenWodKey, LiveWodDefinition>> = {
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
      "Na běžícím čase dokonči celý předpis v uvedeném pořadí. Oficiální časový limit je 12 minut. Počítadlo sčítá všechna opakování (246 wall ball + 72 box jump-over + 36 step-over = 354) jako orientační průběh.",
    segments: [{ label: "Chipper 26.1 (součet všech opakování)", reps: 354 }],
    benchmarks: [
      { level: "Cap", timeRange: "12:00" },
      { level: "Strategie", timeRange: "série na wall ball, klid na boxech" },
      { level: "Škálování", timeRange: "váha míče, výška boxu dle Open" },
      { level: "Zdroj", timeRange: "WodWell + pravidla soutěže" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-26-1/",
  },
  open_26_2: {
    key: "open_26_2",
    kind: "open",
    name: "Open 26.2",
    subtitle: "2026 CrossFit Open — Workout #2",
    scoreType: "For Time",
    timeCapMin: 15,
    prescription:
      "Tři bloky v pořadí: (1) 80 ft dumbbell overhead walking lunge, 20 alternating DB snatchů (50/35 lb), 20 pull-upů; (2) stejně, 20 chest-to-bar; (3) stejně, 20 ring muscle-upů.",
    description:
      "For Time s cap 15 min (dle oficiálního zadání sezóny). Délka lungů v stopách — počítadlo níže sleduje hlavně činky a gymnastiku (20+20 na každý z tří bloků).",
    segments: [{ label: "Snatch + gymnastika (3×20+20, orientačně)", reps: 120 }],
    benchmarks: [
      { level: "Cap", timeRange: "15:00" },
      { level: "Skill", timeRange: "MU série vs rozbité sady" },
      { level: "Zdroj", timeRange: "WodWell" },
      { level: "Poznámka", timeRange: "Lunge měř vzdáleností zvlášť" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-26-2/",
    liveFinishAnytime: true,
  },
  open_26_3: {
    key: "open_26_3",
    kind: "open",
    name: "Open 26.3",
    subtitle: "2026 CrossFit Open — Workout #3",
    scoreType: "For Time",
    timeCapMin: 16,
    prescription:
      "Tři úrovně vah: po 2 kolech (12 burpees over bar, 12 clean, 12 burpees over bar, 12 thruster) — 95/65 lb, pak 115/75 lb, pak 135/85 lb.",
    description:
      "Na čase dokonči všechny bloky v pořadí. Součet opakování všech pohybů v chipperu je 288 (každé kolo 48 rep × 3 úrovně váhy).",
    segments: [{ label: "Burpee + činka (součet opakování)", reps: 288 }],
    benchmarks: [
      { level: "Cap", timeRange: "16:00" },
      { level: "Strategie", timeRange: "sjednocené série na čince" },
      { level: "Zdroj", timeRange: "WodWell" },
      { level: "Poznámka", timeRange: "Drž pořadí předpisu" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-26-3/",
  },
  open_25_1: {
    key: "open_25_1",
    kind: "open",
    name: "Open 25.1",
    subtitle: "2025 CrossFit Open — Workout #1",
    scoreType: "AMRAP (15 min)",
    timeCapMin: 15,
    prescription:
      "Opakuj kola: laterální burpees přes jednoručku, hang clean-to-overhead s jednoručkou (počet rep roste po kolech), 30 ft walking lunge — přesný počet rep dle oficiálního zadání 25.1.",
    description:
      "AMRAP 15 minut — skóre je počet dokončených kol / opakování. Počítadlo slouží k ručnímu sčítání opakování; dokončení můžeš uložit kdykoli po skončení času.",
    segments: [{ label: "Dokončená opakování (AMRAP)", reps: 9999 }],
    benchmarks: [
      { level: "Formát", timeRange: "AMRAP — co nejvíc práce za 15 min" },
      { level: "Váhy Rx", timeRange: "typicky 50/35 lb (M/W) — ověř na Games" },
      { level: "Zdroj", timeRange: "WodWell + games.crossfit.com" },
      { level: "Poznámka", timeRange: "Bez pevného cílového počtu rep" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-25-1/",
    liveFinishAnytime: true,
  },
  open_25_2: {
    key: "open_25_2",
    kind: "open",
    name: "Open 25.2",
    subtitle: "2025 CrossFit Open — Workout #2",
    scoreType: "For Time",
    timeCapMin: 12,
    prescription:
      "21 pull-upů, 42 double-underů, 21 thrusterů (váha 1) → 18 chest-to-bar, 36 DU, 18 thrusterů (váha 2) → 15 bar muscle-upů, 30 DU, 15 thrusterů (váha 3). Muži např. 95/115/135 lb, ženy 65/75/85 lb.",
    description:
      "Opakování 22.3 — progres skillů a vah. Součet hlavních opakování (bez DU) je orientačně 153; s DU 216.",
    segments: [{ label: "Pull / C2B / BMU + thruster + DU (součet)", reps: 216 }],
    benchmarks: [
      { level: "Cap", timeRange: "12:00" },
      { level: "Obtížnost", timeRange: "MU a činky pod tlakem času" },
      { level: "Zdroj", timeRange: "WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-25-2/",
  },
  open_25_3: {
    key: "open_25_3",
    kind: "open",
    name: "Open 25.3",
    subtitle: "2025 CrossFit Open — Workout #3",
    scoreType: "For Time",
    timeCapMin: 20,
    prescription:
      "Střídání wall walků, 50 kcal na ergu, mrtvé tahy, čisté, shyby nad hlavou — přesná sekvence a váhy dle oficiálního předpisu 25.3 (viz odkaz).",
    description:
      "Dlouhý chipper s kcal na veslaři — skóre je čas pod cap 20 min. Počítadlo rep je orientační.",
    segments: [{ label: "Kombinovaný předpis (rep + kcal)", reps: 400 }],
    benchmarks: [
      { level: "Cap", timeRange: "20:00" },
      { level: "Erg", timeRange: "50 kcal mezi bloky dle předpisu" },
      { level: "Zdroj", timeRange: "WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-25-3/",
    liveFinishAnytime: true,
  },
  open_24_1: {
    key: "open_24_1",
    kind: "open",
    name: "Open 24.1",
    subtitle: "2024 CrossFit Open — Workout #1",
    scoreType: "Dle předpisu",
    prescription:
      "Kompletní znění, váhy a standardy pohybů jsou na WodWell a games.crossfit.com — použij odkaz níže.",
    description:
      "Open 24.1 — ověř si přesný počet kol, vzdálenosti a časovač u zdroje. Počítadlo zde je pomocné.",
    segments: [{ label: "Dle oficiálního předpisu", reps: 200 }],
    benchmarks: [
      { level: "Zdroj pravdy", timeRange: "WodWell + CrossFit Games" },
      { level: "Tip", timeRange: "Nejdřív si přečti celý předpis" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-24-1/",
    liveFinishAnytime: true,
  },
  open_24_2: {
    key: "open_24_2",
    kind: "open",
    name: "Open 24.2",
    subtitle: "2024 CrossFit Open — Workout #2",
    scoreType: "Dle předpisu",
    prescription: "Kompletní předpis a standardy viz oficiální stránky a WodWell (odkaz).",
    description: "Druhý týden Open 2024 — struktura a časovač podle zadání sezóny.",
    segments: [{ label: "Dle oficiálního předpisu", reps: 200 }],
    benchmarks: [{ level: "Zdroj pravdy", timeRange: "WodWell + CrossFit Games" }],
    referenceUrl: "https://www.wodwell.com/wod/open-24-2/",
    liveFinishAnytime: true,
  },
  open_24_3: {
    key: "open_24_3",
    kind: "open",
    name: "Open 24.3",
    subtitle: "2024 CrossFit Open — Workout #3",
    scoreType: "For Time",
    timeCapMin: 15,
    prescription:
      "5 kol: 10 thrusterů + 10 chest-to-bar pull-upů; odpočinek 1 min; pak 5 kol: 7 thrusterů + 7 bar muscle-upů. Váhy dle divize (viz odkaz).",
    description:
      "Finále Open 2024 — skóre je čas dokončení pod cap. Součet opakování: 5×(10+10) + 5×(7+7) = 170.",
    segments: [{ label: "Thruster + gymnastika", reps: 170 }],
    benchmarks: [
      { level: "Cap", timeRange: "15:00" },
      { level: "Struktura", timeRange: "Oddělené bloky thruster + C2B / BMU" },
      { level: "Zdroj", timeRange: "WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/open-24-3/",
  },
};

function buildOpenWods(): Record<OpenWodKey, LiveWodDefinition> {
  const out = {} as Record<OpenWodKey, LiveWodDefinition>;
  for (let calendarYear = 2011; calendarYear <= OPEN_YEAR_MAX; calendarYear++) {
    const yy = calendarYear % 100;
    if (yy < 11 || yy > 26) continue;
    const yys = yy as OpenYearSuffix;
    for (const part of [1, 2, 3] as const) {
      const key: OpenWodKey = `open_${yys}_${part}`;
      const def = OPEN_WOD_OVERRIDES[key];
      out[key] = def ?? stubOpenWod(yys, part, calendarYear);
    }
  }
  return out;
}

/**
 * Všechny Open WOD 2011–aktuální rok (3 workouty / rok), s odkazy na WodWell.
 * Roky 2011–2023 a část 2024+ používají generickou šablonu, pokud není v OPEN_WOD_OVERRIDES.
 */
export const OPEN_WODS = buildOpenWods();

function buildKeysByYear(): Record<OpenSeasonYear, OpenWodKey[]> {
  const map = {} as Record<OpenSeasonYear, OpenWodKey[]>;
  for (const y of OPEN_SEASON_YEAR_ORDER) {
    if (y === 2010) {
      map[y] = [];
      continue;
    }
    if (y < 2011) {
      map[y] = [];
      continue;
    }
    const yy = y % 100;
    if (yy < 11 || yy > 26) {
      map[y] = [];
      continue;
    }
    const yys = yy as OpenYearSuffix;
    map[y] = [`open_${yys}_1`, `open_${yys}_2`, `open_${yys}_3`];
  }
  return map;
}

export const OPEN_WOD_KEYS_BY_YEAR = buildKeysByYear();
