import { MeasurementForm } from "@/components/fitdenik/measurement-form";

export default function NewMeasurementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Nové měření</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Zapiš váhu a případně údaje z chytré váhy a obvody. Záznam se uloží s datem a časem a započítá se do přehledu a grafu váhy na dashboardu.
        </p>
      </div>
      <MeasurementForm />
    </div>
  );
}
