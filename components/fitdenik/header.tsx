"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const hideQuickActions =
    pathname === "/dashboard" ||
    pathname === "/progress" ||
    pathname?.startsWith("/training");
  const hideImportLink = pathname === "/baseline";
  const hideNewMeasurementLink = pathname === "/imports" || pathname === "/nutrition";

  return (
    <header className="sticky top-0 z-10 border-b border-ew-border bg-ew-panel/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-base font-semibold text-white sm:text-lg">FitDenik MVP</h1>
        {!hideQuickActions && (
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {!hideNewMeasurementLink && (
              <Link
                href="/measurements/new"
                className="rounded-md bg-ew-blue px-3 py-2 text-sm text-white hover:bg-ew-blue-dark"
              >
                Nové měření
              </Link>
            )}
            {!hideImportLink && (
              <Link
                href="/imports"
                className="rounded-md border border-ew-border bg-ew-bg px-3 py-2 text-sm text-zinc-200 hover:border-ew-blue-light"
              >
                Import screenshotu
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
