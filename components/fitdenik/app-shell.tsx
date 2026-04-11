import Link from "next/link";

export function Sidebar() {
  const links = [
    ["Přehled", "/dashboard"],
    ["Baseline", "/baseline"],
    ["Pokrok", "/progress"],
    ["Tělesná data", "/body-metrics"],
    ["Trénink", "/training"],
    ["Živý trénink", "/training/live"],
    ["Benchmarky", "/benchmarks"],
    ["Knihovna workoutů", "/workout-library"],
    ["Výuková videa", "/learning"],
    ["Výživa", "/nutrition"],
    ["Konzultace", "/consultations"],
    ["Importy", "/imports"],
    ["Analytika", "/analytics"],
  ] as const;

  return (
    <aside className="w-full border-b border-zinc-200 bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="px-4 py-4 text-xl font-semibold">FitDenik</div>
      <nav className="grid gap-1 p-2">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">FitDenik MVP</h1>
        <div className="flex gap-2">
          <Link href="/training/new" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
            Nový trénink
          </Link>
          <Link href="/imports" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
            Import screenshotu
          </Link>
        </div>
      </div>
    </header>
  );
}
