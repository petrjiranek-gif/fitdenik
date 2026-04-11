/**
 * Katalog benchmarků ve stylu WodWell — Girl (jména) vs ostatní pojmenované WOD.
 * Rozšíření: doplnit záznamy do GIRL_BENCHMARKS / OTHER_BENCHMARKS.
 */

export type BenchmarkCatalogKind = "girl" | "other_wod";

export interface BenchmarkCatalogEntry {
  id: string;
  name: string;
  subtitle: string;
  scoreType: string;
  prescription: string;
  description: string;
  rxLoadDescription?: string;
  referenceUrl: string;
  kind: BenchmarkCatalogKind;
}

const WW = "https://www.wodwell.com/wod";

/** CrossFit „Girl“ benchmarky (pojmenované ženskými jmény / ANDI). */
export const GIRL_BENCHMARKS: BenchmarkCatalogEntry[] = [
  {
    id: "fran",
    kind: "girl",
    name: "Fran",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "21-15-9 thrusterů a shybů. Thruster 95/65 lb.",
    description: "Jedna z nejznámějších Girls — krátký intenzivní test.",
    rxLoadDescription: "Thruster 95/65 lb (M/W)",
    referenceUrl: `${WW}/fran/`,
  },
  {
    id: "grace",
    kind: "girl",
    name: "Grace",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "30 clean and jerků na čas. 135/95 lb.",
    description: "Jeden pohyb, vysoká intenzita.",
    rxLoadDescription: "Činka 135/95 lb (M/W)",
    referenceUrl: `${WW}/grace/`,
  },
  {
    id: "helen",
    kind: "girl",
    name: "Helen",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "3 kola: 400 m běh, 21 kettlebell swing (1,5/1 pood), 12 shybů.",
    description: "Kondice a shyby v opakování.",
    rxLoadDescription: "KB swing 1,5 / 1 pood (M/W)",
    referenceUrl: `${WW}/helen/`,
  },
  {
    id: "karen",
    kind: "girl",
    name: "Karen",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "150 wall ball shotů. Cíl 10/9 ft, míč 20/14 lb.",
    description: "Čistý objem wall ballu.",
    rxLoadDescription: "Wall ball 20/14 lb (M/W)",
    referenceUrl: `${WW}/karen/`,
  },
  {
    id: "annie",
    kind: "girl",
    name: "Annie",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "50-40-30-20-10 double-underů a sedy-lehů.",
    description: "Švihadlo a core v žebříčku.",
    referenceUrl: `${WW}/annie/`,
  },
  {
    id: "andi",
    kind: "girl",
    name: "ANDI",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription:
      "100 hang power snatchů, 100 push pressů, 100 sumo deadlift high pullů, 100 front squatů (65/45 lb) v pořadí.",
    description: "Čtyři stovky s jednou činkou.",
    rxLoadDescription: "Činka 65/45 lb (M/W)",
    referenceUrl: `${WW}/andi/`,
  },
  {
    id: "angie",
    kind: "girl",
    name: "Angie",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "100 shybů, 100 kliků, 100 sedy-lehů, 100 dřepů — v tomto pořadí.",
    description: "Vysoký objem vlastní vahou.",
    referenceUrl: `${WW}/angie/`,
  },
  {
    id: "barbara",
    kind: "girl",
    name: "Barbara",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "5 kol: 20 shybů, 30 kliků, 40 SU, 50 air squatů; mezi koly odpočinek 3 min.",
    description: "Objem a pauzy podle klasického předpisu.",
    referenceUrl: `${WW}/barbara/`,
  },
  {
    id: "chelsea",
    kind: "girl",
    name: "Chelsea",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "EMOM 30 min",
    prescription: "Každou minutu: 5 shybů, 10 kliků, 15 air squatů — 30 min.",
    description: "Steady tempo po celou půlhodinu.",
    referenceUrl: `${WW}/chelsea/`,
  },
  {
    id: "cindy",
    kind: "girl",
    name: "Cindy",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "AMRAP 20 min",
    prescription: "20 min AMRAP: 5 shybů, 10 kliků, 15 air squatů.",
    description: "Klasický bodyweight kondiční test.",
    referenceUrl: `${WW}/cindy/`,
  },
  {
    id: "diane",
    kind: "girl",
    name: "Diane",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "21-15-9 mrtvých tahů (225/155 lb) a handstand push-upů.",
    description: "Síla a HSPU v žebříčku.",
    rxLoadDescription: "Mrtvý tah 225/155 lb (M/W)",
    referenceUrl: `${WW}/diane/`,
  },
  {
    id: "elizabeth",
    kind: "girl",
    name: "Elizabeth",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "21-15-9 squat cleanů (135/95 lb) a ring dipů.",
    description: "Činka a kruhy.",
    rxLoadDescription: "Squat clean 135/95 lb (M/W)",
    referenceUrl: `${WW}/elizabeth/`,
  },
  {
    id: "isabel",
    kind: "girl",
    name: "Isabel",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "30 snatchů na čas. 135/95 lb.",
    description: "Rychlá činka.",
    rxLoadDescription: "Činka 135/95 lb (M/W)",
    referenceUrl: `${WW}/isabel/`,
  },
  {
    id: "jackie",
    kind: "girl",
    name: "Jackie",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "1000 m veslování, 50 thrusterů (45/35 lb), 30 shybů.",
    description: "Erg, činka, shyby.",
    rxLoadDescription: "Thruster 45/35 lb (M/W)",
    referenceUrl: `${WW}/jackie/`,
  },
  {
    id: "kelly",
    kind: "girl",
    name: "Kelly",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "5 kol: 400 m běh, 30 box jumpů (24/20 in), 30 wall ball (20/14 lb).",
    description: "Běh, box, wall ball.",
    rxLoadDescription: "Wall ball 20/14 lb, box 24/20 in",
    referenceUrl: `${WW}/kelly/`,
  },
  {
    id: "linda",
    kind: "girl",
    name: "Linda",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "10-9-8-…-1: mrtvý tah, bench press, čistý (tzv. „Tři síly“).",
    description: "Těžké váhy, klesající série.",
    rxLoadDescription: "Poměr vah 1,5× / 1× / 0,75× BW — viz WodWell",
    referenceUrl: `${WW}/linda/`,
  },
  {
    id: "mary",
    kind: "girl",
    name: "Mary",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "AMRAP 20 min",
    prescription: "20 min AMRAP: 5 handstand push-upů, 10 pistolů, 15 shybů.",
    description: "Gymnastika na čas.",
    referenceUrl: `${WW}/mary/`,
  },
  {
    id: "nancy",
    kind: "girl",
    name: "Nancy",
    subtitle: "CrossFit Girl — benchmark WOD",
    scoreType: "For Time",
    prescription: "5 kol: 400 m běh, 15 overhead squatů (95/65 lb).",
    description: "Běh a OHS.",
    rxLoadDescription: "OHS 95/65 lb (M/W)",
    referenceUrl: `${WW}/nancy/`,
  },
];

/** Ostatní pojmenované benchmarky (bez formátu Girl — Hero, komplexy, …). */
export const OTHER_BENCHMARKS: BenchmarkCatalogEntry[] = [
  {
    id: "murph",
    kind: "other_wod",
    name: "Murph",
    subtitle: "Hero WOD",
    scoreType: "For Time",
    prescription:
      "1 mil běh, 100 shybů, 200 kliků, 300 dřepů, 1 mil běh. Volitelně vesta 20/14 lb.",
    description: "Památný Hero WOD — vysoký objem.",
    rxLoadDescription: "Vesta 20/14 lb (volitelně)",
    referenceUrl: `${WW}/murph/`,
  },
  {
    id: "kalsu",
    kind: "other_wod",
    name: "Kalsu",
    subtitle: "Hero WOD",
    scoreType: "For Time",
    prescription: "100 thrusterů — typicky EMOM styl; váha dle předpisu (často 135/95 lb Rx).",
    description: "Hero WOD na thrustery.",
    rxLoadDescription: "Thruster dle verze / boxu — ověř na WodWell",
    referenceUrl: `${WW}/kalsu/`,
  },
  {
    id: "bear-complex",
    kind: "other_wod",
    name: "Bear Complex",
    subtitle: "Benchmark WOD",
    scoreType: "For Load / For Time (dle verze)",
    prescription:
      "Série: power clean → front squat → push press → back squat → push press (jedna „medvědí“ série). Opakovat po 7 sériích nebo dle zadání.",
    description: "Komplex s činkou — často 5 kol za zátěž nebo na čas.",
    rxLoadDescription: "Zátěž dle verze (postupně těžší)",
    referenceUrl: `${WW}/bear-complex/`,
  },
  {
    id: "fight-gone-bad",
    kind: "other_wod",
    name: "Fight Gone Bad",
    subtitle: "Benchmark WOD",
    scoreType: "3× 1 min stanice + 1 min odpočinek",
    prescription:
      "Wall ball, sumo deadlift high pull, box jump, push press, veslař — 1 min na stanici, max rep, 3 kola.",
    description: "Klasický CrossFit „FGB“.",
    rxLoadDescription: "Váhy dle oficiálního předpisu (wall ball, činka, box)",
    referenceUrl: `${WW}/fight-gone-bad/`,
  },
  {
    id: "dt",
    kind: "other_wod",
    name: "DT",
    subtitle: "Hero WOD (Staff Sgt. Timothy Davis)",
    scoreType: "For Time",
    prescription: "5 kol: 12 mrtvých tahů, 9 hang power cleanů, 6 push jerků (155/105 lb).",
    description: "Hero WOD na čince.",
    rxLoadDescription: "155/105 lb (M/W)",
    referenceUrl: `${WW}/dt/`,
  },
  {
    id: "filthy-fifty",
    kind: "other_wod",
    name: "Filthy Fifty",
    subtitle: "Benchmark WOD",
    scoreType: "For Time",
    prescription: "50 repů postupně: box jump, jumping pull-up, kettlebell swing, kroky, knee to elbow, push press, zadní výpad KB, wall ball, burpee, double-under.",
    description: "Dlouhý chipper „50“.",
    rxLoadDescription: "KB a wall ball dle předpisu",
    referenceUrl: `${WW}/filthy-fifty/`,
  },
  {
    id: "badger",
    kind: "other_wod",
    name: "Badger",
    subtitle: "Hero WOD",
    scoreType: "For Time",
    prescription: "3 kola: 30 squat cleanů (95/65 lb), 30 shybů — 800 m běh mezi koly.",
    description: "Hero WOD — běh a činka.",
    rxLoadDescription: "Squat clean 95/65 lb",
    referenceUrl: `${WW}/badger/`,
  },
  {
    id: "randy",
    kind: "other_wod",
    name: "Randy",
    subtitle: "Hero WOD",
    scoreType: "For Time",
    prescription: "75 power snatchů (75/55 lb).",
    description: "Krátký Hero na jeden pohyb.",
    rxLoadDescription: "75/55 lb (M/W)",
    referenceUrl: `${WW}/randy/`,
  },
  {
    id: "king-kong",
    kind: "other_wod",
    name: "King Kong",
    subtitle: "Benchmark WOD",
    scoreType: "For Time",
    prescription: "3 kola: 1 deadlift, 2 muscle-upy, 3 squat cleanů, 4 handstand push-upy — těžké váhy.",
    description: "Silově-gymnastický benchmark.",
    rxLoadDescription: "Váhy dle předpisu (vysoké)",
    referenceUrl: `${WW}/king-kong/`,
  },
];

export function filterBenchmarks(entries: BenchmarkCatalogEntry[], query: string): BenchmarkCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.prescription.toLowerCase().includes(q) ||
      e.subtitle.toLowerCase().includes(q),
  );
}
