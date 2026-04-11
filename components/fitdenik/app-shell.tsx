import Link from "next/link";

export { Header } from "@/components/fitdenik/header";

type NavItem = { label: string; href: string; disabled?: boolean };

const SIDEBAR_LINKS: NavItem[] = [
  { label: "Přehled", href: "/dashboard" },
  { label: "Baseline", href: "/baseline" },
  { label: "Pokrok", href: "/progress" },
  { label: "Tělesná data", href: "/body-metrics" },
  { label: "Trénink", href: "/training" },
  { label: "Živý trénink", href: "/training/live" },
  { label: "Benchmarky", href: "/benchmarks" },
  { label: "Knihovna workoutů", href: "/workout-library", disabled: true },
  { label: "Výuková videa", href: "/learning" },
  { label: "Výživa", href: "/nutrition" },
  { label: "Konzultace", href: "/consultations", disabled: true },
  { label: "Importy", href: "/imports" },
  { label: "Analytika", href: "/analytics", disabled: true },
];

export function Sidebar() {
  const links = SIDEBAR_LINKS;

  return (
    <aside className="w-full border-b border-ew-border bg-ew-panel md:w-64 md:border-b-0 md:border-r md:border-ew-border">
      <div className="px-4 py-4 text-xl font-semibold text-white">FitDenik</div>
      <nav className="grid gap-1 p-2" aria-label="Hlavní navigace">
        {links.map((item) =>
          item.disabled ? (
            <span
              key={item.href}
              className="cursor-not-allowed rounded-lg px-3 py-2 text-sm text-zinc-600"
              aria-disabled="true"
              title="Dočasně nedostupné"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-ew-border hover:text-white"
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}
