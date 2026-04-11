import { LearningPriorityPreview, ModulePage, SourceBadge } from "@/components/fitdenik/ui";

export default function BenchmarkDetailPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Benchmark detail</h2>
        <SourceBadge source="wodwell" />
      </div>
      <ModulePage title="Karen" description="150 wall balls for time. Doporučené pacing tipy a videa." />
      <LearningPriorityPreview />
    </div>
  );
}
