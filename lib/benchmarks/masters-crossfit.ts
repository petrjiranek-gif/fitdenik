export type MastersScoreMode = "for_time" | "max_load";

export type MastersWorkoutDef = {
  id: string;
  name: string;
  scoreMode: MastersScoreMode;
  scoreUnitHint: string;
  category: "classic" | "strength" | "masters_open";
  description: string;
  prescription: string;
  equipment: string[];
  movementNotes: string[];
  defaultScaling: string;
};

export const CROSSFIT_MASTERS_WORKOUTS: MastersWorkoutDef[] = [
  {
    id: "masters_fran",
    name: "Fran",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "classic",
    description: "Klasický benchmark na krátkou, vysoce intenzivní toleranci laktátu.",
    prescription: "21-15-9 thruster + pull-up na čas.",
    equipment: ["Velká činka", "Hrazda"],
    movementNotes: [
      "Thruster: plný dřep do tlaku nad hlavu.",
      "Pull-up: brada jasně nad hrazdou, plný hang.",
      "Rx orientačně 95/65 lb (43/29 kg), podle věkové kategorie škáluj.",
    ],
    defaultScaling: "40+ často 35/25 kg; 50+ 30/20 kg nebo banded pull-up.",
  },
  {
    id: "masters_isabel",
    name: "Isabel",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "classic",
    description: "Rychlostní benchmark na snatch s důrazem na techniku pod únavou.",
    prescription: "30 snatch na čas.",
    equipment: ["Velká činka"],
    movementNotes: [
      "Povoleny power i squat snatch.",
      "Rx orientačně 135/95 lb (61/43 kg).",
      "Zaznamenej i variantu (power/squat) do poznámky.",
    ],
    defaultScaling: "Masters časté škálování 50/35 kg, 43/30 kg nebo EMOM varianta.",
  },
  {
    id: "masters_double_grace",
    name: "Double Grace",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "classic",
    description: "Objemová varianta Grace se 60 clean & jerk.",
    prescription: "60 clean & jerk na čas.",
    equipment: ["Velká činka"],
    movementNotes: [
      "Každé opakování ze země po plném lockoutu.",
      "Doporučeno rozdělení na kratší série.",
      "Rx orientačně 135/95 lb (61/43 kg), Masters dle možností níž.",
    ],
    defaultScaling: "Často 50/35 kg nebo 40/30 kg při zachování technické čistoty.",
  },
  {
    id: "masters_murph",
    name: "Murph",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "classic",
    description: "Dlouhý Hero benchmark na pacing a odolnost.",
    prescription: "1 mile run, 100 pull-up, 200 push-up, 300 air squat, 1 mile run.",
    equipment: ["Běh", "Hrazda", "Vesta (volitelně)"],
    movementNotes: [
      "Pull-up/push-up/squat lze dělit (např. 20 kol 5-10-15).",
      "Vesta 20/14 lb je volitelná varianta.",
      "V Masters sleduj zejména konzistenci splitu a negativ split běhu.",
    ],
    defaultScaling: "Half Murph, ring rows nebo běh nahrazený row/bike dle omezení.",
  },
  {
    id: "masters_1rm_front_squat",
    name: "1RM Front Squat",
    scoreMode: "max_load",
    scoreUnitHint: "kg",
    category: "strength",
    description: "Silový benchmark pro maximální výkon dolních končetin a středu.",
    prescription: "Najdi 1RM front squat (technicky validní opakování).",
    equipment: ["Stojan", "Velká činka", "Kotouče", "Safety pins"],
    movementNotes: [
      "Lokty vysoko, kyčel pod úroveň kolene.",
      "Vracej činku kontrolovaně do racku.",
      "Do poznámky zapisuj také počet pokusů a progres vah.",
    ],
    defaultScaling: "Lze použít 3RM a přepočet při dnech s únavou / citlivými zády.",
  },
  {
    id: "masters_1rm_clean_jerk",
    name: "1RM Clean & Jerk",
    scoreMode: "max_load",
    scoreUnitHint: "kg",
    category: "strength",
    description: "Olympijský benchmark síly a koordinace.",
    prescription: "Najdi 1RM clean & jerk (split/squat jerk dle zvyklosti).",
    equipment: ["Velká činka", "Kotouče", "Platforma"],
    movementNotes: [
      "Opakování musí končit plným lockoutem nad hlavou.",
      "Povolena varianta power clean + jerk i squat clean + jerk.",
      "Uveď variantu do poznámek kvůli srovnání historie.",
    ],
    defaultScaling: "Při technickém dni použij 85-92 % a sleduj kvalitu pokusů.",
  },
  {
    id: "masters_2024_run_deadlift",
    name: "2024 Run + Deadlift",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "masters_open",
    description: "Masters-inspirovaný chipper kombinující běh a tahový objem.",
    prescription: "4 kola: 400 m run + 12 deadlift.",
    equipment: ["Běh", "Velká činka"],
    movementNotes: [
      "Deadlift z mrtvé pozice, kyčle a kolena plně propnout.",
      "Udrž konstantní split běhu mezi koly.",
      "Doporuč orientační zátěž: 100/70 kg Rx Open style; Masters dle divize dolů.",
    ],
    defaultScaling: "80/55 kg nebo 60/40 kg, případně 300 m run.",
  },
  {
    id: "masters_2024_wallball_db_chipper",
    name: "2024 Wall Ball + DB Chipper",
    scoreMode: "for_time",
    scoreUnitHint: "mm:ss",
    category: "masters_open",
    description: "Objemový Open-style benchmark se střední zátěží a lokální únavou.",
    prescription: "For Time: 100 wall ball + 50 alternating DB snatch + 50 box step-over.",
    equipment: ["Medicinbál", "Jednoručka", "Box"],
    movementNotes: [
      "Wall ball: plná hloubka dřepu a jasný zásah targetu.",
      "DB snatch: střídání rukou po každém opakování.",
      "Step-over: plný kontakt chodidel nahoře, bezpečný sestup.",
    ],
    defaultScaling: "WB 9/6 kg, DB 22.5/15 kg nebo nižší podle kategorie.",
  },
];

