-- ─── Migration: Partner-/Affiliate-Programm ───────────────────────────────────
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Modell (final entschieden 2026-08-11):
--   * Partner bekommt 30% RECURRING auf den TATSÄCHLICH EINGEGANGENEN Betrag
--     (nicht auf den Listenpreis!) — dadurch stapeln sich Follower-Rabatt und
--     Provision nicht gegen uns, und wir zahlen nie mehr aus als reinkam.
--   * Follower bekommt 20% auf 3 Monate über einen persönlichen Stripe-Promo-Code.
--   * Auszahlung monatlich nachschüssig, 14 Tage Refund-Hold, Mindestbetrag $50.
--
-- Security model (wie feedback / IDOR-Härtung):
--   * Alle drei Tabellen werden AUSSCHLIESSLICH vom Backend über den Service-Role-Key
--     (lib/db.ts) angefasst — der bypassed RLS. Kein direkter Client-Zugriff.
--   * RLS ist ENABLED ohne Policies → anon/authenticated bekommen nichts.
--     Wichtig: `referrals` verknüpft Partner mit ECHTEN Kunden-IDs. Ein Partner darf
--     niemals sehen, WER sich angemeldet hat (Datenschutz DSG/DSGVO) — das
--     Partner-Dashboard liefert deshalb nur anonymisierte, aggregierte Daten aus
--     dem geguardeten API-Layer.
--   * Bewusst KEINE Data-API-Grants (relevant für die 2026-10-30 GRANT-Umstellung).

-- ─── 1. affiliates ────────────────────────────────────────────────────────────
-- Ein Partner. `user_id` verknüpft ihn mit seinem (gratis Pro) TJTradeHub-Account,
-- darüber loggt er sich ins Partner-Dashboard ein.
CREATE TABLE IF NOT EXISTS affiliates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  instagram      TEXT,

  -- Der Code, den der Partner verteilt. Dient DOPPELT:
  --   1) als Stripe-Promo-Code (Follower tippt ihn im Checkout ein)
  --   2) als Link-Slug: tjtradehub.com/?via=SARAH20
  -- Immer uppercase gespeichert, Vergleich case-insensitive.
  promo_code     TEXT NOT NULL UNIQUE,

  -- Provisionssatz in Basispunkten (3000 = 30.00%). Integer statt float, damit
  -- keine Rundungsdrift in der Geld-Rechnung entsteht.
  rate_bps       INTEGER NOT NULL DEFAULT 3000 CHECK (rate_bps BETWEEN 0 AND 10000),

  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  payout_method  TEXT,           -- freitext: "PayPal: x@y.com", "IBAN CH..."
  admin_note     TEXT,

  -- 60-Tage-Regel: 0 Signups seit Start → Code wird deaktiviert.
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_promo_code_lower
  ON affiliates (LOWER(promo_code));
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates (status);

-- ─── 2. referrals ─────────────────────────────────────────────────────────────
-- Der „kommt-von"-Stempel. UNVERÄNDERLICH und FIRST-TOUCH: ein User gehört für
-- immer zum ERSTEN Partner, über den er kam. Deshalb UNIQUE auf user_id — ein
-- zweiter INSERT für denselben User schlägt fehl (ON CONFLICT DO NOTHING im Code)
-- statt die Zuordnung zu überschreiben. Das verhindert Attributions-Streit.
--
-- Wichtig fürs Modell: Der Stempel entsteht schon beim SIGNUP (auch bei gratis
-- Basic-Usern), nicht erst beim Kauf. Sonst wäre ein User, der heute gratis
-- startet und in 3 Monaten upgradet, nicht mehr zuzuordnen.
CREATE TABLE IF NOT EXISTS referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  affiliate_id  UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

  -- 'link'  = über ?via=CODE + 60-Tage-Cookie beim Signup
  -- 'promo' = über den Stripe-Promo-Code im Checkout (fängt Direkt-Käufer, die
  --           nie über den Link kamen)
  source        TEXT NOT NULL CHECK (source IN ('link','promo','manual')),

  signed_up_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_paid_at TIMESTAMPTZ,   -- erste erfolgreiche Zahlung
  churned_at    TIMESTAMPTZ    -- Abo endgültig gekündigt (subscription.deleted)
);

CREATE INDEX IF NOT EXISTS idx_referrals_affiliate ON referrals (affiliate_id, signed_up_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_user ON referrals (user_id);

-- ─── 3. commissions ───────────────────────────────────────────────────────────
-- Ledger: EINE Zeile pro tatsächlich eingegangener Stripe-Zahlung.
-- Das ist der Kern der Liquiditäts-Sicherheit: es kann per Konstruktion nie eine
-- Provision entstehen, ohne dass vorher Geld eingegangen ist.
CREATE TABLE IF NOT EXISTS commissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id       UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id        UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Idempotenz-Anker: Stripe Invoice-ID bzw. Checkout-Session-ID (Founder).
  -- UNIQUE → ein Webhook-Retry kann dieselbe Provision nicht doppelt gutschreiben.
  stripe_ref         TEXT NOT NULL UNIQUE,
  kind               TEXT NOT NULL CHECK (kind IN ('subscription','lifetime')),

  -- Alles in CENT (integer), niemals float. gross_cents = was der Kunde WIRKLICH
  -- gezahlt hat (invoice.amount_paid — Rabatt ist da bereits abgezogen).
  gross_cents        INTEGER NOT NULL CHECK (gross_cents >= 0),
  rate_bps           INTEGER NOT NULL,           -- Satz zum Zeitpunkt der Zahlung eingefroren
  commission_cents   INTEGER NOT NULL CHECK (commission_cents >= 0),
  currency           TEXT NOT NULL DEFAULT 'usd',

  -- pending      → im 14-Tage-Refund-Hold
  -- payable      → Hold vorbei, wartet auf die Monatsauszahlung
  -- paid         → ausgezahlt
  -- clawed_back  → Kunde hat Rückerstattung bekommen, Provision storniert
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','payable','paid','clawed_back')),

  paid_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- wann der Kunde gezahlt hat
  payable_after      TIMESTAMPTZ NOT NULL,                -- paid_at + 14 Tage
  paid_out_at        TIMESTAMPTZ,                         -- wann WIR den Partner bezahlt haben
  clawed_back_at     TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_status
  ON commissions (affiliate_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_payable
  ON commissions (payable_after) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions (user_id);

-- ─── Lockdown ─────────────────────────────────────────────────────────────────
ALTER TABLE affiliates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON affiliates  FROM anon, authenticated;
REVOKE ALL ON referrals   FROM anon, authenticated;
REVOKE ALL ON commissions FROM anon, authenticated;

-- ─── Verify (separat ausführen) ───────────────────────────────────────────────
-- SELECT a.name, a.promo_code, a.status,
--        COUNT(DISTINCT r.id)                                    AS signups,
--        COUNT(DISTINCT r.id) FILTER (WHERE r.first_paid_at IS NOT NULL
--                                       AND r.churned_at IS NULL) AS active_payers,
--        COALESCE(SUM(c.commission_cents) FILTER (WHERE c.status <> 'clawed_back'), 0) / 100.0 AS earned_usd
--   FROM affiliates a
--   LEFT JOIN referrals r   ON r.affiliate_id = a.id
--   LEFT JOIN commissions c ON c.affiliate_id = a.id
--  GROUP BY a.id ORDER BY earned_usd DESC;
