import Link from "next/link";

export { Header } from "@/components/fitdenik/header";

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
