import { NextRequest, NextResponse } from "next/server";
import { findActiveAffiliateByCode, normalizeCode } from "@/lib/affiliates";

// Partner-Link: tjtradehub.com/r/SARAH20
//
// Warum ein eigener Endpunkt statt `?via=` in der Middleware: der Matcher in
// proxy.ts deckt nur /dashboard, /billing, /admin, /login und /register ab. Ein
// `?via=` auf der Homepage käme dort nie an, und den Matcher auf ALLE Routen
// aufzuziehen würde jede Seitenanfrage durch die Auth-Middleware schicken.
//
// Der Cookie ist der Attributions-Anker für Leute, die sich erst gratis (Basic)
// anmelden und Monate später upgraden — die wären über den Stripe-Promo-Code
// allein nicht mehr zuzuordnen.
export const dynamic = "force-dynamic";

const COOKIE_NAME = "tj_via";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 Tage

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = normalizeCode(code ?? "");

  // Basis bewusst aus NEXT_PUBLIC_APP_URL statt aus request.url: hinter dem
  // Vercel-Proxy trägt request.url nicht zuverlässig den öffentlichen Host —
  // im Dev-Server landet man damit z.B. auf localhost. Ein Partner-Link, der auf
  // localhost zeigt, wäre für jeden Besucher tot.
  const target = new URL("/", process.env.NEXT_PUBLIC_APP_URL || request.url);
  // Nur zur Sichtbarkeit auf der Landingpage (z.B. "20% off applied") — die
  // Attribution selbst hängt am httpOnly-Cookie, nicht an diesem Parameter.
  if (normalized) target.searchParams.set("via", normalized);

  const response = NextResponse.redirect(target);

  // Unbekannter oder pausierter Code → einfach ohne Cookie auf die Homepage.
  // Kein 404: der Besucher kann nichts dafür, wenn der Partner beendet wurde.
  const affiliate = await findActiveAffiliateByCode(normalized);
  if (!affiliate) return response;

  response.cookies.set(COOKIE_NAME, affiliate.promo_code, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true, // wird nur serverseitig beim Register gelesen
    sameSite: "lax", // muss den Redirect von Instagram überleben
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
