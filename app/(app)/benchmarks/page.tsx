import { BenchmarkLog, ModulePage } from "@/components/fitdenik/ui";

export default function BenchmarksPage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Benchmarky" description="Historie benchmarků, porovnání výsledků a trend výkonnosti." />
      <BenchmarkLog />
    </div>
  );
}
