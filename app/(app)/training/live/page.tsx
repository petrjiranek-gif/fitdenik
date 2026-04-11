import { LiveTrainingFlow } from "@/components/fitdenik/live-training-flow";

export default function TrainingLivePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Živý trénink</h2>
        <p className="text-zinc-400">
          Pomůcka pro průběh tréninku: typ sportu, u CrossFit výběr benchmarku (předpis jako na WodWell), časovač a počítadlo
          opakování. Výsledek se uloží lokálně a lze ho doplnit k hlavnímu záznamu v Trénink / Importy.
        </p>
      </div>
      <LiveTrainingFlow />
    </div>
  );
}
