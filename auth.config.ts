import type { NextAuthConfig } from "next-auth";

// Edge-compatible config (no Node.js-only modules like bcryptjs or supabase-js)
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.trialEndsAt = (user as { trialEndsAt: string }).trialEndsAt;
        token.subscriptionStatus = (
          user as { subscriptionStatus: string }
        ).subscriptionStatus;
        token.currentPeriodEnd = (
          user as { currentPeriodEnd: string | null }
        ).currentPeriodEnd;
        token.role = (user as { role: string }).role ?? "user";
        token.isImpersonating = (user as { isImpersonating?: boolean }).isImpersonating ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.trialEndsAt = token.trialEndsAt as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.currentPeriodEnd = token.currentPeriodEnd as string | null;
        session.user.role = (token.role as string) ?? "user";
        session.user.isImpersonating = (token.isImpersonating as boolean) ?? false;
      }
      return session;
    },
  },
  providers: [], // filled in auth.ts
};
