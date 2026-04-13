"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside className="w-full border-b border-ew-border bg-ew-panel md:w-64 md:border-b-0 md:border-r md:border-ew-border">
      <div className="flex items-center justify-between px-4 py-4 md:block">
        <div className="text-xl font-semibold text-white">FitDenik</div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md border border-ew-border px-3 py-1.5 text-xs text-zinc-200 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-nav"
        >
          {mobileOpen ? "Zavřít menu" : "Menu"}
        </button>
      </div>

      <nav id="mobile-main-nav" className={`${mobileOpen ? "grid" : "hidden"} gap-1 p-2 md:hidden`} aria-label="Hlavní navigace">
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
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ? "bg-ew-blue/20 text-white" : "text-zinc-300 hover:bg-ew-border hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>

      <nav className="hidden gap-1 p-2 md:grid" aria-label="Hlavní navigace">
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
              className={`rounded-lg px-3 py-2 text-sm ${
                pathname === item.href ? "bg-ew-blue/20 text-white" : "text-zinc-300 hover:bg-ew-border hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </aside>
  );
}
