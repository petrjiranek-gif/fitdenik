/** Nářadí a cviky pro živý trénink — bodybuilding (CZ popisky). */

export const BODYBUILDING_EQUIPMENT = [
  { id: "trx", label: "TRX / závěsy" },
  { id: "pullup_bar", label: "Hrazda" },
  { id: "barbell", label: "Velká činka (olympijská)" },
  { id: "ez_bar", label: "EZ činka" },
  { id: "dumbbells", label: "Jednoručky" },
  { id: "cables", label: "Kladky / kladkový stojan" },
  { id: "smith", label: "Smithova posilovací věž" },
  { id: "bands", label: "Gumy a expandéry" },
  { id: "med_ball", label: "Medicinbál" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "bench", label: "Lavice / bench" },
  { id: "leg_press", label: "Leg press / hack squat" },
  { id: "machine", label: "Posilovací stroj (obecně)" },
  { id: "cardio", label: "Ergometr / běžecký pás / air bike" },
] as const;

export type BodybuildingEquipmentId = (typeof BODYBUILDING_EQUIPMENT)[number]["id"];

/** Svalová partie → typické cviky (neúplný výčet běžné praxe; rozšiřitelné). */
export const BODYBUILDING_MUSCLE_GROUPS: Record<string, string[]> = {
  Hrudník: [
    "Bench press rovně",
    "Bench press úzkým úchopem",
    "Incline bench press (šikmá lavice)",
    "Decline bench press",
    "Dumbbell press na rovné lavici",
    "Incline dumbbell press",
    "Flyes s jednoručkami",
    "Křížení na kladkách (high / low)",
    "Peck deck / motýlek",
    "Kliky na bradlech",
    "Kliky klasické",
    "Pullover s jednoručkou / činkou",
    "Svinování s EZ činkou (spodní hrudník)",
    "Dipy s předklonem (důraz na prsa)",
    "Svend press (jednoručky)",
  ],
  Záda: [
    "Mrtvý tah klasický",
    "Mrtvý tah sumo",
    "Romanian deadlift",
    "Shyby pronation / neutrální úchop",
    "Shyby na hrazdě s vlastní vahou + zátěž",
    "Lat pulldown",
    "Seated cable row",
    "T-bar row",
    "Bent-over barbell row",
    "One-arm dumbbell row",
    "Chest-supported row",
    "Face pull",
    "Straight-arm pulldown",
    "Shrugs s činkou / jednoručkami",
    "Hyperextenze / back extension",
    "Good morning",
    "Inverted rows / TRX row",
  ],
  Ramena: [
    "Military press vestoje",
    "Sedící tlak s činkou",
    "Arnold press s jednoručkami",
    "Boční raise s jednoručkami",
    "Přední raise",
    "Zadní raise (reverse fly) na kladce / jednoručky",
    "Upright row s EZ činkou",
    "Push press",
    "Lateral raise na kladce",
    "Face pull (ramena / rotátory)",
    "Around the world s jednoručkami",
  ],
  Biceps: [
    "Biceps curl s činkou vestoje",
    "Biceps curl s EZ činkou",
    "Alternující curl s jednoručkami",
    "Hammer curl",
    "Koncentrický curl vsedě",
    "Preacher curl",
    "Incline dumbbell curl",
    "Cable curl",
    "Drag curl",
    "Zottman curl",
  ],
  Triceps: [
    "Lying triceps extension (EZ / činka)",
    "Overhead extension s jednoručkou",
    "Triceps pushdown na kladce",
    "Rope pushdown",
    "Close-grip bench press",
    "Bench dip",
    "Triceps kickback",
    "JM press",
    "Overhead cable extension",
  ],
  "Předloktí": [
    "Wrist curl palcem nahoru",
    "Reverse wrist curl",
    "Farmer carry",
    "Dead hang",
    "Pinwheel curl",
  ],
  Quadriceps: [
    "Back squat vysoký / nízký bar",
    "Front squat",
    "Goblet squat",
    "Leg press",
    "Hack squat",
    "Bulgarian split squat",
    "Walking lunge",
    "Leg extension",
    "Sissy squat",
    "Step-up",
  ],
  Hamstringy: [
    "Leg curl leže / vsedě / stoje",
    "Romanian deadlift",
    "Good morning",
    "Nordic hamstring curl",
    "Glute-ham raise",
    "Stiff-leg deadlift",
    "Single-leg RDL",
  ],
  Hýždě: [
    "Hip thrust s činkou",
    "Glute bridge",
    "Bulgarian split squat",
    "Cable kickback",
    "Abduction na stroji / gumou",
    "Sumo deadlift",
    "Frog pump",
    "Kettlebell swing",
  ],
  Lýtka: [
    "Standing calf raise",
    "Seated calf raise",
    "Leg press calf press",
    "Donkey calf raise",
    "Single-leg calf raise",
  ],
  Břicho: [
    "Plank",
    "Side plank",
    "Dead bug",
    "Hanging leg raise",
    "Cable crunch",
    "Ab wheel rollout",
    "Russian twist",
    "V-ups / jackknife",
    "Pallof press",
    "Woodchopper na kladce",
  ],
};

export const BODYBUILDING_MUSCLE_ORDER = Object.keys(BODYBUILDING_MUSCLE_GROUPS);

/** Vyhledání cviků podle partie (přesná shoda + NFC normalizace pro Safari/OS rozhraní). */
export function getBodybuildingExercisesForMuscle(muscle: string): string[] {
  const m = muscle.trim();
  if (!m) return [];
  const direct = BODYBUILDING_MUSCLE_GROUPS[m];
  if (direct?.length) return direct;
  const nfc = m.normalize("NFC");
  const key = Object.keys(BODYBUILDING_MUSCLE_GROUPS).find(
    (k) => k === m || k.normalize("NFC") === nfc,
  );
  return key ? (BODYBUILDING_MUSCLE_GROUPS[key] ?? []) : [];
}
