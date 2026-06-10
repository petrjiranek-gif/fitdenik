import type { SportType } from "@/lib/types";

/** Výběr sportů v deníku — sladěno s disciplínami Iron Man 2030. */
export const SPORT_TYPE_ENTRIES: { value: SportType; label: string }[] = [
  { value: "CrossFit", label: "CrossFit" },
  { value: "Bodybuilding", label: "Kulturistika" },
  { value: "Swimming", label: "Plavání" },
  { value: "Scooter", label: "Koloběžka" },
  { value: "Gravel cycling", label: "Gravel / bikepacking" },
  { value: "Road cycling", label: "Silniční cyklistika" },
  { value: "MTB", label: "MTB / horské kolo" },
  { value: "Cycling", label: "Cyklistika (obecně)" },
  { value: "Running", label: "Běh" },
  { value: "Walking", label: "Chůze" },
  { value: "Nordic walking", label: "Nordic walking" },
  { value: "Golf", label: "Golf" },
  { value: "Skiing", label: "Lyžování" },
];

const ORDER: SportType[] = SPORT_TYPE_ENTRIES.map((e) => e.value);

const LABEL_BY_VALUE = new Map(SPORT_TYPE_ENTRIES.map((e) => [e.value, e.label]));

export function sportTypeLabel(sport: SportType): string {
  return LABEL_BY_VALUE.get(sport) ?? sport;
}

/**
 * Mapuje text z OCR / Kondice / Apple Fitness / ručního vstupu na platný SportType.
 */
export function coerceSportType(raw: unknown): SportType {
  const s = String(raw ?? "").trim();
  if (!s) return "Walking";
  if (ORDER.includes(s as SportType)) return s as SportType;

  const lower = s.toLowerCase();
  const compact = lower.replace(/\s+/g, " ");

  if (
    /cross[\s-]?train|crosstrain|cross[\s-]?fit|^hiit$|funkcn|funkční|funkcni|^cf$|emom|amrap|metcon|tabata|interval|mixed\s*cardio|funkcn[ií]\s*trénink/i.test(
      compact,
    )
  ) {
    return "CrossFit";
  }
  if (/(traditional\s*strength|silov[yý]\s*trénink|power\s*lift)/i.test(compact)) {
    return "Bodybuilding";
  }
  if (/(^|[^a-z])cf($|[^a-z])|^wod$/i.test(compact)) return "CrossFit";
  if (/(^|[^a-z])golf([^a-z]|$)|\bgolf\b/i.test(compact)) return "Golf";
  if (/(swim|plav|baz[eé]n|pool|open\s*water)/i.test(compact)) return "Swimming";
  if (/(gravel|bikepack|šotolin|shotolin)/i.test(compact)) return "Gravel cycling";
  if (/(^|[^a-z])mtb([^a-z]|$)|horsk[eé]\s*kolo|mountain\s*bike/i.test(compact)) return "MTB";
  if (/(silni[cč]n|road\s*bike|road\s*cycl)/i.test(compact)) return "Road cycling";
  if (/(nordic\s*walk|seversk)/i.test(compact)) return "Nordic walking";
  if (/(^|[^a-z])(run|b[eě]h|jog|maraton)([^a-z]|$)/i.test(compact) && !/walk|ch[uů]z|nordic/i.test(compact)) {
    return "Running";
  }
  if (/(walk|ch[uů]z|walking|proch[aá]z|treadmill)/i.test(compact)) return "Walking";
  if (/(cycle|bike|cyklo|cyklist|kolo|spin|j[ií]zda\s*na\s*kole|veslov)/i.test(compact)) return "Cycling";
  if (/(scooter|kolob)/i.test(compact)) return "Scooter";
  if (/(ski|ly[zž]|snowboard)/i.test(compact)) return "Skiing";
  if (/(body|hypertrof|push|pull|leg day|posilov)/i.test(compact)) return "Bodybuilding";

  return "Walking";
}

export const SPORT_TYPE_OPTIONS: SportType[] = [...ORDER];
