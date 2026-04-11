"use client";

import { useMemo, useState } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { BaselineInput } from "@/lib/repositories/contracts";
import { BaselineSilhouette } from "@/components/fitdenik/baseline-silhouette";
import { bmiFromHeightWeight, DecimalField, formInputClass, NumField } from "@/components/fitdenik/form-fields";

export function BaselineForm() {
  const repositories = useMemo(() => getRepositories(), []);
  const initial = useMemo(
    () => repositories.baseline.get() ?? repositories.baseline.getDefaults(),
    [repositories],
  );
  const [form, setForm] = useState<BaselineInput>(initial);
  const [saved, setSaved] = useState(false);

  const computedBmi = bmiFromHeightWeight(form.baselineWeightKg, form.heightCm);

  const setNum = (key: keyof BaselineInput, n: number) => {
    setForm((prev) => ({ ...prev, [key]: n }));
  };

  const setText = (key: keyof BaselineInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    repositories.baseline.save(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">
              Výchozí bod — váha a chytrá váha
            </h3>
            <p className="mt-2 text-xs text-zinc-500">
              Hlavní referenční váha je výchozí váha (kg). Údaje jako z displeje váhy — typicky{" "}
              <strong className="font-medium text-zinc-400">jedna desetinná číslice</strong>. Desetinná{" "}
              <strong className="font-medium text-zinc-400">čárka i tečka</strong> se berou (např. 128,9 nebo 128.9).
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DecimalField
                label="Výchozí váha (kg)"
                value={form.baselineWeightKg}
                onChange={(n) => setNum("baselineWeightKg", n)}
                blankZero={false}
              />
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400">Datum měření (váha)</span>
                <input
                  type="date"
                  value={form.scaleMeasuredAt}
                  onChange={(e) => setText("scaleMeasuredAt", e.target.value)}
                  className={formInputClass}
                />
              </label>
            </div>
            {computedBmi != null && (
              <p className="mt-2 text-xs text-zinc-500">
                BMI z výšky a váhy: <span className="font-medium text-zinc-300">{computedBmi}</span>
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
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Osobní údaje</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumField label="Věk" value={form.age} onChange={(n) => setNum("age", n)} step="1" blankZero={false} />
              <DecimalField label="Výška (cm)" value={form.heightCm} onChange={(n) => setNum("heightCm", n)} blankZero={false} />
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Obvody těla (cm)</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Zapiš stejným postupem při každém měření — hodnoty se zobrazí u siluety vpravo.
            </p>
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
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Cíle</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DecimalField label="Cílová váha (kg)" value={form.targetWeightKg} onChange={(n) => setNum("targetWeightKg", n)} />
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400">Cílové datum (volitelné)</span>
                <input
                  type="date"
                  value={form.targetDate ?? ""}
                  onChange={(e) => setText("targetDate", e.target.value)}
                  className={formInputClass}
                />
              </label>
            </div>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Cíle a poznámky (text)</span>
              <textarea
                value={form.goalsText}
                onChange={(e) => setText("goalsText", e.target.value)}
                rows={2}
                placeholder="Např. udržet sílu, zlepšit spánek…"
                className={formInputClass}
              />
            </label>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Další</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <DecimalField label="Odhad tuku (%), ručně" value={form.estimatedBodyFatPct} onChange={(n) => setNum("estimatedBodyFatPct", n)} />
              <NumField label="Klidový tep" value={form.restingHeartRate} onChange={(n) => setNum("restingHeartRate", n)} step="1" />
            </div>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Úroveň aktivity</span>
              <input
                value={form.activityLevel}
                onChange={(e) => setText("activityLevel", e.target.value)}
                className={formInputClass}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Omezení</span>
              <textarea
                value={form.limitations}
                onChange={(e) => setText("limitations", e.target.value)}
                rows={2}
                className={formInputClass}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Poznámky</span>
              <textarea value={form.notes} onChange={(e) => setText("notes", e.target.value)} rows={2} className={formInputClass} />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <BaselineSilhouette data={form} />
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-ew-blue px-4 py-2 text-sm font-medium text-white hover:bg-ew-blue-dark"
        >
          Uložit baseline
        </button>
        {saved && <span className="text-sm text-emerald-400">Uloženo.</span>}
      </div>
    </form>
  );
}
