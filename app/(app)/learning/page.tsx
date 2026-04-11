import { LearningYoutubeHub } from "@/components/fitdenik/source-learning";

export default function LearningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Výuková videa</h2>
        <p className="mt-1 text-zinc-400">
          Vybrané oficiální a doplňkové kanály na YouTube — technika, WOD a inspirace. Odkazy se otevřou na
          youtube.com.
        </p>
      </div>
      <LearningYoutubeHub />
    </div>
  );
}
