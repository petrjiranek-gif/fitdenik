import { BenchmarksFlow } from "@/components/fitdenik/benchmarks-flow";

export default function BenchmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Benchmarky</h2>
        <p className="text-zinc-400">
          Vyber kategorii (Girl nebo ostatní WOD), otevři definici podle WodWell a zapiš svůj výsledek.
        </p>
      </div>
      <BenchmarksFlow />
    </div>
  );
}
