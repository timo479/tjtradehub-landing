-- Webhook-Idempotenz: protokolliert verarbeitete Stripe-Events.
-- Run in Supabase SQL editor.
--
-- Stripe liefert Webhooks "at-least-once" und retried bei Timeout/Fehler. Ohne Marker
-- würde ein erneut zugestelltes Event nicht-idempotente Side-Effects erneut auslösen
-- (z.B. die Founder-Welcome-Mail). Der Webhook prüft am Anfang, ob event_id schon
-- verarbeitet wurde, und markiert sie NACH erfolgreicher Verarbeitung.
--
-- Zugriff nur durch den Service-Role-Client (Webhook), der RLS umgeht → RLS an, keine
-- Policy nötig (niemand sonst kommt an die Tabelle).

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id text PRIMARY KEY,
  type text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
