"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const hideQuickActions = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-10 border-b border-ew-border bg-ew-panel/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">FitDenik MVP</h1>
        {!hideQuickActions && (
          <div className="flex gap-2">
            <Link
              href="/training/new"
              className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
            >
              Nový trénink
            </Link>
            <Link
              href="/imports"
              className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:border-ew-blue-light"
            >
              Import screenshotu
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
