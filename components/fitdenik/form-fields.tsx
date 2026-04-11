"use client";

import { useEffect, useState, type ComponentProps } from "react";

export const formInputClass =
  "w-full rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-ew-blue";

const PARTIAL_DECIMAL = /^-?\d*([.,]\d*)?$/;

function displayDecimalFromValue(v: number, blankZero: boolean): string {
  if (blankZero && v === 0) return "";
  if (v == null || Number.isNaN(v)) return "";
  return String(v);
}

function normalizeDecimalInput(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(",", ".");
}

function parseDecimalToNumber(normalized: string): number | null {
  if (normalized === "") return null;
  if (normalized === "." || normalized === ",") return null;
  const n = parseFloat(normalized.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function bmiFromHeightWeight(weightKg: number, heightCm: number): number | null {
  if (weightKg <= 0 || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function DecimalField({
  label,
  value,
  onChange,
  blankZero = true,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  blankZero?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(() => displayDecimalFromValue(value, blankZero));

  useEffect(() => {
    if (!editing) {
      setText(displayDecimalFromValue(value, blankZero));
    }
  }, [value, blankZero, editing]);

  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onFocus={() => setEditing(true)}
        onBlur={() => {
          setEditing(false);
          const normalized = normalizeDecimalInput(text);
          if (normalized === "") {
            onChange(0);
            setText(displayDecimalFromValue(0, blankZero));
            return;
          }
          const parsed = parseDecimalToNumber(normalized);
          if (parsed === null) {
            setText(displayDecimalFromValue(value, blankZero));
            return;
          }
          const rounded = Math.round(parsed * 10) / 10;
          onChange(rounded);
          setText(displayDecimalFromValue(rounded, blankZero));
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw !== "" && !PARTIAL_DECIMAL.test(raw)) return;
          setText(raw);
          if (raw === "") {
            onChange(0);
            return;
          }
          const normalized = normalizeDecimalInput(raw);
          const parsed = parseDecimalToNumber(normalized);
          if (parsed === null) return;
          onChange(parsed);
        }}
        className={formInputClass}
      />
    </label>
  );
}

export function NumField({
  label,
  value,
  onChange,
  step = "any",
  blankZero = true,
  inputMode,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
  blankZero?: boolean;
  inputMode?: ComponentProps<"input">["inputMode"];
}) {
  const display = blankZero && value === 0 ? "" : String(value);
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-400">{label}</span>
      <input
        type="number"
        step={step}
        inputMode={inputMode}
        value={display}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? 0 : Number(v));
        }}
        className={formInputClass}
      />
    </label>
  );
}
