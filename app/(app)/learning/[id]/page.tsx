import { LearningPriorityPreview } from "@/components/fitdenik/source-learning";

export default function LearningDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Technika cviku</h2>
        <p className="mt-1 text-zinc-400">
          Instrukce, chyby, škálování — níže rychlé odkazy na stejné kurátorované zdroje jako na přehledu výuky.
        </p>
      </div>
      <LearningPriorityPreview />
    </div>
  );
}
