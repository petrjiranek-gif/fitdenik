import { DashboardOverviewCards, ModulePage } from "@/components/fitdenik/ui";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <DashboardOverviewCards />
      <ModulePage
        title="Přehled"
        description="Rychlý souhrn tréninku, výživy, benchmarků a tělesných dat."
      />
    </div>
  );
}
