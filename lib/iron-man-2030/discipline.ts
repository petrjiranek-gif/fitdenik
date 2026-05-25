import type { IronManDisciplineId } from "@/lib/iron-man-2030/constants";
import type { IronManDisciplineTag, SportType, TrainingSession } from "@/lib/types";

/** Výchozí mapování sportu z deníku na disciplínu Iron Man modulu. */
export function disciplineFromSportType(sport: SportType): IronManDisciplineTag {
  switch (sport) {
    case "Cycling":
      return "gravel";
    case "Scooter":
      return "scooter";
    case "Walking":
      return "run";
    case "Nordic walking":
      return "nordic_walk";
    case "CrossFit":
      return "crossfit";
    case "Bodybuilding":
      return "bodybuilding";
    default:
      return "run";
  }
}

export function resolveTrainingDiscipline(session: TrainingSession): IronManDisciplineTag {
  if (session.ironManDiscipline) return session.ironManDiscipline;
  return disciplineFromSportType(session.sportType);
}
