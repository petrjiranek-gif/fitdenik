"use client";

import type { BaselineInput } from "@/lib/repositories/contracts";

function fmtCm(n: number) {
  if (n == null || Number.isNaN(n) || n <= 0) return "—";
  return `${n} cm`;
}

function fmtKg(n: number) {
  if (n == null || Number.isNaN(n) || n <= 0) return "—";
  return `${Number(n.toFixed(1))} kg`;
}

/** Jednoduchá přední silueta + popisky podle zadaných obvodů (baseline). */
export function BaselineSilhouette({
  data,
}: {
  data: Pick<
    BaselineInput,
    | "baselineWeightKg"
    | "neckCm"
    | "chestRelaxedCm"
    | "chestFlexedCm"
    | "armRelaxedCm"
    | "armFlexedCm"
    | "waistCm"
    | "hipsCm"
    | "thighCm"
    | "calfCm"
  >;
}) {
  const w = fmtKg(data.baselineWeightKg);

  return (
    <div className="rounded-xl border border-ew-border bg-ew-bg/80 p-4">
      <h4 className="mb-3 text-center text-sm font-semibold text-zinc-200">Přehled měření na postavě</h4>
      <p className="mb-4 text-center text-xs text-ew-muted">
        Hodnoty se berou z tabulky vlevo. Doplň obvody — u postavy se ihned zobrazí.
      </p>
      <div className="relative mx-auto aspect-[3/7] w-full max-w-[220px] text-ew-muted">
        <svg
          className="h-full w-full text-zinc-500"
          viewBox="0 0 100 220"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden
        >
          <ellipse cx="50" cy="18" rx="11" ry="13" />
          <line x1="50" y1="31" x2="50" y2="42" />
          <path d="M32 42 Q50 38 68 42 L65 88 Q50 92 35 88 Z" />
          <path d="M35 50 L22 72 L18 95" />
          <path d="M65 50 L78 72 L82 95" />
          <path d="M42 88 L40 135 L38 175 L36 205" />
          <path d="M58 88 L60 135 L62 175 L64 205" />
        </svg>

        <MeasurementPin className="left-0 top-[2%] -translate-x-1 text-right" label="Krku" value={fmtCm(data.neckCm)} />
        <MeasurementPin className="right-0 top-[14%] translate-x-1 text-left" label="Hrudník klid" value={fmtCm(data.chestRelaxedCm)} />
        <MeasurementPin className="left-0 top-[20%] -translate-x-1 text-right" label="Hrudník póza" value={fmtCm(data.chestFlexedCm)} />
        <MeasurementPin className="right-0 top-[26%] translate-x-1 text-left" label="Paže klid" value={fmtCm(data.armRelaxedCm)} />
        <MeasurementPin className="left-0 top-[30%] -translate-x-1 text-right" label="Paže póza" value={fmtCm(data.armFlexedCm)} />
        <MeasurementPin className="right-0 top-[38%] translate-x-1 text-left" label="Pas" value={fmtCm(data.waistCm)} />
        <MeasurementPin className="left-0 top-[48%] -translate-x-1 text-right" label="Boky" value={fmtCm(data.hipsCm)} />
        <MeasurementPin className="right-0 top-[58%] translate-x-1 text-left" label="Stehno" value={fmtCm(data.thighCm)} />
        <MeasurementPin className="left-0 top-[78%] -translate-x-1 text-right" label="Lýtko" value={fmtCm(data.calfCm)} />

        <div className="absolute bottom-0 left-1/2 w-max -translate-x-1/2 translate-y-1 rounded-md bg-ew-panel px-2 py-1 text-center text-[11px] text-zinc-300 ring-1 ring-ew-border">
          <span className="text-ew-muted">Váha (baseline)</span>
          <div className="font-semibold text-ew-blue-light">{w}</div>
        </div>
      </div>
    </div>
  );
}

function MeasurementPin({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`absolute max-w-[5.5rem] text-[10px] leading-tight md:max-w-[6rem] md:text-[11px] ${className}`}>
      <div className="text-ew-muted">{label}</div>
      <div className="font-medium text-zinc-200">{value}</div>
    </div>
  );
}
