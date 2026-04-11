"use client";

import type { BodyMeasurementEntry } from "@/lib/types";

/** Jednoduchý průběh váhy z posledních měření (SVG). */
export function WeightSparkline({ entries }: { entries: BodyMeasurementEntry[] }) {
  const sorted = [...entries]
    .filter((e) => e.weightKg > 0)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
  const slice = sorted.slice(-16);
  if (slice.length < 2) {
    return (
      <p className="text-sm text-ew-muted">
        Po druhém uloženém měření se zobrazí čára vývoje váhy.
      </p>
    );
  }

  const weights = slice.map((e) => e.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = max === min ? 0.5 : (max - min) * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;
  const w = 100;
  const h = 40;
  const n = weights.length;
  const points = weights.map((kg, i) => {
    const x = (i / (n - 1)) * w;
    const t = (kg - yMin) / (yMax - yMin || 1);
    const y = h - t * h;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-16 w-full text-ew-blue-light"
        preserveAspectRatio="none"
        aria-hidden
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          points={points.join(" ")}
        />
      </svg>
      <div className="flex justify-between text-[10px] text-ew-muted">
        <span>
          {new Date(slice[0].measuredAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}
        </span>
        <span>
          {new Date(slice[slice.length - 1].measuredAt).toLocaleDateString("cs-CZ", {
            day: "numeric",
            month: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
