import { BaselineForm } from "@/components/fitdenik/ui";

export default function BaselinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Baseline</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Výchozí vstupní informace pro dlouhodobé porovnání: váha (a údaje z chytré váhy), obvody těla a cíle. Tato data slouží jako referenční bod pro další měření.
        </p>
      </div>
      <BaselineForm />
    </div>
  );
}
