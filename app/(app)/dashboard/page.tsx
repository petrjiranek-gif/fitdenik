import { DashboardOverviewCards } from "@/components/fitdenik/ui";
import { DashboardHero } from "@/components/fitdenik/dashboard-hero";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHero />
      <DashboardOverviewCards />
    </div>
  );
}
