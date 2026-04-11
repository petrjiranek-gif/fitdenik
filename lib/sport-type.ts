import type { SportType } from "@/lib/types";

const ORDER: SportType[] = [
  "CrossFit",
  "Bodybuilding",
  "Cycling",
  "Walking",
  "Scooter",
  "Skiing",
  "Nordic walking",
];

/**
 * Mapuje text z OCR / Apple Fitness / ručního vstupu na platný SportType.
 * Dříve neznámý řetězec spadl na Walking → špatně u „Cross training“ apod.
 */
export function coerceSportType(raw: unknown): SportType {
  const s = String(raw ?? "").trim();
  if (!s) return "Walking";
  if (ORDER.includes(s as SportType)) return s as SportType;

  const lower = s.toLowerCase();
  const compact = lower.replace(/\s+/g, " ");

  if (
    /cross[\s-]?train|crosstrain|cross[\s-]?fit|^hiit$|funkcn|funkční|funkcni|silov|strength/i.test(
      compact,
    )
  ) {
    return "CrossFit";
  }
  if (/(^|[^a-z])cf($|[^a-z])|^wod$/i.test(compact)) return "CrossFit";
  if (/(nordic\s*walk|seversk)/i.test(compact)) return "Nordic walking";
  if (/(walk|chuz|walking|vychaz|prochaz|indoor|vnit|treadmill|behat|beh|run|jog)/i.test(compact)) {
    return "Walking";
  }
  if (/(cycle|bike|cyklo|kolo|spin|rowing|veslov)/i.test(compact)) return "Cycling";
  if (/(scooter|kolob)/i.test(compact)) return "Scooter";
  if (/(ski|lyz|snowboard)/i.test(compact)) return "Skiing";
  if (/(body|hypertrof|push|pull|leg day|posilov)/i.test(compact)) return "Bodybuilding";

  return "Walking";
}

export const SPORT_TYPE_OPTIONS: SportType[] = [...ORDER];
