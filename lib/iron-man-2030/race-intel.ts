import { computeCountdown } from "@/lib/iron-man-2030/compute";
import type { IronManRaceWatch, IronManStaySlot } from "@/lib/iron-man-2030/types";

export type RaceIntelId = "moritzburg" | "thun";
export type RaceEditionKind = "fact" | "plan" | "watch";

export type RaceEdition = {
  year: number;
  kind: RaceEditionKind;
  title: string;
  body: string;
};

export type RaceCatalogEntry = {
  id: RaceIntelId;
  name: string;
  shortLabel: string;
  place: string;
  officialUrl: string;
  officialUrlLabel: string;
  role: "half" | "full";
  raceYear: number;
  scoutYear: number;
  watchUntilYear: number;
  editions: RaceEdition[];
  stayHints: [string, string, string];
};

export const EMPTY_STAY: IronManStaySlot = {
  name: "",
  url: "",
  distanceNote: "",
  notes: "",
};

export const RACE_CATALOG: Record<RaceIntelId, RaceCatalogEntry> = {
  moritzburg: {
    id: "moritzburg",
    name: "Schloss-Triathlon Moritzburg",
    shortLabel: "Moritzburg 2028",
    place: "Moritzburg, Sasko — u Drážďan (zámek a jezera). Adresa pořadatele: Schlossallee 3b, 01468 Moritzburg.",
    officialUrl: "https://schlosstriathlon.de/",
    officialUrlLabel: "schlosstriathlon.de",
    role: "half",
    raceYear: 2028,
    scoutYear: 2027,
    watchUntilYear: 2028,
    stayHints: [
      "např. v obci u zámku, pěšky k depu",
      "např. Drážďany jako základna",
      "např. penzion u jezer",
    ],
    editions: [
      {
        year: 2026,
        kind: "fact",
        title: "Ročník 2026 — odjeto",
        body: "24. Schloss-Triathlon, 13.–14. 6. 2026. Půlka v sobotu. Pořadatel uváděl 1,9 / 87 / 21,1 km (ne automaticky 1,9 / 90 / 21,1). Přihlášky půlky/dlouhé od 8. 1. 2026 18:00, Meldeschluss konec května 2026.",
      },
      {
        year: 2027,
        kind: "plan",
        title: "2027 — rekognoskace (dovolená)",
        body: "Plán: jet jako turista, ne jako závodník. Prohlédnout vodu, kolo, depa a ubytování. Pořadatel na webu uvádí, že online přihlášky se otevřou začátkem ledna 2027 — přesný den doplň do hlídače, až ho vypíšou.",
      },
      {
        year: 2028,
        kind: "plan",
        title: "2028 — A-závod (vybraný)",
        body: "Cílový ročník místo Mallorcy. Datum, tratě a limity 2028 zatím nejsou propozice — pracovní odpočet 24. 7. 2028 je náš, ne termín pořadatele.",
      },
    ],
  },
  thun: {
    id: "thun",
    name: "IRONMAN Switzerland Thun",
    shortLabel: "Thun 2030",
    place: "Thun, Švýcarsko — Thunské jezero, Stadion Lachen (Gwattstrasse). Plavání v jezeře, kolo kopcovité, běh spíš plochý.",
    officialUrl: "https://www.ironman.com/races/im-switzerland",
    officialUrlLabel: "ironman.com/races/im-switzerland",
    role: "full",
    raceYear: 2030,
    scoutYear: 2029,
    watchUntilYear: 2030,
    stayHints: [
      "např. u jezera / Stadion Lachen",
      "např. centrum Thunu",
      "např. klidnější ubytování mimo finish",
    ],
    editions: [
      {
        year: 2026,
        kind: "fact",
        title: "Ročník 2026 — odjeto",
        body: "Neděle 5. 7. 2026, Stadion Lachen. Plná distance přibližně 3,8 / 180 / 42,2 km.",
      },
      {
        year: 2027,
        kind: "watch",
        title: "2027 — sledovat ročník",
        body: "Pořadatel uvádí 4. 7. 2027. Registrace tohoto ročníku je (stav podzim 2026) vyprodaná. Není to tvůj cílový start — jen zdroj informací o trati a organizaci.",
      },
      {
        year: 2028,
        kind: "watch",
        title: "2028 — sledovat ročník",
        body: "Termín a registrace 2028 zatím nejsou v této kartě jako fakt. Doplň, až Ironman zveřejní.",
      },
      {
        year: 2029,
        kind: "plan",
        title: "2029 — rekognoskace (dovolená)",
        body: "Plán: jet jako turista rok před A-závodem. Ověřit ubytování, jezero a dojezd na Stadion Lachen. Není to odjetý Ironman.",
      },
      {
        year: 2030,
        kind: "plan",
        title: "2030 — A-závod (vybraný)",
        body: "Cíl k 50. narozeninám. Účast závisí na konání a podmínkách ročníku 2030. Pracovní odpočet 24. 7. 2030 je náš, ne oficiální termín, dokud ho Ironman nevypíše.",
      },
    ],
  },
};

export function emptyRaceWatch(): IronManRaceWatch {
  return {
    editionNotes: {},
    stays: [EMPTY_STAY, EMPTY_STAY, EMPTY_STAY].map((s) => ({ ...s })),
  };
}

export function normalizeStays(stays: IronManStaySlot[] | undefined): IronManStaySlot[] {
  const next = (Array.isArray(stays) ? stays : []).slice(0, 3).map((s) => ({
    name: s?.name ?? "",
    url: s?.url ?? "",
    distanceNote: s?.distanceNote ?? "",
    notes: s?.notes ?? "",
  }));
  while (next.length < 3) next.push({ ...EMPTY_STAY });
  return next;
}

export function normalizeRaceWatch(raw: Partial<IronManRaceWatch> | undefined): IronManRaceWatch {
  const base = emptyRaceWatch();
  if (!raw) return base;
  return {
    registrationOpensAt: raw.registrationOpensAt || undefined,
    registrationClosesAt: raw.registrationClosesAt || undefined,
    scoutFrom: raw.scoutFrom || undefined,
    scoutTo: raw.scoutTo || undefined,
    editionNotes: raw.editionNotes && typeof raw.editionNotes === "object" ? raw.editionNotes : {},
    stays: normalizeStays(raw.stays),
  };
}

export function isRaceWatchActive(race: RaceCatalogEntry, today = new Date()): boolean {
  return today.getFullYear() <= race.watchUntilYear;
}

export type RegistrationWatchKind = "not_announced" | "opens_later" | "open" | "closed" | "registered";

export type RegistrationWatchStatus = {
  kind: RegistrationWatchKind;
  label: string;
  countdownTo?: string;
};

function todayKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function registrationWatchStatus(
  watch: IronManRaceWatch,
  registered: boolean,
  now = new Date(),
): RegistrationWatchStatus {
  if (registered) {
    return { kind: "registered", label: "Registrován" };
  }
  const today = todayKey(now);
  const opens = watch.registrationOpensAt;
  const closes = watch.registrationClosesAt;
  if (!opens && !closes) {
    return { kind: "not_announced", label: "Termín registrace ještě nevyhlášen" };
  }
  if (closes && today > closes) {
    return { kind: "closed", label: "Uzávěrka registrace už minula" };
  }
  if (opens && today < opens) {
    return {
      kind: "opens_later",
      label: "Registrace ještě nezačala",
      countdownTo: opens,
    };
  }
  if (closes) {
    return {
      kind: "open",
      label: "Registrace běží — hlídej uzávěrku",
      countdownTo: closes,
    };
  }
  return { kind: "open", label: "Registrace je otevřená (uzávěrka neznámá)" };
}

export function formatCountdownShort(targetIso: string, now = new Date()): string {
  const p = computeCountdown(targetIso, now);
  if (p.years <= 0 && p.days <= 0 && p.hours <= 0 && p.minutes <= 0 && p.seconds <= 0) {
    return "dnes / po termínu";
  }
  const bits: string[] = [];
  if (p.years) bits.push(`${p.years} r.`);
  bits.push(`${p.days} d.`);
  return bits.join(" ");
}

export const EDITION_KIND_LABEL: Record<RaceEditionKind, string> = {
  fact: "fakt",
  plan: "plán",
  watch: "sledovat",
};
