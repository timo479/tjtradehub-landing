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
  const { update } = useSession();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      // Fire TikTok conversion event
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("CompletePayment", {
          value: 29,
          currency: "USD",
        });
      }
      // Force session refresh so subscription_status is updated in JWT
      update().then(() => {
        router.replace("/dashboard", { scroll: false });
        router.refresh();
      });
    }
  }, [searchParams, router, update]);

  return null;
}
