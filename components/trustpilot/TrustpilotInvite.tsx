"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Recipient email — Trustpilot sends the invitation here. */
  email: string;
  /** Recipient display name (may be empty). */
  name: string;
  /** Stable per-user reference so Trustpilot de-dupes server-side too. */
  referenceId: string;
};

/**
 * Fires a single Trustpilot review invitation via the Invitation JavaScript
 * (`tp('createInvitation', …)`), then persists a flag so we never invite this
 * user again — neither client-side nor via the daily-cron email fallback.
 *
 * Rendered by the dashboard ONLY when the user has logged >= 1 trade and has
 * no `trustpilot_invited_at` yet. The `tp` global is registered in the root
 * layout; because that script loads async, we poll briefly for it.
 */
export default function TrustpilotInvite({ email, name, referenceId }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !email) return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const trigger = () => {
      const tp = (window as unknown as { tp?: (...args: unknown[]) => void }).tp;
      if (typeof tp !== "function") {
        // Script not ready yet (or blocked). Retry for ~10s, then give up —
        // the daily cron will catch this user later.
        if (attempts++ < 20) timer = setTimeout(trigger, 500);
        return;
      }

      fired.current = true;
      tp("createInvitation", {
        recipientEmail: email,
        recipientName: name || "",
        referenceId,
        source: "InvitationScript",
      });

      // Persist the flag so neither this page nor the cron re-invites.
      fetch("/api/trustpilot/mark-invited", { method: "POST" }).catch(() => {});
    };

    trigger();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [email, name, referenceId]);

  return null;
}
