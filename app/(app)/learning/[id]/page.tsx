import { LearningPriorityPreview, ModulePage } from "@/components/fitdenik/ui";

export default function LearningDetailPage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Technika cviku" description="Instrukce, chyby, škálování, související workouty a benchmarky." />
      <LearningPriorityPreview />
    </div>
  );
}
