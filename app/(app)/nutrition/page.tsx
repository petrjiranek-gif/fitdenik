import { ModulePage, NutritionLog } from "@/components/fitdenik/ui";

export default function NutritionPage() {
  return (
    <div className="space-y-4">
      <ModulePage title="Výživa" description="Denní log jídla, makra, voda a adherence vůči cíli." />
      <NutritionLog />
    </div>
  );
}
