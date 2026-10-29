import { LiveTrainingFlow } from "@/components/fitdenik/live-training-flow";

export default function TrainingLivePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Živý trénink</h2>
        <p className="text-zinc-400">
          Pomůcka pro průběh tréninku: CrossFit, HYROX, bodybuilding, bodyweight a domácí příprava (vlastní
          benchmarky k Ironmanu). Částečný výsledek se neukládá jako dokončený trénink.
        </p>
      </div>
      <LiveTrainingFlow />
    </div>
  );
}
