import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import { canAccessDashboard } from "@/lib/trial";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  const isProtected =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/billing");

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect to billing if trial expired and no active subscription
  if (nextUrl.pathname.startsWith("/dashboard") && isLoggedIn && session?.user) {
    const user = session.user;
    const canAccess = canAccessDashboard({
      trial_ends_at: user.trialEndsAt ?? "",
      subscription_status: user.subscriptionStatus ?? "trialing",
      current_period_end: user.currentPeriodEnd ?? null,
    });

    if (!canAccess) {
      return NextResponse.redirect(new URL("/billing", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/billing/:path*", "/login", "/register"],
};
