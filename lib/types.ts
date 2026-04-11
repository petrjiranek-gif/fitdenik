export type SourceType =
  | "custom"
  | "wodwell"
  | "crossfit"
  | "youtube-inspired"
  | "internal";

export type SportType =
  | "CrossFit"
  | "Bodybuilding"
  | "Cycling"
  | "Walking"
  | "Scooter"
  | "Skiing"
  | "Nordic walking";

/** Živý trénink — kategorie (CrossFit má výběr benchmark WOD). */
export type LiveSportCategory = "crossfit" | "bodybuilding" | "bodyweight";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  baselineWeightKg: number;
  waistCm: number;
  estimatedBodyFatPct: number;
  restingHeartRate: number;
  activityLevel: string;
  goals: string[];
  limitations: string;
  notes: string;
}

export interface BodyMetrics {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  bodyFatPct: number;
  muscleMassKg: number;
  visceralFat: number;
  bmi: number;
  waterPct: number;
  boneMassKg: number;
  bmr: number;
  notes: string;
}

/** Jedno časované měření (váha + chytrá váha + obvody), ukládá se do historie. */
export interface BodyMeasurementEntry {
  id: string;
  userId: string;
  /** ISO 8601 (datum a čas měření). */
  measuredAt: string;
  weightKg: number;
  scaleBmi: number;
  scaleBodyFatPct: number;
  scaleMuscleMassKg: number;
  scaleBodyWaterPct: number;
  scaleLeanMassKg: number;
  scaleBoneMassKg: number;
  scaleProteinPct: number;
  scaleVisceralFat: number;
  scaleBmrKcal: number;
  scaleMetabolicAge: number;
  neckCm: number;
  chestRelaxedCm: number;
  chestFlexedCm: number;
  armRelaxedCm: number;
  armFlexedCm: number;
  waistCm: number;
  hipsCm: number;
  thighCm: number;
  calfCm: number;
  notes: string;
}

export interface TrainingSession {
  id: string;
  userId: string;
  date: string;
  sportType: SportType;
  title: string;
  durationMin: number;
  distanceKm: number;
  avgHeartRate: number;
  calories: number;
  elevation: number;
  pace: string;
  effort: string;
  rpe: number;
  notes: string;
}

export interface ExerciseEntry {
  id: string;
  trainingSessionId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number;
  timeSec: number;
  restSec: number;
  notes: string;
}

export interface BenchmarkResult {
  id: string;
  userId: string;
  date: string;
  benchmarkName: string;
  resultType: string;
  resultValue: string;
  scaling: string;
  notes: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterLiters: number;
  bodyWeightKg: number;
  notes: string;
}

export interface Consultation {
  id: string;
  clientName: string;
  date: string;
  topic: string;
  notes: string;
  recommendations: string;
  followUp: string;
  status: "plánováno" | "probíhá" | "uzavřeno";
}

export interface MediaResource {
  id: string;
  title: string;
  type: string;
  url: string;
  sourceType: SourceType;
  sourceName: string;
  sourceUrl: string;
  sourcePriority: number;
  isOfficialSource: boolean;
  sportType: SportType;
  tags: string[];
  description: string;
  difficulty: string;
  language: string;
  duration: string;
  isFavorite: boolean;
}

export interface ExerciseTechnique {
  id: string;
  exerciseName: string;
  sportType: SportType;
  movementPattern: string;
  source: SourceType;
  sourceUrl: string;
  isOfficialSource: boolean;
  instructions: string;
  commonMistakes: string[];
  scalingOptions: string[];
  recommendedMediaResourceIds: string[];
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  sportType: SportType;
  source: SourceType;
  sourceUrl: string;
  sourcePriority: number;
  isOfficialSource: boolean;
  description: string;
  structure: string;
  scoreType: string;
  equipment: string[];
  difficulty: string;
  benchmarkTag: string;
  recommendedVideos: string[];
}

export interface ScreenshotImport {
  id: string;
  userId: string;
  date: string;
  sourceType: SourceType;
  imagePath: string;
  parsedJson: Record<string, string | number>;
  importStatus: "čeká na kontrolu" | "potvrzeno";
  linkedTrainingSessionId?: string;
}

export interface WorkoutExecution {
  id: string;
  userId: string;
  workoutTemplateId: string;
  date: string;
  mode: "counter" | "set" | "timer-reps" | "round" | "emom";
  status: "in-progress" | "finished";
  startTime: string;
  endTime?: string;
  totalDurationSec: number;
  totalReps: number;
  notes: string;
}

export interface WorkoutExecutionStep {
  id: string;
  executionId: string;
  exerciseName: string;
  targetReps: number;
  completedReps: number;
  targetRounds: number;
  completedRounds: number;
  orderIndex: number;
}

export interface WorkoutExecutionLog {
  id: string;
  executionId: string;
  stepId: string;
  timestamp: string;
  actionType: string;
  value: number;
  cumulativeReps: number;
  elapsedSec: number;
}
