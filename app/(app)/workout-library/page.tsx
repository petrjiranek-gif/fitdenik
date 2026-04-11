import { ModulePage, SourceFilterTabs } from "@/components/fitdenik/ui";

export default function WorkoutLibraryPage() {
  return (
    <div className="space-y-4">
      <SourceFilterTabs />
      <ModulePage title="Knihovna workoutů" description="Workout šablony s filtrováním podle sportu, obtížnosti, vybavení a zdroje." />
    </div>
  );
}
