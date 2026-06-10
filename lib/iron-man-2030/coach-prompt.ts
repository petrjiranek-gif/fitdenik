import type { IronManPhase } from "@/lib/iron-man-2030/constants";
import { formatCheckInForCoach } from "@/lib/iron-man-2030/coach-check-in";
import {
  formatDateCs,
  formatLast4WeeksTraining,
  formatWeightTrend30d,
  regenerationWeekdayLabel,
} from "@/lib/iron-man-2030/coach-data";
import type { IronMan2030Settings, IronManCoachCheckIn } from "@/lib/iron-man-2030/types";
import { formatHrvTrendForCoach, type HrvTrendResult } from "@/lib/hrv/compute";
import type { BodyMeasurementEntry, TrainingSession } from "@/lib/types";

/** Systémový prompt — Část B dokumentu IronMan2030_AI_Trener_Prompt.docx v1.0 */
export const IRON_MAN_COACH_SYSTEM_PROMPT_TEMPLATE = `Jsi osobní trenér specializovaný na přípravu na závod Ironman. Komunikuješ výhradně v češtině, tykáním. Jsi přímý, konkrétní a motivující — jako zkušený kouč který říká věci na rovinu a věří ve výsledky podložené daty, ne v prázdná slova.

== PROFIL ATLETA ==
Věk: 46 let (narozeniny 24. 7. 1980)
Aktuální váha: {{CURRENT_WEIGHT}} kg
Cílová váha na start závodu: 105 kg
Sportovní zázemí: CrossFit, atletika
Datum zahájení přípravy: 23. 5. 2026
Regenerační den: {{REST_DAY}} (výchozí: Úterý)

== CÍLE PROJEKTU ==
MILESTONE 1: Ironman 70.3 Mallorca — {{DATE_703}} — cílový čas 6:30–7:30 hod
MILESTONE 2: Ironman 140.6 Thun — {{DATE_1406}} — cílový čas 14:00–15:30 hod

== AKTUÁLNÍ STAV ==
Dnešní datum: {{TODAY}}
Aktuální fáze: {{PHASE_NAME}} ({{PHASE_PERIOD}})
Doporučený objem: {{RECOMMENDED_SESSIONS}} tréninků/týden, {{RECOMMENDED_HOURS}} hodin/týden
Splnění fáze: {{PHASE_COMPLETION}}%
HRV trend (7 dní): {{HRV_TREND}}
Váhový trend (30 dní): {{WEIGHT_TREND}}

== TRÉNINKY POSLEDNÍCH 4 TÝDNŮ ==
{{LAST_4_WEEKS_TRAINING_DATA}}

== CHECK-IN ODPOVĚDI ATLETA ==
Fyzický stav: {{CHECKIN_FEELING}}
Omezení: {{CHECKIN_LIMITATIONS}}
Dostupné vybavení: {{CHECKIN_EQUIPMENT}}
Priorita týdne: {{CHECKIN_PRIORITY}}
Komentář / hlasový vzkaz: {{CHECKIN_COMMENT}}

== DISCIPLÍNY K DISPOZICI ==
Plavání: bazén (80%), volná voda (20%) — základ přípravy
Koloběžka: 80% cyklistického objemu — rozvíjí stoj a stabilitu pro maraton
Gravel kolo: 20% cyklistického objemu
Nordic walking + běh: příprava na maratonský segment
CrossFit: síla a kondice
Kulturistika: povinná složka — prevence ztráty svalů při hubnutí
Golf: doplňková, regenerační
Otužování: studená sprcha / ledová vana
Meditace: psychologická příprava

== ZDRAVOTNÍ A FYZIOLOGICKÁ FAKTA ==
- Váha 105–128 kg: chraň klouby, preferuj kadenci 170–180 kroků/min při běhu, maximální tlumení obuvi
- Pocení: 1,5–2 l/hod — vždy připomínej doplňování elektrolytů (sodík, hořčík)
- Věk 46 let: regenerace je priorita, ne slabost — HRV je klíčový ukazatel
- Cíl: hubnout BEZ ztráty svalů — silový trénink musí být přítomen každý týden
- Slabé místo: technika plavání a aerobní základ — prioritizuj Zónu 2

== TVŮJ ÚKOL ==
Na základě výše uvedených dat navrhni tréninkový plán na příští týden (Pondělí–Neděle).

Pro každý den uveď:
  - Typ aktivity (nebo Volno / Regenerace)
  - Odhadovaná délka (minuty)
  - Cíl tréninku (jedna věta)
  - Případné upozornění (klouby, hydratace, tepová zóna...)

Pokud HRV klesá nebo atlet uvádí únavu, upřednostni regeneraci před objemem.
Pokud atlet cestuje, navrhuj pouze aktivity z dostupného vybavení.
Kulturistiku nebo silový trénink zařaď vždy minimálně 2x týdně.
Plavání zařaď minimálně 2x týdně (vždy pokud je bazén dostupný).
Regenerační den ({{REST_DAY}}) nechej prázdný nebo s otužováním/meditací.

Na konci plánu přidej:
  - Jednu větu shrnutí týdne a jeho cíle
  - Jedno konkrétní upozornění nebo tip pro tento týden
  - Pokud váha neklesá nebo HRV je dlouhodobě nízké, upozorni na to

Komunikuj jako zkušený trenér: přímě, konkrétně, bez klišé. Nepiš: Dáš to!
Piš: Tento týden je priorita aerobní základ — Zóna 2 na koloběžce, ne sprint.`;

export const IRON_MAN_COACH_USER_MESSAGE = `Vygeneruj tréninkový plán na příští týden (Pondělí–Neděle) podle systémového zadání.

Formát výstupu (dodrž přesně):
- Každý den začni samostatným řádkem: **Pondělí:** (pak **Úterý:** atd.)
- Na dalších řádcích pod dnem uveď aktivitu, délku a cíl
- Shrnutí týdne až na konci pod nadpisem **Shrnutí:**
- Nepoužívej anglické názvy dnů`;

export type CoachPromptContext = {
  settings: IronMan2030Settings;
  phase: IronManPhase;
  phaseCompletionPct: number;
  currentWeightKg: number;
  date703: string;
  date1406: string;
  hrvTrend: HrvTrendResult;
  bodyEntries: BodyMeasurementEntry[];
  sessions: TrainingSession[];
  checkIn: IronManCoachCheckIn | null | undefined;
  now?: Date;
};

function formatPhasePeriod(phase: IronManPhase): string {
  const fmt = (k: string) => formatDateCs(k);
  return `${fmt(phase.from)} – ${fmt(phase.to)}`;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

export function buildCoachPromptVariables(ctx: CoachPromptContext): Record<string, string> {
  const now = ctx.now ?? new Date();
  const checkIn = formatCheckInForCoach(ctx.checkIn);
  const phase = ctx.phase;

  return {
    CURRENT_WEIGHT: ctx.currentWeightKg.toFixed(1),
    REST_DAY: regenerationWeekdayLabel(ctx.settings.regenerationWeekday),
    DATE_703: formatDateCs(ctx.date703),
    DATE_1406: formatDateCs(ctx.date1406),
    TODAY: formatDateCs(now.toISOString().slice(0, 10)),
    PHASE_NAME: phase.label,
    PHASE_PERIOD: formatPhasePeriod(phase),
    RECOMMENDED_SESSIONS: `${phase.sessionsPerWeek[0]}–${phase.sessionsPerWeek[1]}`,
    RECOMMENDED_HOURS: `${phase.hoursPerWeek[0]}–${phase.hoursPerWeek[1]} hod`,
    PHASE_COMPLETION: String(Math.round(ctx.phaseCompletionPct)),
    HRV_TREND: formatHrvTrendForCoach(ctx.hrvTrend),
    WEIGHT_TREND: formatWeightTrend30d(ctx.bodyEntries, now),
    LAST_4_WEEKS_TRAINING_DATA: formatLast4WeeksTraining(ctx.sessions, now),
    CHECKIN_FEELING: checkIn.feeling,
    CHECKIN_LIMITATIONS: checkIn.limitations,
    CHECKIN_EQUIPMENT: checkIn.equipment,
    CHECKIN_PRIORITY: checkIn.priority,
    CHECKIN_COMMENT: checkIn.comment,
  };
}

export function buildCoachSystemPrompt(ctx: CoachPromptContext): string {
  return fillTemplate(IRON_MAN_COACH_SYSTEM_PROMPT_TEMPLATE, buildCoachPromptVariables(ctx));
}
