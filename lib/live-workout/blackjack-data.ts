/** Blackjack WOD — svalové partie, cviky a logika sérií 20/1 … 1/20. */

export const BLACKJACK_TOTAL_ROUNDS = 20;
export const BLACKJACK_TOTAL_REPS = 420;

export const BLACKJACK_MUSCLE_ORDER = [
  "Prsa",
  "Břicho",
  "Ramena",
  "Trapézy",
  "Záda",
  "Biceps",
  "Triceps",
  "Kvadriceps",
  "Hamstringy",
  "Lýtka",
  "CrossFit",
] as const;

export type BlackjackMuscleGroup = (typeof BLACKJACK_MUSCLE_ORDER)[number];

export const BLACKJACK_MUSCLE_GROUPS: Record<BlackjackMuscleGroup, string[]> = {
  Ramena: ["Tlak s velkou činkou (vestoje / sed)", "Mrtvý tah"],
  Trapézy: ["Krčení ramen (jednoručky)", "Krčení ramen (osa)"],
  Záda: ["Shyby", "Přítahy v předklonu (činka / jednoručky)", "Inverted row / TRX row"],
  Prsa: ["Push-up", "Rozpažování na lavici (jednoručky)"],
  Biceps: ["Bicepsový zdvih (osa)", "Bicepsový zdvih (jednoručky)"],
  Triceps: ["Tlaky za hlavou (kotouč / jednoručky)", "Kliky na lavičce (dipy)"],
  Kvadriceps: ["Air squat (full)", "Air squat k lavičce"],
  Hamstringy: ["Sumo mrtvý tah", "Mrtvý tah s napnutýma nohama"],
  Lýtka: ["Výpony (stoje)"],
  Břicho: ["Sit-up", "Sedy-lehy", "Plank", "V-ups"],
  CrossFit: ["Wall ball", "Thruster", "Deadlift", "Snatch", "Clean", "Burpee"],
};

export const BLACKJACK_DEFAULT_MUSCLE_A: BlackjackMuscleGroup = "Prsa";
export const BLACKJACK_DEFAULT_EXERCISE_A = "Push-up";
export const BLACKJACK_DEFAULT_MUSCLE_B: BlackjackMuscleGroup = "Břicho";
export const BLACKJACK_DEFAULT_EXERCISE_B = "Sit-up";

export function getBlackjackExercisesForMuscle(muscle: string): string[] {
  const m = muscle.trim() as BlackjackMuscleGroup;
  return BLACKJACK_MUSCLE_GROUPS[m] ?? [];
}

/** Série 1…20: kolo `round` (1-based) → opakování cviku A a B (součet vždy 21). */
export function blackjackRoundReps(round: number): { repsA: number; repsB: number } {
  const r = Math.max(1, Math.min(BLACKJACK_TOTAL_ROUNDS, Math.round(round)));
  return { repsA: 21 - r, repsB: r };
}

export function blackjackRoundLabel(
  round: number,
  exerciseA: string,
  exerciseB: string,
): string {
  const { repsA, repsB } = blackjackRoundReps(round);
  return `${repsA} × ${exerciseA} + ${repsB} × ${exerciseB}`;
}
