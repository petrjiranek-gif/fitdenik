import { LearningPriorityPreview, ModulePage, SourceFilterTabs } from "@/components/fitdenik/ui";

export default function LearningPage() {
  return (
    <div className="space-y-4">
      <SourceFilterTabs />
      <ModulePage
        title="Výuková videa"
        description="Source-aware výuka: nejprve CrossFit official, pak WODwell reference, poté YouTube inspirace."
      />
      <LearningPriorityPreview />
    </div>
  );
}
