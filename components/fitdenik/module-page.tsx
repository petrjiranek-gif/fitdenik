"use client";

import { useState } from "react";
import { trainingSessions } from "@/lib/mock-data";

export function MetricCards() {
  const weeklyTraining = trainingSessions.length;
  const weeklyMinutes = trainingSessions.reduce((sum, t) => sum + t.durationMin, 0);
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Aktuální váha" value="85,7 kg" />
      <StatCard label="Tréninky tento týden" value={`${weeklyTraining}`} />
      <StatCard label="Aktivní čas" value={`${weeklyMinutes} min`} />
      <StatCard label="Týdenní kalorie" value="1792 kcal" />
      <StatCard label="Průměr bílkovin" value="179 g" />
      <StatCard label="Poslední benchmark" value="Karen 14:03" />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

const TIME_RANGES = ["Den", "Týden", "Měsíc", "Kvartál", "Rok", "Vlastní období"] as const;

export function TimeRangeTabs({
  selected,
  onChange,
}: {
  selected: (typeof TIME_RANGES)[number];
  onChange: (value: (typeof TIME_RANGES)[number]) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1">
      {TIME_RANGES.map((label) => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={`rounded-md px-3 py-1 text-sm ${
            selected === label ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function FilterPanel({
  sport,
  metric,
  onSportChange,
  onMetricChange,
}: {
  sport: string;
  metric: string;
  onSportChange: (value: string) => void;
  onMetricChange: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <select
          value={sport}
          onChange={(e) => onSportChange(e.target.value)}
          className="rounded-md border border-zinc-300 p-2 text-sm"
        >
          <option value="vše">Sport: vše</option>
          <option value="CrossFit">CrossFit</option>
          <option value="Bodybuilding">Bodybuilding</option>
          <option value="Cycling">Cycling</option>
          <option value="Walking">Walking</option>
        </select>
        <select
          value={metric}
          onChange={(e) => onMetricChange(e.target.value)}
          className="rounded-md border border-zinc-300 p-2 text-sm"
        >
          <option value="vše">Metrika: vše</option>
          <option value="Kalorie">Kalorie</option>
          <option value="Tempo">Tempo</option>
          <option value="Tep">Tep</option>
        </select>
        <button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
          Porovnat období
        </button>
        <button type="button" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          Použít filtry
        </button>
      </div>
    </div>
  );
}

export function InteractiveLineChart({ title, range }: { title: string; range: string }) {
  const pointsByRange: Record<string, number[]> = {
    Den: [20, 45, 35, 50, 40, 62, 58],
    Týden: [30, 52, 42, 64, 57, 70, 66],
    Měsíc: [35, 40, 48, 55, 63, 68, 72],
    Kvartál: [28, 36, 44, 50, 58, 62, 65],
    Rok: [22, 30, 39, 47, 55, 61, 67],
    "Vlastní období": [25, 33, 40, 48, 54, 60, 64],
  };
  const points = pointsByRange[range] ?? pointsByRange["Týden"];
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="flex h-32 items-end gap-2">
        {points.map((h) => (
          <button key={h} className="flex-1 rounded-t bg-blue-400/80 hover:bg-blue-500" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function BarTrendChart({ title, range }: { title: string; range: string }) {
  return <InteractiveLineChart title={title} range={range} />;
}
export function ComparisonChart() {
  return <InteractiveLineChart title="Porovnání období" range="Týden" />;
}

export function DataTable({
  title,
  sportFilter,
  rangeFilter,
}: {
  title: string;
  sportFilter: string;
  rangeFilter: (typeof TIME_RANGES)[number];
}) {
  const rows = trainingSessions.filter(
    (t) =>
      (sportFilter === "vše" || t.sportType === sportFilter) &&
      isDateInRange(t.date, rangeFilter),
  );
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-zinc-500">
          <tr>
            <th>Datum</th>
            <th>Název</th>
            <th>Sport</th>
            <th>Výsledek</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-100">
              <td>{row.date}</td>
              <td>{row.title}</td>
              <td>{row.sportType}</td>
              <td>{row.durationMin} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DrilldownDrawer() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
      Kliknutím na bod grafu otevřeš detail záznamu.
    </div>
  );
}

export function ModulePage({
  title,
  description,
  showCharts = true,
  showFilters = true,
  showTable = true,
  showDrilldown = true,
}: {
  title: string;
  description: string;
  showCharts?: boolean;
  showFilters?: boolean;
  showTable?: boolean;
  showDrilldown?: boolean;
}) {
  const [range, setRange] = useState<(typeof TIME_RANGES)[number]>("Týden");
  const [sportFilter, setSportFilter] = useState("vše");
  const [metricFilter, setMetricFilter] = useState("vše");
  const hasActiveFilters = range !== "Týden" || sportFilter !== "vše" || metricFilter !== "vše";

  const clearFilters = () => {
    setRange("Týden");
    setSportFilter("vše");
    setMetricFilter("vše");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-zinc-600">{description}</p>
      </div>
      {showFilters && (
        <>
          <TimeRangeTabs selected={range} onChange={setRange} />
          <FilterPanel
            sport={sportFilter}
            metric={metricFilter}
            onSportChange={setSportFilter}
            onMetricChange={setMetricFilter}
          />
          {hasActiveFilters ? (
            <div className="flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
              <div className="flex flex-wrap items-center gap-2">
                <span>Aktivní filtry:</span>
                {range !== "Týden" && <span className="rounded bg-white px-2 py-1">období: {range}</span>}
                {sportFilter !== "vše" && <span className="rounded bg-white px-2 py-1">sport: {sportFilter}</span>}
                {metricFilter !== "vše" && <span className="rounded bg-white px-2 py-1">metrika: {metricFilter}</span>}
              </div>
              <button onClick={clearFilters} className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs">
                Vyčistit filtry
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
              Zobrazen výchozí filtr: tento týden.
            </div>
          )}
        </>
      )}
      {showCharts && (
        <div className="grid gap-4 lg:grid-cols-2">
          <InteractiveLineChart title={`${title} - trend`} range={range} />
          <BarTrendChart title={`${title} - souhrn`} range={range} />
        </div>
      )}
      {showTable && <DataTable title={`${title} - tabulka`} sportFilter={sportFilter} rangeFilter={range} />}
      {showDrilldown && <DrilldownDrawer />}
    </div>
  );
}

function isDateInRange(dateString: string, range: (typeof TIME_RANGES)[number]): boolean {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (range === "Den") return diffDays === 0;
  if (range === "Týden") return diffDays >= 0 && diffDays <= 6;
  if (range === "Měsíc") return diffDays >= 0 && diffDays <= 30;
  if (range === "Kvartál") return diffDays >= 0 && diffDays <= 90;
  if (range === "Rok") return diffDays >= 0 && diffDays <= 365;
  return true;
}
