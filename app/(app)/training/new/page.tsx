import { ModulePage, TrainingSessionCreateForm } from "@/components/fitdenik/ui";

export default function TrainingNewPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Nový trénink"
        description="Zápis délky, sportu, kalorií a poznámky. Kompletní přehled a úpravy najdeš na stránce Trénink."
      />
      <TrainingSessionCreateForm />
    </div>
  );
}
