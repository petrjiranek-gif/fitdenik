import { ComparisonChart, ModulePage } from "@/components/fitdenik/ui";

export default function ComparePage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Porovnání období" description="Porovnej dva intervaly podle sportu, metrik a výkonu." />
      <ComparisonChart />
    </div>
  );
}
