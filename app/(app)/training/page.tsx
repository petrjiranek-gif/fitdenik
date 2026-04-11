import { ModulePage, TrainingLog } from "@/components/fitdenik/ui";

export default function TrainingPage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Trénink" description="Tréninkový deník pro CrossFit, bodybuilding i vytrvalostní sporty." />
      <TrainingLog />
    </div>
  );
}
