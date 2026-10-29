/** Standard provedení — různé varianty nesdílejí osobní rekord. */

export type MovementStandard =
  | "air_squat_calf_raise"
  | "air_squat_plain"
  | "burpee_open_12_1"
  | "burpee_step_out"
  | "burpee_other"
  | "plank_forearm"
  | "wall_sit"
  | "calf_raise_both";

export const MOVEMENT_STANDARD_LABELS: Record<MovementStandard, string> = {
  air_squat_calf_raise: "Air squat s výponem (cyklus A)",
  air_squat_plain: "Samostatný air squat (bez výponu)",
  burpee_open_12_1: "Burpee Open 12.1",
  burpee_step_out: "Upravené burpee odkročením, bez výskoku",
  burpee_other: "Jiná varianta burpee",
  plank_forearm: "Plank na předloktích",
  wall_sit: "Wall sit",
  calf_raise_both: "Samostatné výpony oběma nohama",
};

export const BURPEE_STANDARDS: MovementStandard[] = [
  "burpee_open_12_1",
  "burpee_step_out",
  "burpee_other",
];

export const SQUAT_STANDARDS: MovementStandard[] = ["air_squat_calf_raise", "air_squat_plain"];

export function defaultStandardForWod(wodKey: string): MovementStandard {
  if (wodKey === "open_12_1" || wodKey === "home_burpee_60") return "burpee_open_12_1";
  if (wodKey === "home_circuit_6min" || wodKey === "home_circuit_carving") return "air_squat_plain";
  return "air_squat_calf_raise";
}

export function isBurpeeWodKey(wodKey: string | undefined): boolean {
  return wodKey === "open_12_1" || wodKey === "home_burpee_60";
}

/** 1 dřep s výponem ≈ 10 otáček klik — symbolický model, ne fyziologický ekvivalent. */
export const SYMBOLIC_CRANK_REVS_PER_CYCLE = 10;

export function symbolicCrankRevs(cycles: number): number {
  return Math.max(0, cycles) * SYMBOLIC_CRANK_REVS_PER_CYCLE;
}
