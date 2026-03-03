import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { authConfig } from "@/auth.config";

const JWT_REFRESH_INTERVAL = 5 * 60; // 5 Minuten in Sekunden

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Neuer Login: User-Daten ins Token schreiben
      if (user) {
        token.id = user.id;
        token.trialEndsAt = (user as { trialEndsAt: string }).trialEndsAt;
        token.subscriptionStatus = (user as { subscriptionStatus: string }).subscriptionStatus;
        token.currentPeriodEnd = (user as { currentPeriodEnd: string | null }).currentPeriodEnd;
        token.refreshedAt = Math.floor(Date.now() / 1000);
        return token;
      }

      // DB alle 5 Minuten abfragen um subscription_status aktuell zu halten
      const now = Math.floor(Date.now() / 1000);
      const lastRefresh = (token.refreshedAt as number) ?? 0;
      if (now - lastRefresh < JWT_REFRESH_INTERVAL) return token;

      const { data: freshUser } = await db
        .from("users")
        .select("subscription_status, current_period_end, trial_ends_at")
        .eq("id", token.id as string)
        .single();

      if (freshUser) {
        token.subscriptionStatus = freshUser.subscription_status;
        token.currentPeriodEnd = freshUser.current_period_end;
        token.trialEndsAt = freshUser.trial_ends_at;
        token.refreshedAt = now;
      }

      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: user } = await db
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          trialEndsAt: user.trial_ends_at,
          subscriptionStatus: user.subscription_status,
          currentPeriodEnd: user.current_period_end,
        };
      },
    }),
  ],
});
