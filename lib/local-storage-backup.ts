/** Všechny klíče FitDeniku v localStorage začínají `fitdenik` (včetně živého tréninku). */
const KEY_PREFIX = "fitdenik";

export type FitdenikLocalBackup = {
  version: 1;
  exportedAt: string;
  entries: Record<string, string>;
};

export function collectFitdenikLocalStorage(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const entries: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    entries[key] = window.localStorage.getItem(key) ?? "";
  }
  return entries;
}

export function downloadFitdenikBackup(): void {
  const payload: FitdenikLocalBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: collectFitdenikLocalStorage(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fitdenik-zaloha-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function applyFitdenikBackup(json: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") return { ok: false, error: "Jen v prohlížeči." };
  if (!json || typeof json !== "object") return { ok: false, error: "Neplatný soubor." };
  const rec = json as Record<string, unknown>;
  let entries: Record<string, string> | null = null;
  if (rec.version === 1 && rec.entries && typeof rec.entries === "object" && rec.entries !== null) {
    entries = rec.entries as Record<string, string>;
  } else if (typeof rec.entries === "undefined" && !rec.version) {
    const flat = json as Record<string, unknown>;
    const maybe: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) {
      if (k.startsWith(KEY_PREFIX) && typeof v === "string") maybe[k] = v;
    }
    if (Object.keys(maybe).length > 0) entries = maybe;
  }
  if (!entries || Object.keys(entries).length === 0) {
    return { ok: false, error: "V souboru nejsou data FitDeniku." };
  }
  for (const [k, v] of Object.entries(entries)) {
    if (!k.startsWith(KEY_PREFIX)) continue;
    window.localStorage.setItem(k, v);
  }
  return { ok: true };
}
