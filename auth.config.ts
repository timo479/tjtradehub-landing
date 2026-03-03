import type { NextAuthConfig } from "next-auth";

// Edge-compatible config (no Node.js-only modules like bcryptjs or supabase-js)
export const authConfig: NextAuthConfig = {
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
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.trialEndsAt = token.trialEndsAt as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
        session.user.currentPeriodEnd = token.currentPeriodEnd as string | null;
      }
      return session;
    },
  },
  providers: [], // filled in auth.ts
};
