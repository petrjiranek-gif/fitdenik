"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Safari / iOS často špatně vykreslí dlouhý seznam v nativním &lt;select&gt;.
 * Tlačítko + scrollovatelný panel je spolehlivější.
 */
export function BodybuildingExerciseCombobox({
  id,
  labelId,
  muscleGroup,
  value,
  onChange,
  options,
}: {
  id: string;
  labelId: string;
  muscleGroup: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const disabled = !muscleGroup.trim();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [muscleGroup]);

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className="flex w-full min-h-[42px] items-center justify-between gap-2 rounded-lg border border-ew-border bg-ew-bg px-3 py-2 text-left text-base text-zinc-100 sm:text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="min-w-0 flex-1 truncate">{value || "— zvol cvik —"}</span>
        <span className="shrink-0 text-ew-muted" aria-hidden>
          ▾
        </span>
      </button>
      {open && !disabled && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-[80] mt-1 max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-ew-border bg-[#111827] py-1 shadow-xl"
        >
          {options.map((ex, idx) => (
            <li key={`${idx}-${ex}`} role="presentation" className="border-b border-ew-border/40 last:border-0">
              <button
                type="button"
                role="option"
                aria-selected={value === ex}
                className="w-full px-3 py-2.5 text-left text-sm leading-snug text-zinc-100 hover:bg-ew-bg active:bg-ew-bg"
                onClick={() => {
                  onChange(ex);
                  setOpen(false);
                }}
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !disabled && options.length === 0 && (
        <div className="absolute left-0 right-0 z-[80] mt-1 rounded-lg border border-amber-500/40 bg-ew-panel px-3 py-2 text-xs text-amber-100">
          Žádné cviky pro zvolenou partii — zkus znovu zvolit sval.
        </div>
      )}
    </div>
  );
}
