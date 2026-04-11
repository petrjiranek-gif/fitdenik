"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRepositories } from "@/lib/repositories/provider";
import type { BodyMeasurementInput } from "@/lib/repositories/contracts";
import { createEmptyMeasurementInput } from "@/lib/measurement-defaults";
import { datetimeLocalValueToIso, isoToDatetimeLocalValue } from "@/lib/datetime-local";
import { BaselineSilhouette } from "@/components/fitdenik/baseline-silhouette";
import { bmiFromHeightWeight, DecimalField, formInputClass, NumField } from "@/components/fitdenik/form-fields";
import type { BaselineInput } from "@/lib/repositories/contracts";

export function MeasurementForm() {
  const router = useRouter();
  const repositories = useMemo(() => getRepositories(), []);
  const baseline = useMemo(
    () => repositories.baseline.get() ?? repositories.baseline.getDefaults(),
    [repositories],
  );

  const initial = useMemo(() => createEmptyMeasurementInput(new Date().toISOString()), []);
  const [form, setForm] = useState<BodyMeasurementInput>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedBmi = bmiFromHeightWeight(form.weightKg, baseline.heightCm);

  const setNum = <K extends keyof BodyMeasurementInput>(key: K, n: BodyMeasurementInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: n }));
  };

  const silhouetteData: Pick<
    BaselineInput,
    | "baselineWeightKg"
    | "neckCm"
    | "chestRelaxedCm"
    | "chestFlexedCm"
    | "armRelaxedCm"
    | "armFlexedCm"
    | "waistCm"
    | "hipsCm"
    | "thighCm"
    | "calfCm"
  > = {
    baselineWeightKg: form.weightKg,
    neckCm: form.neckCm,
    chestRelaxedCm: form.chestRelaxedCm,
    chestFlexedCm: form.chestFlexedCm,
    armRelaxedCm: form.armRelaxedCm,
    armFlexedCm: form.armFlexedCm,
    waistCm: form.waistCm,
    hipsCm: form.hipsCm,
    thighCm: form.thighCm,
    calfCm: form.calfCm,
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.weightKg <= 0) {
      setError("Zadej váhu v kg (větší než 0).");
      return;
    }
    try {
      repositories.bodyMeasurements.create({
        ...form,
        measuredAt: form.measuredAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Uložení se nezdařilo.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Čas měření</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Záznam se uloží s datem a časem. Výška z baseline ({baseline.heightCm} cm) se použije jen pro výpočet BMI.
            </p>
            <div className="mt-4 max-w-md">
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400">Datum a čas</span>
                <input
                  type="datetime-local"
                  value={isoToDatetimeLocalValue(form.measuredAt)}
                  onChange={(e) => setNum("measuredAt", datetimeLocalValueToIso(e.target.value))}
                  className={formInputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Váha a chytrá váha</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Opsat z váhy nebo z fotky obrazovky. Stejná pole jako u Baseline — čárka i tečka.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DecimalField label="Váha (kg)" value={form.weightKg} onChange={(n) => setNum("weightKg", n)} blankZero={false} />
            </div>
            {computedBmi != null && (
              <p className="mt-2 text-xs text-zinc-500">
                BMI (váha + výška z Baseline): <span className="font-medium text-zinc-300">{computedBmi}</span>
                {form.scaleBmi > 0 && (
                  <>
                    {" "}
                    · BMI z váhy: <span className="font-medium text-zinc-300">{form.scaleBmi}</span>
                  </>
                )}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DecimalField label="BMI (z váhy)" value={form.scaleBmi} onChange={(n) => setNum("scaleBmi", n)} />
              <DecimalField label="Tělesný tuk (%)" value={form.scaleBodyFatPct} onChange={(n) => setNum("scaleBodyFatPct", n)} />
              <DecimalField label="Svalová hmota (kg)" value={form.scaleMuscleMassKg} onChange={(n) => setNum("scaleMuscleMassKg", n)} />
              <DecimalField label="Tělesná voda (%)" value={form.scaleBodyWaterPct} onChange={(n) => setNum("scaleBodyWaterPct", n)} />
              <DecimalField label="Libová hmota (kg)" value={form.scaleLeanMassKg} onChange={(n) => setNum("scaleLeanMassKg", n)} />
              <DecimalField label="Kostní hmota (kg)" value={form.scaleBoneMassKg} onChange={(n) => setNum("scaleBoneMassKg", n)} />
              <DecimalField label="Bílkoviny (%)" value={form.scaleProteinPct} onChange={(n) => setNum("scaleProteinPct", n)} />
              <NumField label="Viscerální tuk" value={form.scaleVisceralFat} onChange={(n) => setNum("scaleVisceralFat", n)} step="1" />
              <NumField label="BMR (kcal/den)" value={form.scaleBmrKcal} onChange={(n) => setNum("scaleBmrKcal", n)} step="1" />
              <NumField label="Metabolický věk" value={form.scaleMetabolicAge} onChange={(n) => setNum("scaleMetabolicAge", n)} step="1" />
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Obvody těla (cm)</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DecimalField label="Krk" value={form.neckCm} onChange={(n) => setNum("neckCm", n)} />
              <DecimalField label="Hrudník klid" value={form.chestRelaxedCm} onChange={(n) => setNum("chestRelaxedCm", n)} />
              <DecimalField label="Hrudník napnutý" value={form.chestFlexedCm} onChange={(n) => setNum("chestFlexedCm", n)} />
              <DecimalField label="Paže klid" value={form.armRelaxedCm} onChange={(n) => setNum("armRelaxedCm", n)} />
              <DecimalField label="Paže napnutá" value={form.armFlexedCm} onChange={(n) => setNum("armFlexedCm", n)} />
              <DecimalField label="Pas" value={form.waistCm} onChange={(n) => setNum("waistCm", n)} />
              <DecimalField label="Boky" value={form.hipsCm} onChange={(n) => setNum("hipsCm", n)} />
              <DecimalField label="Stehno" value={form.thighCm} onChange={(n) => setNum("thighCm", n)} />
              <DecimalField label="Lýtko" value={form.calfCm} onChange={(n) => setNum("calfCm", n)} />
            </div>
            <label className="mt-4 grid gap-1 text-sm">
              <span className="text-zinc-400">Poznámka k měření</span>
              <textarea
                value={form.notes}
                onChange={(e) => setNum("notes", e.target.value)}
                rows={2}
                placeholder="Např. ráno nalačno, po tréninku…"
                className={formInputClass}
              />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <BaselineSilhouette data={silhouetteData} />
        </aside>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-ew-blue px-4 py-2 text-sm font-medium text-white hover:bg-ew-blue-dark"
        >
          Uložit měření
        </button>
        {saved && <span className="text-sm text-emerald-400">Uloženo, otevírám přehled…</span>}
      </div>
    </form>
  );
}
