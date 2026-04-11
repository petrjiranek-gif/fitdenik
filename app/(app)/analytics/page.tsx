import { ComparisonChart, ModulePage } from "@/components/fitdenik/ui";

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Analytika"
        description="Interaktivní grafy a drilldown pro trénink, výživu, tělesná data a korelace."
      />
      <ComparisonChart />
    </div>
  );
}
