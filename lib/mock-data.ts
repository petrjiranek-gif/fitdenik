import {
  BenchmarkResult,
  BodyMetrics,
  Consultation,
  ExerciseTechnique,
  MediaResource,
  NutritionEntry,
  ScreenshotImport,
  TrainingSession,
  UserProfile,
  WorkoutTemplate,
} from "@/lib/types";

export const userProfile: UserProfile = {
  id: "u1",
  name: "Petr",
  age: 34,
  heightCm: 181,
  baselineWeightKg: 87.2,
  waistCm: 94,
  estimatedBodyFatPct: 19.5,
  restingHeartRate: 58,
  activityLevel: "Vysoká aktivita",
  goals: ["redukce tuku", "zlepšení kondice", "síla"],
  limitations: "Citlivé pravé rameno při overhead pressu.",
  notes: "Preferuji ranní trénink a krátké intenzivní bloky.",
};

export const bodyMetrics: BodyMetrics[] = [
  { id: "bm1", userId: "u1", date: "2026-03-10", weightKg: 87.2, bodyFatPct: 19.5, muscleMassKg: 39.2, visceralFat: 9, bmi: 26.6, waterPct: 56.3, boneMassKg: 3.2, bmr: 1860, notes: "Baseline" },
  { id: "bm2", userId: "u1", date: "2026-03-24", weightKg: 86.3, bodyFatPct: 18.9, muscleMassKg: 39.4, visceralFat: 8, bmi: 26.3, waterPct: 56.8, boneMassKg: 3.2, bmr: 1847, notes: "Stabilní trend" },
  { id: "bm3", userId: "u1", date: "2026-04-07", weightKg: 85.7, bodyFatPct: 18.3, muscleMassKg: 39.8, visceralFat: 8, bmi: 26.1, waterPct: 57.1, boneMassKg: 3.3, bmr: 1838, notes: "Po deload týdnu" },
];

/** Výchozí prázdné — uživatelská data jen z localStorage / Supabase. */
export const trainingSessions: TrainingSession[] = [];

export const benchmarkResults: BenchmarkResult[] = [
  { id: "b1", userId: "u1", date: "2026-03-12", benchmarkName: "Karen", resultType: "čas", resultValue: "15:26", scaling: "9kg wall ball", notes: "Rozpad techniky po 100 reps", sourceType: "wodwell", sourceName: "WODwell", sourceUrl: "https://wodwell.com/wod/karen/" },
  { id: "b2", userId: "u1", date: "2026-04-07", benchmarkName: "Karen", resultType: "čas", resultValue: "14:03", scaling: "9kg wall ball", notes: "Lepší pacing", sourceType: "wodwell", sourceName: "WODwell", sourceUrl: "https://wodwell.com/wod/karen/" },
  { id: "b3", userId: "u1", date: "2026-04-02", benchmarkName: "Grace", resultType: "čas", resultValue: "04:12", scaling: "50kg", notes: "Dobrá mechanika", sourceType: "wodwell", sourceName: "WODwell", sourceUrl: "https://wodwell.com/wod/grace/" },
];

export const nutritionEntries: NutritionEntry[] = [
  { id: "n1", userId: "u1", date: "2026-04-07", calories: 2480, protein: 182, carbs: 266, fat: 74, fiber: 32, waterLiters: 3.1, bodyWeightKg: 85.7, notes: "Vyšší příjem po benchmarku." },
  { id: "n2", userId: "u1", date: "2026-04-06", calories: 2290, protein: 176, carbs: 240, fat: 68, fiber: 28, waterLiters: 2.8, bodyWeightKg: 85.9, notes: "Standardní den." },
];

export const consultations: Consultation[] = [
  { id: "c1", clientName: "Jan K.", date: "2026-04-12", topic: "Nastavení benchmark cyklu", notes: "Analýza Cindy a Angie.", recommendations: "2 týdny fokus na gymnastic capacity.", followUp: "2026-04-26", status: "plánováno" },
];

export const mediaResources: MediaResource[] = [
  { id: "m1", title: "Wall Ball Demo", type: "video", url: "https://youtube.com/@crossfit", sourceType: "crossfit", sourceName: "CrossFit Official", sourceUrl: "https://youtube.com/@crossfit", sourcePriority: 1, isOfficialSource: true, sportType: "CrossFit", tags: ["wall ball", "benchmark"], description: "Oficiální technika wall ballu.", difficulty: "střední", language: "EN", duration: "5:30", isFavorite: true },
  { id: "m2", title: "Karen strategy", type: "video", url: "https://youtube.com/@workoutbody", sourceType: "youtube-inspired", sourceName: "YouTube inspiration", sourceUrl: "https://youtube.com/@workoutbody", sourcePriority: 3, isOfficialSource: false, sportType: "CrossFit", tags: ["karen", "pacing"], description: "Tipy na pacing v Karen.", difficulty: "pokročilý", language: "EN", duration: "8:10", isFavorite: false },
];

export const workoutTemplates: WorkoutTemplate[] = [
  { id: "w1", title: "Karen", sportType: "CrossFit", source: "wodwell", sourceUrl: "https://wodwell.com/wod/karen/", sourcePriority: 2, isOfficialSource: false, description: "150 wall balls for time.", structure: "1 blok", scoreType: "čas", equipment: ["wall ball", "target"], difficulty: "pokročilý", benchmarkTag: "karen", recommendedVideos: ["m1", "m2"] },
  { id: "w2", title: "Push split - hypertrofie", sportType: "Bodybuilding", source: "internal", sourceUrl: "", sourcePriority: 4, isOfficialSource: false, description: "Objemový push trénink.", structure: "6 cviků", scoreType: "objem", equipment: ["bench", "dumbbells"], difficulty: "střední", benchmarkTag: "", recommendedVideos: [] },
];

export const screenshotImports: ScreenshotImport[] = [
  {
    id: "s1",
    userId: "u1",
    date: "2026-04-06",
    sourceType: "internal",
    imagePath: "/mock/apple-fitness-walk.png",
    parsedJson: {
      date: "2026-04-06",
      workoutType: "Walking",
      duration: "48 min",
      distance: "5.9 km",
      calories: 265,
      averageHeartRate: 121,
      pace: "8:08/km",
      elevation: 45,
      effort: "lehké",
    },
    importStatus: "čeká na kontrolu",
  },
];

export const exerciseTechniques: ExerciseTechnique[] = [
  {
    id: "e1",
    exerciseName: "Wall Ball",
    sportType: "CrossFit",
    movementPattern: "squat + throw",
    source: "crossfit",
    sourceUrl: "https://www.crossfit.com/crossfit-movements",
    isOfficialSource: true,
    instructions: "Drž neutrální páteř, plná hloubka dřepu, plynulý přenos síly.",
    commonMistakes: ["Předklon trupu", "Nedokončený dřep", "Pád loktů dolů"],
    scalingOptions: ["lehčí míč", "nižší target", "dělené série"],
    recommendedMediaResourceIds: ["m1", "m2"],
  },
];
