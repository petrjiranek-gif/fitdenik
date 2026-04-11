/** Logo v `public/` — URL s mezerami. Pravý průhledný podklad jen u PNG/WebP (JPG průhled neumí). */
const EWATTUP_LOGO = `/eWattUp%20-%20transparent.jpg`;

export function DashboardHero() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 px-4 py-5 shadow-sm md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-[2.25rem] w-[5.5rem] shrink-0 items-center justify-center md:h-[2.5rem] md:w-[6.25rem]">
          <img
            src={EWATTUP_LOGO}
            alt="eWattUp"
            className="max-h-full max-w-full object-contain object-center"
          />
        </div>
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
