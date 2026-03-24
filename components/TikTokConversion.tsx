"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    ttq?: { track: (event: string, data?: object) => void };
  }
}

export default function TikTokConversion() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const status = session?.user?.subscriptionStatus;

  useEffect(() => {
    if (!userId) return;
    if (status !== "active") return;

    const key = `ttq_cp_${userId}`;
    if (localStorage.getItem(key)) return;

    if (typeof window !== "undefined" && window.ttq) {
      window.ttq.track("CompletePayment", { value: 29, currency: "USD" });
      localStorage.setItem(key, "1");
    }
  }, [userId, status]);

  return null;
}
