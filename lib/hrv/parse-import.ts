import type { HrvSource } from "@/lib/types";

export type ParsedHrvRow = {
  recordedAt: string;
  hrvMs: number;
  line: number;
};

export type HrvParseResult = {
  rows: ParsedHrvRow[];
  errors: { line: number; text: string; message: string }[];
};

function parseDateToken(token: string, fallbackIso: string): string | null {
  const t = token.trim();
  if (!t) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return `${t}T07:00:00.000Z`;
  }

  const cz = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (cz) {
    const [, d, m, y] = cz;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}T07:00:00.000Z`;
  }

  const czShort = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (czShort) {
    const [, d, m, yy] = czShort;
    const y = Number(yy) >= 70 ? `19${yy}` : `20${yy}`;
    return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}T07:00:00.000Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return t;

  return null;
}

function extractHrvMs(text: string): number | null {
  const msMatch = text.match(/(\d{1,3}(?:[.,]\d+)?)\s*ms/i);
  if (msMatch) {
    const n = Number(msMatch[1]!.replace(",", "."));
    return Number.isFinite(n) && n > 0 && n < 500 ? Math.round(n) : null;
  }
  const num = Number(text.replace(",", ".").trim());
  if (Number.isFinite(num) && num > 0 && num < 500) return Math.round(num);
  return null;
}

/**
 * Parsuje víceřádkový import z Apple Zdraví / jiných aplikací.
 * Podporované formáty na řádek:
 * - 2026-06-10 45
 * - 10.6.2026; 42 ms
 * - 45  (bez data → dnešní datum, posun o řádek zpět v čase u hromadného importu)
 */
export function parseHrvImportText(text: string, defaultDateIso?: string): HrvParseResult {
  const rows: ParsedHrvRow[] = [];
  const errors: HrvParseResult["errors"] = [];
  const today = defaultDateIso ?? new Date().toISOString();
  const lines = text.split(/\r?\n/);

  let undatedIndex = 0;

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const parts = line.split(/[;\t,|]/).map((p) => p.trim()).filter(Boolean);
    let recordedAt: string | null = null;
    let hrvMs: number | null = null;

    for (const part of parts) {
      const d = parseDateToken(part, today);
      if (d && !recordedAt) {
        recordedAt = d;
        continue;
      }
      const h = extractHrvMs(part);
      if (h != null && hrvMs == null) hrvMs = h;
    }

    if (hrvMs == null) {
      const tokens = line.split(/\s+/);
      for (const token of tokens) {
        const d = parseDateToken(token, today);
        if (d) recordedAt = d;
        const h = extractHrvMs(token);
        if (h != null) hrvMs = h;
      }
    }

    if (hrvMs == null) {
      errors.push({ line: lineNo, text: line, message: "Nepodařilo se najít HRV v ms (1–499)." });
      return;
    }

    if (!recordedAt) {
      const d = new Date(today);
      d.setDate(d.getDate() - undatedIndex);
      recordedAt = d.toISOString();
      undatedIndex += 1;
    }

    rows.push({ recordedAt, hrvMs, line: lineNo });
  });

  return { rows, errors };
}

export const HRV_SOURCE_OPTIONS: { value: HrvSource; label: string }[] = [
  { value: "apple_watch", label: "Apple Watch / Zdraví" },
  { value: "other_app", label: "Jiná aplikace (Garmin, Whoop…)" },
  { value: "manual", label: "Ruční zadání" },
];
