"use client";

import { formInputClass } from "@/components/fitdenik/form-fields";
import {
  EDITION_KIND_LABEL,
  RACE_CATALOG,
  formatCountdownShort,
  isRaceWatchActive,
  registrationWatchStatus,
  type RaceIntelId,
} from "@/lib/iron-man-2030/race-intel";
import type {
  IronMan2030Settings,
  IronManRaceRegistration,
  IronManRaceWatch,
  IronManStaySlot,
} from "@/lib/iron-man-2030/types";

function cardClass(extra = "") {
  return `rounded-xl border border-ew-border bg-ew-panel p-4 ${extra}`;
}

function kindClass(kind: "fact" | "plan" | "watch") {
  if (kind === "fact") return "border-emerald-500/40 bg-emerald-950/40 text-emerald-200";
  if (kind === "plan") return "border-sky-500/40 bg-sky-950/40 text-sky-200";
  return "border-amber-500/40 bg-amber-950/40 text-amber-200";
}

export function IronManRaceInfoSection({
  settings,
  onChange,
}: {
  settings: IronMan2030Settings;
  onChange: (patch: Partial<IronMan2030Settings>) => void;
}) {
  const patchWatch = (id: RaceIntelId, next: IronManRaceWatch) => {
    onChange({
      raceWatch: {
        ...settings.raceWatch,
        [id]: next,
      },
    });
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold text-zinc-100">Info k závodům</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Vybrané starty: Moritzburg 2028 a Thun 2030. Poznámky zadáváš ručně. Nejsou to automatické
          novinky ani živé ceny hotelů. Štítky: fakt / plán / sledovat.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RaceWatchCard
          id="moritzburg"
          watch={settings.raceWatch.moritzburg}
          registration={settings.race703}
          onWatch={(next) => patchWatch("moritzburg", next)}
          onRegistration={(race703) => onChange({ race703 })}
        />
        <RaceWatchCard
          id="thun"
          watch={settings.raceWatch.thun}
          registration={settings.race1406}
          onWatch={(next) => patchWatch("thun", next)}
          onRegistration={(race1406) => onChange({ race1406 })}
        />
      </div>
    </section>
  );
}

function RaceWatchCard({
  id,
  watch,
  registration,
  onWatch,
  onRegistration,
}: {
  id: RaceIntelId;
  watch: IronManRaceWatch;
  registration: IronManRaceRegistration;
  onWatch: (next: IronManRaceWatch) => void;
  onRegistration: (next: IronManRaceRegistration) => void;
}) {
  const race = RACE_CATALOG[id];
  const active = isRaceWatchActive(race);
  const status = registrationWatchStatus(watch, registration.registered);

  const setStay = (index: number, patch: Partial<IronManStaySlot>) => {
    const stays = watch.stays.map((slot, i) => (i === index ? { ...slot, ...patch } : slot));
    onWatch({ ...watch, stays });
  };

  return (
    <article className={cardClass()}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ew-muted">
            {race.role === "half" ? "Půlka · A-závod" : "Plná distance · A-závod"}
          </p>
          <h4 className="mt-1 text-lg font-semibold text-white">{race.name}</h4>
          <p className="mt-1 text-sm text-zinc-400">{race.place}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
            active
              ? "border-emerald-500/40 text-emerald-200"
              : "border-zinc-600 text-zinc-400"
          }`}
        >
          {active ? "aktivní hlídání" : "historie"}
        </span>
      </div>
      <p className="mt-2 text-sm">
        <a
          href={race.officialUrl}
          className="text-ew-blue-light hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {race.officialUrlLabel} ↗
        </a>
      </p>
      {!active ? (
        <p className="mt-2 text-xs text-zinc-500">
          Ročník cíle už minul. Karta zůstává jako historie; hlídač registrace dál platí jen pro Thun
          do 2030.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {race.editions.map((edition) => (
          <div key={edition.year} className="rounded-lg border border-ew-border bg-ew-bg/50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${kindClass(edition.kind)}`}>
                {EDITION_KIND_LABEL[edition.kind]}
              </span>
              <p className="text-sm font-medium text-zinc-200">{edition.title}</p>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{edition.body}</p>
            <label className="mt-2 block text-[10px] uppercase text-zinc-500">
              Tvoje poznámka {edition.year}
              <textarea
                className={`${formInputClass} mt-1 min-h-[64px]`}
                placeholder="Termín, dojem z tratě, odkaz na článek…"
                value={watch.editionNotes[String(edition.year)] ?? ""}
                onChange={(e) =>
                  onWatch({
                    ...watch,
                    editionNotes: { ...watch.editionNotes, [String(edition.year)]: e.target.value },
                  })
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-ew-border pt-3">
        <p className="text-sm font-medium text-zinc-200">
          Rekognoskace {race.scoutYear} · dovolená
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Není to odjetý závod. Jen termín cesty, až ho budeš znát.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-400">
            Od
            <input
              type="date"
              className={`${formInputClass} mt-1`}
              value={watch.scoutFrom ?? ""}
              onChange={(e) => onWatch({ ...watch, scoutFrom: e.target.value || undefined })}
            />
          </label>
          <label className="text-xs text-zinc-400">
            Do
            <input
              type="date"
              className={`${formInputClass} mt-1`}
              value={watch.scoutTo ?? ""}
              onChange={(e) => onWatch({ ...watch, scoutTo: e.target.value || undefined })}
            />
          </label>
        </div>
      </div>

      <div className="mt-4 border-t border-ew-border pt-3">
        <p className="text-sm font-medium text-zinc-200">Hlídač registrace {race.raceYear}</p>
        <p className="mt-1 text-xs text-zinc-400">{status.label}</p>
        {status.countdownTo ? (
          <p className="mt-1 text-sm tabular-nums text-ew-blue-light">
            Zbývá {formatCountdownShort(status.countdownTo)} ·{" "}
            {new Date(`${status.countdownTo}T12:00:00`).toLocaleDateString("cs-CZ")}
          </p>
        ) : null}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-400">
            Otevření přihlášek
            <input
              type="date"
              className={`${formInputClass} mt-1`}
              value={watch.registrationOpensAt ?? ""}
              onChange={(e) =>
                onWatch({ ...watch, registrationOpensAt: e.target.value || undefined })
              }
            />
          </label>
          <label className="text-xs text-zinc-400">
            Uzávěrka
            <input
              type="date"
              className={`${formInputClass} mt-1`}
              value={watch.registrationClosesAt ?? ""}
              onChange={(e) =>
                onWatch({ ...watch, registrationClosesAt: e.target.value || undefined })
              }
            />
          </label>
          <label className="text-xs text-zinc-400">
            Datum závodu (až bude oficiální)
            <input
              type="date"
              className={`${formInputClass} mt-1`}
              value={registration.actualRaceDate ?? ""}
              onChange={(e) =>
                onRegistration({ ...registration, actualRaceDate: e.target.value || undefined })
              }
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={registration.registered}
              onChange={(e) => {
                const registered = e.target.checked;
                onRegistration({
                  ...registration,
                  registered,
                  registeredAt: registered
                    ? registration.registeredAt || new Date().toISOString().slice(0, 10)
                    : registration.registeredAt,
                });
              }}
            />
            Registrován
          </label>
        </div>
      </div>

      <div className="mt-4 border-t border-ew-border pt-3">
        <p className="text-sm font-medium text-zinc-200">Ubytování — tvůj seznam</p>
        <p className="mt-1 text-xs text-zinc-500">
          Tři sloty na ověřené adresy. Žádný automatický katalog, žádné ceny.
        </p>
        <div className="mt-2 space-y-3">
          {watch.stays.map((slot, index) => (
            <div key={index} className="rounded-lg border border-ew-border bg-ew-bg/40 p-3">
              <p className="text-[10px] uppercase text-zinc-500">Slot {index + 1}</p>
              <label className="mt-1 block text-xs text-zinc-400">
                Název
                <input
                  className={`${formInputClass} mt-1`}
                  placeholder={race.stayHints[index]}
                  value={slot.name}
                  onChange={(e) => setStay(index, { name: e.target.value })}
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Odkaz
                <input
                  className={`${formInputClass} mt-1`}
                  placeholder="https://…"
                  value={slot.url}
                  onChange={(e) => setStay(index, { url: e.target.value })}
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Vzdálenost k depu / startu
                <input
                  className={`${formInputClass} mt-1`}
                  placeholder="např. 800 m pěšky"
                  value={slot.distanceNote}
                  onChange={(e) => setStay(index, { distanceNote: e.target.value })}
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Poznámka
                <textarea
                  className={`${formInputClass} mt-1 min-h-[48px]`}
                  placeholder="ticho, parkování, snídaně…"
                  value={slot.notes}
                  onChange={(e) => setStay(index, { notes: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
