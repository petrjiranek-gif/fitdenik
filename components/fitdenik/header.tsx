"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const hideQuickActions = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">FitDenik MVP</h1>
        {!hideQuickActions && (
          <div className="flex gap-2">
            <Link href="/training/new" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
              Nový trénink
            </Link>
            <Link href="/imports" className="rounded-md border border-zinc-300 px-3 py-2 text-sm">
              Import screenshotu
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
