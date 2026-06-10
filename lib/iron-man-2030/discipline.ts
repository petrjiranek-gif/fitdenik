import type { IronManDisciplineId } from "@/lib/iron-man-2030/constants";
import type { IronManDisciplineTag, SportType, TrainingSession } from "@/lib/types";

/** Výchozí mapování sportu z deníku na disciplínu Iron Man modulu. */
export function disciplineFromSportType(sport: SportType): IronManDisciplineTag {
  switch (sport) {
    case "Swimming":
      return "swim";
    case "Scooter":
      return "scooter";
    case "Gravel cycling":
    case "Road cycling":
    case "MTB":
    case "Cycling":
      return "gravel";
    case "Nordic walking":
      return "nordic_walk";
    case "Running":
    case "Walking":
    case "Skiing":
      return "run";
    case "Golf":
      return "golf";
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
