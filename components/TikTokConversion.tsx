"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    ttq?: { track: (event: string, data?: object) => void };
  }
}

export default function TikTokConversion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update } = useSession();

  useEffect(() => {
    if (searchParams.get("upgraded") !== "true") return;
    if (!session?.user?.id) return;

    // Remove URL param immediately regardless of outcome
    router.replace("/dashboard", { scroll: false });

    // Refresh session from DB to get latest subscription_status
    update().then((fresh) => {
      const isActive = fresh?.user?.subscriptionStatus === "active";
      if (!isActive) return;

      // localStorage guard – fire only once per user account
      const key = `ttq_cp_${session.user.id}`;
      if (localStorage.getItem(key)) return;

      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("CompletePayment", { value: 29, currency: "USD" });
        localStorage.setItem(key, "1");
      }

      router.refresh();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return null;
}
