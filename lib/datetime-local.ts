/** Převod ISO řetězce na hodnotu pro `<input type="datetime-local">` (místní čas). */
export function isoToDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return isoToDatetimeLocalValue(new Date().toISOString());
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalValueToIso(localValue: string): string {
  const d = new Date(localValue);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
