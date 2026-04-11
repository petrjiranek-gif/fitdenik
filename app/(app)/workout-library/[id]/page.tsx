import { ModulePage, SourceBadge } from "@/components/fitdenik/ui";

export default function WorkoutLibraryDetailPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">Detail workoutu</h2>
        <SourceBadge source="wodwell" />
      </div>
      <ModulePage title="Karen" description="Struktura workoutu, score typ, vybavení a doporučená videa." />
    </div>
  );
}
