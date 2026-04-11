import { ModulePage, TrainingLog } from "@/components/fitdenik/ui";

export default function TrainingNewPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Nový trénink"
        description="Ruční zápis tréninku, cviků, série, opakování a zátěže."
      />
      <TrainingLog />
    </div>
  );
}
