import { ModulePage, TrainingOverview } from "@/components/fitdenik/ui";

export default function TrainingPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Trénink"
        description="Přehled záznamů, rozložení podle sportu a kalorie za minutu. Nový trénink přidáš v sekci níže nebo na stránce Nový trénink."
      />
      <TrainingOverview />
    </div>
  );
}
