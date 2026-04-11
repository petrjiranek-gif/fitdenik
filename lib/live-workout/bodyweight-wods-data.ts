import type { LiveWodDefinition } from "@/lib/live-workout/live-wod-types";

/**
 * Bodyweight benchmarky (WodWell). Klíče s prefixem bw_ aby nekolidovaly s CrossFit Girl.
 */
export type BodyweightWodKey =
  | "bw_blackjack"
  | "bw_cindy"
  | "bw_chelsea"
  | "bw_angie"
  | "bw_barbara"
  | "bw_annie"
  | "bw_tabata_something_else"
  | "bw_death_by_burpees"
  | "bw_pukie_brewster"
  | "bw_burpee_hour";

/** Pořadí jako ve výběru na WodWell (Girl / benchmark bez činky). */
export const BODYWEIGHT_WOD_ORDER: BodyweightWodKey[] = [
  "bw_blackjack",
  "bw_cindy",
  "bw_chelsea",
  "bw_angie",
  "bw_barbara",
  "bw_annie",
  "bw_tabata_something_else",
  "bw_death_by_burpees",
  "bw_pukie_brewster",
  "bw_burpee_hour",
];

export const BODYWEIGHT_WODS: Record<BodyweightWodKey, LiveWodDefinition> = {
  bw_blackjack: {
    key: "bw_blackjack",
    kind: "bodyweight",
    name: "Blackjack",
    subtitle: 'Benchmark WOD (aka „Twenty-One")',
    scoreType: "For Time",
    prescription:
      "Žebříček kliků a sedy-lehů tak, aby součet v každé rundě byl 21: 20 kliků + 1 sed-leh, 19+2, 18+3 … až 1+20.",
    description:
      "Dokonči celý předpis v pořadí. Celkem 20 „kol“ po 21 opakováních = 420 rep (stejně jako součet karet u blackjacku). Skóre je čas dokončení.",
    segments: [{ label: "Kliky + sedy-lehy (součet)", reps: 420 }],
    benchmarks: [
      { level: "Orientace", timeRange: "záleží na kondici a strategii sad" },
      { level: "Zdroj", timeRange: "WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/blackjack/",
  },
  bw_cindy: {
    key: "bw_cindy",
    kind: "bodyweight",
    name: "Cindy",
    subtitle: "Girl benchmark WOD",
    scoreType: "AMRAP 20 min",
    timeCapMin: 20,
    prescription: "Co nejvíc kol za 20 minut: 5 shybů, 10 kliků, 15 air squatů.",
    description:
      "AMRAP — skóre je počet dokončených kol (případně části posledního kola). Počítadlo můžeš vést jako součet všech opakování.",
    segments: [{ label: "Opakování (AMRAP)", reps: 9999 }],
    benchmarks: [
      { level: "Formát", timeRange: "20 min AMRAP" },
      { level: "Obtížnost", timeRange: "udržitelné tempo na shybech" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/cindy/",
    liveFinishAnytime: true,
  },
  bw_chelsea: {
    key: "bw_chelsea",
    kind: "bodyweight",
    name: "Chelsea",
    subtitle: "Girl benchmark WOD",
    scoreType: "EMOM 30 min",
    timeCapMin: 30,
    prescription:
      "Každou minutu na začátku minuty: 5 shybů, 10 kliků, 15 air squatů — 30 kol celkem.",
    description:
      "Dokončíš-li práci před koncem minuty, zbytek minuty odpočíváš. Nesplněná minuta = konec (dle verze pravidel; ověř si přesný standard). Počítadlo: orientačně max 30×30 = 900 rep.",
    segments: [{ label: "Opakování (30 EMOM)", reps: 900 }],
    benchmarks: [
      { level: "Formát", timeRange: "30 min EMOM" },
      { level: "Tip", timeRange: "hlídej čas v rámci minuty" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/chelsea/",
    liveFinishAnytime: true,
  },
  bw_angie: {
    key: "bw_angie",
    kind: "bodyweight",
    name: "Angie",
    subtitle: "Girl benchmark WOD",
    scoreType: "For Time",
    prescription: "100 shybů, 100 kliků, 100 sedy-lehů, 100 dřepů — v tomto pořadí.",
    description: "For Time — skóre je čas dokončení všech 400 opakování.",
    segments: [
      { label: "Shyby", reps: 100 },
      { label: "Kliky", reps: 100 },
      { label: "Sedy-lehy", reps: 100 },
      { label: "Dřepy", reps: 100 },
    ],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 25–40 min" },
      { level: "Intermediate", timeRange: "cca 18–25 min" },
      { level: "Advanced", timeRange: "cca 12–18 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/angie/",
  },
  bw_barbara: {
    key: "bw_barbara",
    kind: "bodyweight",
    name: "Barbara",
    subtitle: "Girl benchmark WOD",
    scoreType: "For Time",
    prescription:
      "5 kol na čas: 20 shybů, 30 kliků, 40 sedy-lehů, 50 air squatů — mezi koly odpočinek 3 min (dle klasického předpisu).",
    description:
      "Skóre je čas všech pracovních kol včetně předepsaných pauz dle pravidel. Součet opakování na kolo = 140, ×5 = 700.",
    segments: [{ label: "5× (shyby + kliky + SU + dřepy)", reps: 700 }],
    benchmarks: [
      { level: "Objem", timeRange: "vysoký objem shybů" },
      { level: "Zdroj", timeRange: "WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/barbara/",
    liveFinishAnytime: true,
  },
  bw_annie: {
    key: "bw_annie",
    kind: "bodyweight",
    name: "Annie",
    subtitle: "Girl benchmark WOD",
    scoreType: "For Time",
    prescription: "50-40-30-20-10 double-underů a sedy-lehů (v každé rundě stejný počet obou).",
    description: "Skóre je celkový čas. Celkem 300 opakování (součet obou pohybů).",
    segments: [{ label: "Double-under + sed-leh", reps: 300 }],
    benchmarks: [
      { level: "Beginner", timeRange: "cca 15–25 min" },
      { level: "Intermediate", timeRange: "cca 10–15 min" },
      { level: "Advanced", timeRange: "cca 7–10 min" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/annie/",
  },
  bw_tabata_something_else: {
    key: "bw_tabata_something_else",
    kind: "bodyweight",
    name: "Tabata Something Else",
    subtitle: "Benchmark WOD",
    scoreType: "Tabata (16 min celkem)",
    prescription:
      "Tabata (20 s práce / 10 s odpočinek, 8 kol) postupně za sebou: shyby, kliky, sedy-lehy, air squaty — každý pohyb 8 kol, pak další pohyb.",
    description:
      "Skóre je typicky nejnižší počet rep v nejslabším kole u každého pohybu (4 čísla). Počítadlo zde použij orientačně na součet rep.",
    segments: [{ label: "Orientační součet rep", reps: 500 }],
    benchmarks: [
      { level: "Formát", timeRange: "4× Tabata za sebou" },
      { level: "Poznámka", timeRange: "Ověř skóre dle boxu / WodWell" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/tabata-something-else/",
    liveFinishAnytime: true,
  },
  bw_death_by_burpees: {
    key: "bw_death_by_burpees",
    kind: "bodyweight",
    name: "Death by Burpees",
    subtitle: "Benchmark WOD",
    scoreType: "EMOM",
    prescription:
      "První minuta 1 burpee, druhá minuta 2 burpee, … přidávej 1 burpee každou minutu, dokud nestihneš splnit počet v rámci minuty.",
    description:
      "Skóre je poslední dokončená minuta / počet burpee. Počítadlo slouží k součtu dokončených burpee.",
    segments: [{ label: "Burpee (součet dokončených)", reps: 9999 }],
    benchmarks: [
      { level: "Formát", timeRange: "rostoucí EMOM až do selhání" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/death-by-burpees/",
    liveFinishAnytime: true,
  },
  bw_pukie_brewster: {
    key: "bw_pukie_brewster",
    kind: "bodyweight",
    name: "Pukie Brewster",
    subtitle: "Benchmark WOD",
    scoreType: "For Time",
    prescription: "150 burpeeů.",
    description: "Na běžícím čase dokonči 150 opakování. Skóre je čas dokončení.",
    segments: [{ label: "Burpee", reps: 150 }],
    benchmarks: [
      { level: "Orientace", timeRange: "vytrvalost a tempo" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/pukie-brewster/",
  },
  bw_burpee_hour: {
    key: "bw_burpee_hour",
    kind: "bodyweight",
    name: "The Burpee Hour",
    subtitle: "12 Labours CrossFit tribute WOD",
    scoreType: "AMRAP 60 min",
    timeCapMin: 60,
    prescription: "Za 60 minut co nejvíc burpeeů (AMRAP).",
    description:
      "Skóre je počet dokončených burpeeů za hodinu. Počítadlo slouží k jejich sčítání.",
    segments: [{ label: "Burpee (AMRAP 60 min)", reps: 9999 }],
    benchmarks: [
      { level: "Formát", timeRange: "60 min AMRAP" },
    ],
    referenceUrl: "https://www.wodwell.com/wod/the-burpee-hour/",
    liveFinishAnytime: true,
  },
};
