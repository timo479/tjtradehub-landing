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
    nextUrl.pathname.startsWith("/billing") ||
    nextUrl.pathname.startsWith("/admin");

  // Redirect logged-in users away from auth pages (only if they can access dashboard)
  if (isAuthPage && isLoggedIn && session?.user) {
    const user = session.user;
    const canAccess = canAccessDashboard({
      trial_ends_at: user.trialEndsAt ?? "",
      subscription_status: user.subscriptionStatus ?? "trialing",
      current_period_end: user.currentPeriodEnd ?? null,
    });
    if (canAccess) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Admin-only: redirect non-admins to /dashboard
  if (nextUrl.pathname.startsWith("/admin") && isLoggedIn) {
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
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
  matcher: ["/dashboard/:path*", "/billing/:path*", "/admin/:path*", "/login", "/register"],
};
