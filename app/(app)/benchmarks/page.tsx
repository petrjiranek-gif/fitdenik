import { BenchmarksFlow } from "@/components/fitdenik/benchmarks-flow";

export default function BenchmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Benchmarky</h2>
        <p className="text-zinc-400">
          Girl a ostatní WOD podle WodWell, plus vlastní domácí benchmarky (Karen Legs není oficiální Karen).
        </p>
      </div>
      <BenchmarksFlow />
    </div>
  );
}
