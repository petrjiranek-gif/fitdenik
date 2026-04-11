"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { getRepositories } from "@/lib/repositories/provider";
import type { BaselineInput } from "@/lib/repositories/contracts";
import { BaselineSilhouette } from "@/components/fitdenik/baseline-silhouette";

const inputClass =
  "w-full rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-ew-blue";

function bmiFromHeightWeight(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

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
              Hlavní referenční váha je výchozí váha (kg). Údaje opsat jako z displeje váhy — typicky{" "}
              <strong className="font-medium text-zinc-400">jedna desetinná číslice</strong>. V prohlížeči zadej desetinnou{" "}
              <strong className="font-medium text-zinc-400">tečku</strong> (např. 128,9 kg → <code className="text-zinc-400">128.9</code>).
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumField
                label="Výchozí váha (kg)"
                value={form.baselineWeightKg}
                onChange={(n) => setNum("baselineWeightKg", n)}
                step="0.1"
                blankZero={false}
                inputMode="decimal"
              />
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400">Datum měření (váha)</span>
                <input
                  type="date"
                  value={form.scaleMeasuredAt}
                  onChange={(e) => setText("scaleMeasuredAt", e.target.value)}
                  className={inputClass}
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
              <NumField label="BMI (z váhy)" value={form.scaleBmi} onChange={(n) => setNum("scaleBmi", n)} step="0.1" inputMode="decimal" />
              <NumField label="Tělesný tuk (%)" value={form.scaleBodyFatPct} onChange={(n) => setNum("scaleBodyFatPct", n)} step="0.1" inputMode="decimal" />
              <NumField label="Svalová hmota (kg)" value={form.scaleMuscleMassKg} onChange={(n) => setNum("scaleMuscleMassKg", n)} step="0.1" inputMode="decimal" />
              <NumField label="Tělesná voda (%)" value={form.scaleBodyWaterPct} onChange={(n) => setNum("scaleBodyWaterPct", n)} step="0.1" inputMode="decimal" />
              <NumField label="Libová hmota (kg)" value={form.scaleLeanMassKg} onChange={(n) => setNum("scaleLeanMassKg", n)} step="0.1" inputMode="decimal" />
              <NumField label="Kostní hmota (kg)" value={form.scaleBoneMassKg} onChange={(n) => setNum("scaleBoneMassKg", n)} step="0.1" inputMode="decimal" />
              <NumField label="Bílkoviny (%)" value={form.scaleProteinPct} onChange={(n) => setNum("scaleProteinPct", n)} step="0.1" inputMode="decimal" />
              <NumField label="Viscerální tuk" value={form.scaleVisceralFat} onChange={(n) => setNum("scaleVisceralFat", n)} step="1" />
              <NumField label="BMR (kcal/den)" value={form.scaleBmrKcal} onChange={(n) => setNum("scaleBmrKcal", n)} step="1" />
              <NumField label="Metabolický věk" value={form.scaleMetabolicAge} onChange={(n) => setNum("scaleMetabolicAge", n)} step="1" />
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Osobní údaje</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumField label="Věk" value={form.age} onChange={(n) => setNum("age", n)} step="1" blankZero={false} />
              <NumField label="Výška (cm)" value={form.heightCm} onChange={(n) => setNum("heightCm", n)} step="0.1" blankZero={false} inputMode="decimal" />
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Obvody těla (cm)</h3>
            <p className="mt-2 text-xs text-zinc-500">
              Zapiš stejným postupem při každém měření — hodnoty se zobrazí u siluety vpravo.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <NumField label="Krk" value={form.neckCm} onChange={(n) => setNum("neckCm", n)} step="0.1" />
              <NumField label="Hrudník klid" value={form.chestRelaxedCm} onChange={(n) => setNum("chestRelaxedCm", n)} step="0.1" />
              <NumField label="Hrudník napnutý" value={form.chestFlexedCm} onChange={(n) => setNum("chestFlexedCm", n)} step="0.1" />
              <NumField label="Paže klid" value={form.armRelaxedCm} onChange={(n) => setNum("armRelaxedCm", n)} step="0.1" />
              <NumField label="Paže napnutá" value={form.armFlexedCm} onChange={(n) => setNum("armFlexedCm", n)} step="0.1" />
              <NumField label="Pas" value={form.waistCm} onChange={(n) => setNum("waistCm", n)} step="0.1" />
              <NumField label="Boky" value={form.hipsCm} onChange={(n) => setNum("hipsCm", n)} step="0.1" />
              <NumField label="Stehno" value={form.thighCm} onChange={(n) => setNum("thighCm", n)} step="0.1" />
              <NumField label="Lýtko" value={form.calfCm} onChange={(n) => setNum("calfCm", n)} step="0.1" />
            </div>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Cíle</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumField label="Cílová váha (kg)" value={form.targetWeightKg} onChange={(n) => setNum("targetWeightKg", n)} step="0.1" inputMode="decimal" />
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400">Cílové datum (volitelné)</span>
                <input
                  type="date"
                  value={form.targetDate ?? ""}
                  onChange={(e) => setText("targetDate", e.target.value)}
                  className={inputClass}
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
                className={inputClass}
              />
            </label>
          </section>

          <section className="rounded-xl border border-ew-border bg-ew-panel p-4">
            <h3 className="border-b border-ew-border pb-2 text-base font-semibold text-zinc-100">Další</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <NumField label="Odhad tuku (%), ručně" value={form.estimatedBodyFatPct} onChange={(n) => setNum("estimatedBodyFatPct", n)} step="0.1" inputMode="decimal" />
              <NumField label="Klidový tep" value={form.restingHeartRate} onChange={(n) => setNum("restingHeartRate", n)} step="1" />
            </div>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Úroveň aktivity</span>
              <input
                value={form.activityLevel}
                onChange={(e) => setText("activityLevel", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Omezení</span>
              <textarea
                value={form.limitations}
                onChange={(e) => setText("limitations", e.target.value)}
                rows={2}
                className={inputClass}
              />
            </label>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="text-zinc-400">Poznámky</span>
              <textarea value={form.notes} onChange={(e) => setText("notes", e.target.value)} rows={2} className={inputClass} />
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

function NumField({
  label,
  value,
  onChange,
  step = "any",
  blankZero = true,
  inputMode,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  blankZero?: boolean;
  inputMode?: ComponentProps<"input">["inputMode"];
}) {
  const display = blankZero && value === 0 ? "" : String(value);
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type="number"
        step={step}
        inputMode={inputMode}
        lang="en"
        value={display}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? 0 : Number(v));
        }}
        className={inputClass}
      />
    </label>
  );
}
