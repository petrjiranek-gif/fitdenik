"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getRepositories } from "@/lib/repositories/provider";
import type { BaselineInput } from "@/lib/repositories/contracts";

export function BaselineForm() {
  const router = useRouter();
  const repositories = useMemo(() => getRepositories(), []);
  const initial = useMemo(
    () => repositories.baseline.get() ?? repositories.baseline.getDefaults(),
    [repositories],
  );
  const [form, setForm] = useState<BaselineInput>(initial);
  const [saved, setSaved] = useState(false);

  const onNumberChange = (key: keyof BaselineInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const onTextChange = (key: keyof BaselineInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    repositories.baseline.save(form);
    setSaved(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Baseline vstup</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Věk" type="number" value={form.age} onChange={(v) => onNumberChange("age", v)} />
        <Input label="Výška (cm)" type="number" value={form.heightCm} onChange={(v) => onNumberChange("heightCm", v)} />
        <Input label="Výchozí váha (kg)" type="number" value={form.baselineWeightKg} onChange={(v) => onNumberChange("baselineWeightKg", v)} />
        <Input label="Pas (cm)" type="number" value={form.waistCm} onChange={(v) => onNumberChange("waistCm", v)} />
        <Input label="Tuk (%)" type="number" value={form.estimatedBodyFatPct} onChange={(v) => onNumberChange("estimatedBodyFatPct", v)} />
        <Input label="Klidový tep" type="number" value={form.restingHeartRate} onChange={(v) => onNumberChange("restingHeartRate", v)} />
      </div>
      <Input label="Aktivita" value={form.activityLevel} onChange={(v) => onTextChange("activityLevel", v)} />
      <Input label="Cíle (oddělené čárkou)" value={form.goalsText} onChange={(v) => onTextChange("goalsText", v)} />
      <TextArea label="Omezení" value={form.limitations} onChange={(v) => onTextChange("limitations", v)} />
      <TextArea label="Poznámky" value={form.notes} onChange={(v) => onTextChange("notes", v)} />
      <div className="flex items-center gap-3">
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">Uložit baseline</button>
        {saved && <span className="text-sm text-emerald-700">Uloženo, přesměrovávám na přehled...</span>}
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-600">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-md border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
