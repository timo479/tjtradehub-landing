"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function MetaConversion() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const status = session?.user?.subscriptionStatus;

  useEffect(() => {
    if (!userId) return;
    if (status !== "active" && status !== "lifetime") return;

    const key = `fbq_purchase_${userId}`;
    if (localStorage.getItem(key)) return;

    if (typeof window !== "undefined" && window.fbq) {
      const value = status === "lifetime" ? 149 : 29;
      window.fbq("track", "Purchase", { value, currency: "USD" });
      localStorage.setItem(key, "1");
    }
  }, [userId, status]);

  return null;
}
