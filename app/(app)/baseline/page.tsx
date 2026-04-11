import { BaselineForm, ModulePage } from "@/components/fitdenik/ui";

export default function BaselinePage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Baseline" description="Výchozí profil a hodnoty pro dlouhodobé porovnání." showCharts={false} />
      <BaselineForm />
    </div>
  );
}
