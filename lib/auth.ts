import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { authConfig } from "@/auth.config";
import { rateLimit } from "./rate-limit";

const JWT_REFRESH_INTERVAL = 5 * 60; // 5 Minuten in Sekunden

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        // Check if user exists
        const { data: existing } = await db
          .from("users")
          .select("*")
          .eq("email", user.email)
          .single();

        if (!existing) {
          // Create new user with 7-day trial
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + 7);
          const { data: newUser } = await db.from("users").insert({
            email: user.email,
            name: user.name ?? user.email.split("@")[0],
            password_hash: "",
            trial_ends_at: trialEnds.toISOString(),
            subscription_status: "trialing",
            email_verified: true,
          }).select().single();
          if (!newUser) return false;
          user.id = newUser.id;
          (user as Record<string, unknown>).trialEndsAt = newUser.trial_ends_at;
          (user as Record<string, unknown>).subscriptionStatus = newUser.subscription_status;
          (user as Record<string, unknown>).currentPeriodEnd = null;
          (user as Record<string, unknown>).role = newUser.role ?? "user";
        } else {
          if (existing.is_banned) return false;
          user.id = existing.id;
          user.name = existing.name || user.name || user.email?.split("@")[0];
          (user as Record<string, unknown>).trialEndsAt = existing.trial_ends_at;
          (user as Record<string, unknown>).subscriptionStatus = existing.subscription_status;
          (user as Record<string, unknown>).currentPeriodEnd = existing.current_period_end;
          (user as Record<string, unknown>).role = existing.role ?? "user";
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Neuer Login: User-Daten ins Token schreiben
      if (user) {
        token.id = user.id;
        token.trialEndsAt = (user as { trialEndsAt: string }).trialEndsAt;
        token.subscriptionStatus = (user as { subscriptionStatus: string }).subscriptionStatus;
        token.currentPeriodEnd = (user as { currentPeriodEnd: string | null }).currentPeriodEnd;
        token.role = (user as { role: string }).role ?? "user";
        token.refreshedAt = Math.floor(Date.now() / 1000);
        // Always use DB name (overrides Google name)
        const { data: dbUser } = await db.from("users").select("name").eq("id", user.id!).single();
        if (dbUser) token.name = dbUser.name;
        return token;
      }

      // DB alle 5 Minuten abfragen um subscription_status aktuell zu halten
      const now = Math.floor(Date.now() / 1000);
      const lastRefresh = (token.refreshedAt as number) ?? 0;
      if (now - lastRefresh < JWT_REFRESH_INTERVAL) return token;

      const { data: freshUser } = await db
        .from("users")
        .select("*")
        .eq("id", token.id as string)
        .single();

      if (freshUser) {
        if (freshUser.is_banned) return null;
        token.subscriptionStatus = freshUser.subscription_status;
        token.currentPeriodEnd = freshUser.current_period_end;
        token.trialEndsAt = freshUser.trial_ends_at;
        token.name = freshUser.name;
        token.role = freshUser.role ?? "user";
        token.refreshedAt = now;
      }

      return token;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        const ip =
          (request as Request | undefined)?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const rl = rateLimit(ip, "login", 5, 15 * 60 * 1000);
        if (!rl.allowed) {
          throw new Error(`Too many login attempts. Try again in ${rl.retryAfter} seconds.`);
        }

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

        if (!user.email_verified) {
          throw new Error("Please verify your email before signing in.");
        }

        if (user.is_banned) {
          throw new Error("Your account has been suspended.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          trialEndsAt: user.trial_ends_at,
          subscriptionStatus: user.subscription_status,
          currentPeriodEnd: user.current_period_end,
          role: user.role ?? "user",
        };
      },
    }),
  ],
});
