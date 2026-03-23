"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

declare global {
  interface Window {
    ttq?: { track: (event: string, data?: object) => void };
  }
}

export default function TikTokConversion() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("CompletePayment", {
          value: 29,
          currency: "USD",
        });
      }
      // Remove ?upgraded=true from URL so it doesn't fire again on refresh
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}
