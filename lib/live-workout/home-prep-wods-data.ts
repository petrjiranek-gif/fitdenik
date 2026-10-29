import type { EmomMinuteBlock, LiveWodDefinition } from "@/lib/live-workout/live-wod-types";
import type { OpenWodKey } from "@/lib/live-workout/open-wods-data";

/**
 * Domácí příprava k Ironmanu — vlastní cviky a benchmarky.
 * Oficiální Karen (wall ball) a WodWell Burpee Hour sem nepatří.
 */

export type HomePrepWodKey =
  | "home_circuit_6min"
  | "home_circuit_carving"
  | "home_burpee_60"
  | "home_karen_legs"
  | "home_double_karen_legs"
  | "home_2500_333";

/** Pořadí v živém tréninku. Open 12.1 používá existující klíč. */
export const HOME_PREP_WOD_ORDER: Array<HomePrepWodKey | Extract<OpenWodKey, "open_12_1">> = [
  "home_circuit_6min",
  "home_circuit_carving",
  "open_12_1",
  "home_burpee_60",
  "home_karen_legs",
  "home_double_karen_legs",
  "home_2500_333",
];

const CIRCUIT_CYCLE: EmomMinuteBlock[] = [
  {
    label: "1. minuta — air squat",
    movements: [
      { label: "Samostatné air squaty", reps: 10, notes: "tempo 2 s dolů / 1 s nahoru; zbytek minuty odpočinek" },
    ],
  },
  {
    label: "2. minuta — burpee",
    movements: [{ label: "Burpee odkročením", reps: 3, notes: "bez výskoku; zbytek minuty odpočinek" }],
  },
  {
    label: "3. minuta — výpony",
    movements: [
      { label: "Samostatné výpony oběma nohama", reps: 12, notes: "kontrolovaně, bez odrážení" },
    ],
  },
  {
    label: "4. minuta — plank",
    movements: [{ label: "Plank na předloktích", reps: "15–20", unit: "s", notes: "pevný trup, dýchat" }],
  },
  {
    label: "5. minuta — wall sit",
    movements: [
      { label: "Wall sit", reps: "10–15", unit: "s", notes: "výšku podřepu přizpůsobit a zaznamenat" },
    ],
  },
  {
    label: "6. minuta — odpočinek",
    movements: [{ label: "Lehká chůze a odpočinek", unit: "60 s" }],
  },
];

export const HOME_PREP_WODS: Record<HomePrepWodKey, LiveWodDefinition> = {
  home_circuit_6min: {
    key: "home_circuit_6min",
    kind: "home",
    name: "Krátký okruh 6 min",
    subtitle: "Domácí příprava · výchozí návrh 3 bloky",
    scoreType: "EMOM 18 min (3× 6 min)",
    formatType: "EMOM",
    durationMinutes: 18,
    timeCapMin: 18,
    liveFinishAnytime: true,
    prescription:
      "Šestiminutový blok, výchozí 3× (18 min), 2× týdně s ≥ 48 h mezi jednotkami. 1. min: 10 air squatů (2 s / 1 s). 2. min: 3 burpee odkročením. 3. min: 12 výponů. 4. min: plank 15–20 s. 5. min: wall sit 10–15 s. 6. min: chůze. Zbytek pracovní minuty = odpočinek.",
    description:
      "Samostatné dřepy a výpony — nezaměňovat s kombinovaným cyklem A (dřep + výpon) u Karen Legs. Kolo, běh a plavání zůstávají základem závodní přípravy. Zařazení přizpůsobit zotavení.",
    goal: "Svalová vytrvalost, rytmus, stereotyp, tempo a přestávky.",
    helpText:
      "Cviky A–E: dřep bez zátěže a poskakování; burpee v okruhu = odkročení; výpony kontrolovaně; plank na předloktích; wall sit bez povinného pravého úhlu. Mentální princip: klidný rytmus, kvalitní opakování, soustředění na aktuální blok.",
    cautionNote: "Ostrá bolest nebo rozpad techniky není mentální překážka k překonání.",
    emomCycle: CIRCUIT_CYCLE,
    segments: [{ label: "Pracovní opakování v blocích (orientačně)", reps: 75 }],
    movements: [
      { label: "Air squat", reps: 10, notes: "1. minuta" },
      { label: "Burpee odkročením", reps: 3, notes: "2. minuta" },
      { label: "Výpony", reps: 12, notes: "3. minuta" },
      { label: "Plank", reps: "15–20", unit: "s" },
      { label: "Wall sit", reps: "10–15", unit: "s" },
    ],
    claimKind: "plan",
    defaultMovementStandard: "air_squat_plain",
    benchmarks: [
      { level: "Plán", timeRange: "3 bloky = 18 min, 2× týdně" },
      { level: "Fakt", timeRange: "nejde o předpověď závodního času" },
    ],
    referenceUrl: "/training/live",
  },
  home_circuit_carving: {
    key: "home_circuit_carving",
    kind: "home",
    name: "Krátký okruh — carving",
    subtitle: "Domácí příprava · pomalé dřepy k lyžování",
    scoreType: "EMOM 18 min (3× 6 min)",
    formatType: "EMOM",
    durationMinutes: 18,
    timeCapMin: 18,
    liveFinishAnytime: true,
    prescription:
      "Stejný šestiminutový skelet. Místo 10 běžných dřepů: 8 pomalých dřepů (3 s dolů / 1 s nahoru). Plank a wall sit ponechat krátké.",
    description:
      "Další cíl: příprava na cca 4 h rekreačního lyžování včetně lanovek a přestávek. Okruh není ekvivalent čtyř hodin lyžování a nepokrývá boční stabilitu, rovnováhu ani práci zadní strany stehen.",
    goal: "Pomalý dřep a izometrie k carvingu — ne náhrada lyžování.",
    helpText: "Nejde o ekvivalent čtyř hodin na svahu.",
    cautionNote: "Odhad / analogie, ne změřený převod.",
    emomCycle: [
      {
        label: "1. minuta — pomalý dřep",
        movements: [
          { label: "Pomalé air squaty", reps: 8, notes: "3 s dolů / 1 s nahoru" },
        ],
      },
      CIRCUIT_CYCLE[1],
      CIRCUIT_CYCLE[2],
      CIRCUIT_CYCLE[3],
      CIRCUIT_CYCLE[4],
      CIRCUIT_CYCLE[5],
    ],
    segments: [{ label: "Pracovní opakování v blocích (orientačně)", reps: 69 }],
    claimKind: "odhad",
    defaultMovementStandard: "air_squat_plain",
    benchmarks: [
      { level: "Odhad", timeRange: "není ekvivalent 4 h lyžování" },
      { level: "Plán", timeRange: "stejné 3 bloky, pomalejší dřep" },
    ],
    referenceUrl: "/training/live",
  },
  home_burpee_60: {
    key: "home_burpee_60",
    kind: "home",
    name: "Burpee 60",
    subtitle: "Vlastní benchmark · hodinová challenge",
    scoreType: "AMRAP 60 min",
    formatType: "AMRAP",
    durationMinutes: 60,
    timeCapMin: 60,
    liveFinishAnytime: true,
    prescription:
      "Co nejvíc platných burpee za 60 minut. Čas běží včetně přestávek. Standard pro porovnávání: Open 12.1 (hrudník i boky na zemi; nahoře obě ruce na cíl 15,24 cm nad max. dosahem ve stoje). Bez tohoto standardu označ výsledek jako upravenou variantu. Eviduj počet za každých 10 minut.",
    description:
      "Dlouhodobý cíl. Cílový počet opakování zatím není stanoven. Výsledek Open 12.1 se nesmí lineárně přepočítávat na hodinu. WodWell „The Burpee Hour“ je jiná položka v Bodyweight.",
    goal: "Hodinová burpee challenge — plán, ne předepsaná dávka.",
    helpText: "Varianty burpee se nemíchají do jednoho osobního rekordu.",
    cautionNote: "Neprovádět automatickou extrapolaci 7min testu na 60 min.",
    segments: [{ label: "Burpee (AMRAP 60 min)", reps: 9999 }],
    claimKind: "plan",
    ambition: true,
    defaultMovementStandard: "burpee_open_12_1",
    benchmarks: [
      { level: "Plán", timeRange: "60 min včetně přestávek" },
      { level: "Standard", timeRange: "Open 12.1, jinak upravená varianta" },
      { level: "Evidence", timeRange: "úseky po 10 min" },
    ],
    referenceUrl: "/benchmarks",
  },
  home_karen_legs: {
    key: "home_karen_legs",
    kind: "home",
    name: "Karen Legs",
    subtitle: "Vlastní název · 150 dřepů s výponem",
    scoreType: "For Time",
    liveFinishAnytime: true,
    prescription:
      "150 cyklů A: dřep → úplné narovnání → výpon na špičky → návrat pat. Bez zátěže, bez poskakování, stejná hloubka. Referenční tempo pro výpočty: 2 s dolů, 1 s nahoru, 1 s výpon a návrat (4 s / cyklus) — modelové tempo, ne ověřené dlouhodobé.",
    description:
      "Karen Legs je náš název. Nejde o oficiální CrossFit Karen (150 wall ballů) — tu necháváme v Benchmark Girl.",
    goal: "150 platných cyklů A na čas, série a přestávky povolené.",
    helpText: "Hloubku dřepu ještě standardizovat; pro srovnání držet stejné provedení.",
    segments: [{ label: "Air squat s výponem", reps: 150 }],
    claimKind: "plan",
    defaultMovementStandard: "air_squat_calf_raise",
    benchmarks: [
      { level: "Cíl", timeRange: "150 cyklů A" },
      { level: "Výpočet", timeRange: "při 4 s/cyklus čistý pohyb 10:00" },
    ],
    referenceUrl: "/benchmarks",
  },
  home_double_karen_legs: {
    key: "home_double_karen_legs",
    kind: "home",
    name: "Double Karen Legs",
    subtitle: "Vlastní název · 300 dřepů s výponem",
    scoreType: "For Time",
    liveFinishAnytime: true,
    prescription: "300 cyklů A (dřep + výpon), stejný standard jako Karen Legs.",
    description: "Vlastní název. Není oficiální Karen. Vyšší objem automaticky nepředepisovat.",
    goal: "300 platných cyklů A.",
    helpText: "Další stupeň jen při kvalitě a zotavení — ne podle kalendáře.",
    cautionNote: "Při pokusu o nový maximální objem nepřidávat další náročné bloky na stejné svaly.",
    segments: [{ label: "Air squat s výponem", reps: 300 }],
    claimKind: "plan",
    defaultMovementStandard: "air_squat_calf_raise",
    benchmarks: [
      { level: "Cíl", timeRange: "300 cyklů A" },
      { level: "Výpočet", timeRange: "při 4 s/cyklus čistý pohyb 20:00" },
    ],
    referenceUrl: "/benchmarks",
  },
  home_2500_333: {
    key: "home_2500_333",
    kind: "home",
    name: "2 500 / 3:33",
    subtitle: "Hlavní dlouhodobý benchmark · ambice",
    scoreType: "For Time · cap 3:33:00",
    formatType: "For Time",
    durationMinutes: 213,
    timeCapMin: 213,
    liveFinishAnytime: true,
    ambition: true,
    prescription:
      "2 500 air squatů s výponem v jedné jednotce. Limit 3 h 33 min včetně všech přestávek. Série povolené. Priorita: kvalita provedení.",
    description:
      "Dlouhodobá ambice, nikoli aktuálně předepsaná dávka. Vhodnost jednorázového objemu musí potvrdit postupná příprava. Symbolický původ 2 500 (1 cyklus ≈ 10 otáček klik při modelu 180 km / 30 km/h / 70 rpm) není fyziologicky ověřený a nezobrazuje se jako kilometry.",
    goal: "Ambice — ne týdenní předpis.",
    helpText:
      "Výpočet při 4 s/cyklus: čistý pohyb 2:46:40, limit 3:33:00, prostor na přestávky 46:20 (≈ 78 % pohyb / 22 % pauzy), průměr včetně pauz 11,74 cyklu/min. Limit 3:33 je naše volba, ne převod profilu Thunu.",
    cautionNote:
      "Nepřepočítávat dřepy na ujeté kilometry. Koeficient neplatí pro burpee. Přestávky samy nezaručují toleranci extrémního objemu.",
    segments: [{ label: "Air squat s výponem", reps: 2500 }],
    claimKind: "vypocet",
    defaultMovementStandard: "air_squat_calf_raise",
    benchmarks: [
      { level: "Plán", timeRange: "ambice, ne předepsaná dávka" },
      { level: "Výpočet", timeRange: "2:46:40 pohyb + 46:20 pauzy = 3:33:00" },
      { level: "Odhad", timeRange: "1 cyklus ≠ 10 m kola; jen symbolický model" },
    ],
    referenceUrl: "/benchmarks",
  },
};
