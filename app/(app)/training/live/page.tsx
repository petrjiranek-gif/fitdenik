import {
  ExerciseStepTracker,
  FinishWorkoutSummary,
  LiveCounterDemo,
  ModulePage,
  SetChecklist,
} from "@/components/fitdenik/ui";

export default function TrainingLivePage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Živý trénink"
        description="Interaktivní live tracking pro counter, set, rounds i interval mód."
        showCharts={false}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <LiveCounterDemo />
        <div className="space-y-4">
          <SetChecklist />
          <ExerciseStepTracker />
          <FinishWorkoutSummary />
        </div>
      </div>
    </div>
  );
}
