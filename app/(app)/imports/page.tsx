import { ImportsCenter, ModulePage } from "@/components/fitdenik/ui";

export default function ImportsPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Importy"
        description="Nahrání screenshotu, parser-ready struktura, ruční kontrola a převod na tréninkový záznam."
        showCharts={false}
        showFilters={false}
        showTable={false}
        showDrilldown={false}
      />
      <ImportsCenter />
    </div>
  );
}
