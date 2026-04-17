import { ModulePage } from "@/components/fitdenik/ui";
import { StudyNotesHub } from "@/components/fitdenik/study-notes-hub";

export default function StudyPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Studium DBA"
        description="Prostředí pro studijní dokumenty a poznámky po blocích. Nahraj podklady, přidej kontext a měj vše na jednom místě."
        showCharts={false}
        showFilters={false}
        showTable={false}
        showDrilldown={false}
      />
      <StudyNotesHub />
    </div>
  );
}

