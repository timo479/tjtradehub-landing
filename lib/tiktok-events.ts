import crypto from "node:crypto";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

interface TikTokCompletePaymentParams {
  eventId: string;
  eventTime: number;
  email: string | null | undefined;
  externalId: string | null | undefined;
  value: number | null | undefined;
  currency: string | null | undefined;
}

export async function sendTikTokCompletePayment(params: TikTokCompletePaymentParams): Promise<void> {
  const pixelCode = process.env.TIKTOK_PIXEL_ID;
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  if (!pixelCode || !accessToken) {
    console.warn("[TikTok] Skipping CompletePayment – TIKTOK_PIXEL_ID or TIKTOK_ACCESS_TOKEN not set");
    return;
  }

  if (!params.email && !params.externalId) {
    console.warn("[TikTok] Skipping CompletePayment – no user identifiers available", {
      event_id: params.eventId,
    });
    return;
  }

  if (params.value == null || !params.currency) {
    console.warn("[TikTok] Skipping CompletePayment – missing value or currency", {
      event_id: params.eventId,
      value: params.value,
      currency: params.currency,
    });
    return;
  }

  const user: Record<string, string> = {};
  if (params.email) user.email = sha256(params.email);
  if (params.externalId) user.external_id = sha256(params.externalId);

  const payload = {
    pixel_code: pixelCode,
    event: "CompletePayment",
    event_time: params.eventTime,
    event_id: params.eventId,
    user,
    properties: {
      value: params.value,
      currency: params.currency.toUpperCase(),
    },
  };

  console.log("[TikTok] Preparing CompletePayment event", {
    event_id: params.eventId,
    value: payload.properties.value,
    currency: payload.properties.currency,
    email_hashed_prefix: user.email ? user.email.slice(0, 8) : null,
    external_id_hashed_prefix: user.external_id ? user.external_id.slice(0, 8) : null,
  });

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.code !== 0) {
      console.error("[TikTok] CompletePayment FAILED", {
        event_id: params.eventId,
        status: res.status,
        code: data?.code,
        message: data?.message,
      });
      return;
    }

    console.log("[TikTok] CompletePayment sent successfully", {
      event_id: params.eventId,
      status: res.status,
      code: data?.code,
      message: data?.message,
    });
  } catch (err) {
    console.error("[TikTok] CompletePayment ERROR (exception caught)", {
      event_id: params.eventId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
