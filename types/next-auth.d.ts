import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    trialEndsAt: string;
    subscriptionStatus: string;
    currentPeriodEnd: string | null;
    role: string;
    isImpersonating?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      trialEndsAt: string;
      subscriptionStatus: string;
      currentPeriodEnd: string | null;
      role: string;
      isImpersonating?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    trialEndsAt: string;
    subscriptionStatus: string;
    currentPeriodEnd: string | null;
    role: string;
    isImpersonating?: boolean;
  }
}
