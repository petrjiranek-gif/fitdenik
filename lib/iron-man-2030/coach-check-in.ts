import type { IronManCoachCheckIn } from "@/lib/iron-man-2030/types";

export const CHECKIN_FEELING_PRESETS = [
  "Dobře, připravený",
  "Dobře, mírná únava",
  "Unavený po víkendu",
  "Únava v nohách",
  "Špatně spal",
  "Nemoc / nachlazení",
] as const;

export const CHECKIN_LIMITATION_PRESETS = [
  "Žádná omezení",
  "Cestování",
  "Hotel bez bazénu",
  "Omezený čas",
  "Citlivé klouby / holeně",
  "Zranění / bolest",
  "Práce / rodina",
] as const;

export const CHECKIN_EQUIPMENT_PRESETS = [
  "Bazén",
  "Koloběžka",
  "Gravel kolo",
  "Běžecká obuv",
  "Gym / činky",
  "TRX / gumy",
  "Nordic walking hole",
  "Jen hotelová posilovna",
] as const;

export const CHECKIN_PRIORITY_PRESETS = [
  "Aerobní základ (Zóna 2)",
  "Spalování / hubnutí",
  "Regenerace",
  "Síla / kulturistika",
  "Objem / engine",
  "Příprava na závod",
] as const;

export function createCoachCheckIn(input: Omit<IronManCoachCheckIn, "id" | "createdAt">): IronManCoachCheckIn {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}

export function formatCheckInForCoach(checkIn: IronManCoachCheckIn | null | undefined): {
  feeling: string;
  limitations: string;
  equipment: string;
  priority: string;
  comment: string;
} {
  if (!checkIn) {
    return {
      feeling: "—",
      limitations: "—",
      equipment: "—",
      priority: "—",
      comment: "—",
    };
  }
  return {
    feeling: checkIn.feeling.trim() || "—",
    limitations: checkIn.limitations.trim() || "—",
    equipment: checkIn.equipment.trim() || "—",
    priority: checkIn.priority.trim() || "—",
    comment: checkIn.comment?.trim() || "—",
  };
}

export function isCheckInFresh(checkIn: IronManCoachCheckIn | null | undefined, maxAgeDays = 7): boolean {
  if (!checkIn?.createdAt) return false;
  const age = Date.now() - new Date(checkIn.createdAt).getTime();
  return age <= maxAgeDays * 24 * 3600 * 1000;
}
