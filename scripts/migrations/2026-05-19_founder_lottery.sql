-- Founder Lottery (Gewinnspiel) Schema
-- Run in Supabase SQL editor

-- 1) Add referral fields to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key
  ON users (referral_code)
  WHERE referral_code IS NOT NULL;

-- 2) Lottery entries: one row per user, tracks total lots + which sources have already been credited
CREATE TABLE IF NOT EXISTS founder_lottery_entries (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  lots integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '{}'::jsonb,  -- e.g. {"register":1,"mt5_connect":3,"five_trades":5,"twitter_share":2,"referrals":15}
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS founder_lottery_entries_lots_idx
  ON founder_lottery_entries (lots DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_founder_lottery_entries_updated_at ON founder_lottery_entries;
CREATE TRIGGER trg_founder_lottery_entries_updated_at
  BEFORE UPDATE ON founder_lottery_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
