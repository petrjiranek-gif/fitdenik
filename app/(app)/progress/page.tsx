import { ModulePage } from "@/components/fitdenik/ui";

export default function ProgressPage() {
  return (
    <ModulePage
      title="Pokrok"
      description="Trendy tréninků a měření v čase — pouze grafy (bez tabulky a importů)."
      showFilterPanel={false}
      showTable={false}
      showDrilldown={false}
    />
  );
}
