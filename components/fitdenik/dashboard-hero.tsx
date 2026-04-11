/** Stylizovaná činka / značka — obecný motiv (ne oficiální logo CrossFit®). */
export function CrossFitInspiredMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="8" y="18" width="104" height="12" rx="3" fill="#18181b" />
      <rect x="4" y="14" width="10" height="20" rx="2" fill="#27272a" />
      <rect x="106" y="14" width="10" height="20" rx="2" fill="#27272a" />
      <rect x="52" y="10" width="16" height="28" rx="2" fill="#3f3f46" />
      <path d="M58 6v36" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function DashboardHero() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 px-4 py-5 shadow-sm md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="flex items-center gap-4">
        <CrossFitInspiredMark className="h-12 w-28 shrink-0 md:h-14 md:w-32" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Přehled</p>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 md:text-2xl">Fakta · data · čísla</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-600">
            Tréninky, výživa (Kalorické tabulky) a váha z jedné databáze. Jednoduché metriky, bez zbytečných kliků.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-zinc-500 md:justify-end">
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">Rolling 7 dní</span>
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">Baseline z profilu</span>
      </div>
    </div>
  );
}
