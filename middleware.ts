import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Kanonická doména = NEXT_PUBLIC_APP_URL (např. https://fitdenik.ewattup.com).
 * Výchozí alias fitdenik.vercel.app přesměrujeme tam, aby localStorage i odkazy
 * byly jednotné. Preview deploymenty (fitdenik-xxx.vercel.app) se nemění.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  /** Jednorázový export localStorage ze staré domény (jinak redirect nepustí JS na .vercel.app). */
  if (request.nextUrl.searchParams.get("fitdenikStayOnHost") === "1") {
    return NextResponse.next();
  }

  const canonicalBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://fitdenik.ewattup.com";

  let canonicalHost: string;
  try {
    canonicalHost = new URL(canonicalBase).hostname;
  } catch {
    canonicalHost = "fitdenik.ewattup.com";
  }

  if (host === canonicalHost) {
    return NextResponse.next();
  }

  const vercelAlias =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_HOST || "fitdenik.vercel.app";

  if (host !== vercelAlias) {
    return NextResponse.next();
  }

  const target = new URL(request.url);
  target.hostname = canonicalHost;
  target.protocol = "https:";
  target.port = "";

  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
