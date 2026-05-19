-- Founder Slots (100 Lifetime-Plätze)
-- Run in Supabase SQL editor

-- 1) users.founder_number
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS founder_number integer UNIQUE
  CHECK (founder_number IS NULL OR (founder_number >= 1 AND founder_number <= 100));

-- 2) founder_slots: 100 rows pre-inserted
CREATE TABLE IF NOT EXISTS founder_slots (
  number integer PRIMARY KEY CHECK (number >= 1 AND number <= 100),
  claimed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  email text,
  acquired_via text CHECK (acquired_via IN ('sale','giveaway','soft_launch')),
  stripe_session_id text UNIQUE,
  claimed_at timestamptz
);

ALTER TABLE founder_slots ENABLE ROW LEVEL SECURITY;

-- Pre-insert 100 slots (idempotent)
INSERT INTO founder_slots (number)
SELECT generate_series(1, 100)
ON CONFLICT (number) DO NOTHING;

CREATE INDEX IF NOT EXISTS founder_slots_claimed_idx
  ON founder_slots (claimed_at DESC NULLS LAST)
  WHERE claimed_by_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS founder_slots_acquired_via_idx
  ON founder_slots (acquired_via)
  WHERE claimed_by_user_id IS NOT NULL;

-- 3) Atomic claim function — race-safe via FOR UPDATE SKIP LOCKED
-- Returns the claimed slot number, or raises an exception if none available.
-- For 'sale': caps at 90 to reserve 10 for giveaway winners.
CREATE OR REPLACE FUNCTION claim_founder_slot(
  p_user_id uuid,
  p_email text,
  p_acquired_via text,
  p_stripe_session_id text DEFAULT NULL
) RETURNS integer AS $$
DECLARE
  v_slot integer;
  v_sale_count integer;
BEGIN
  IF p_acquired_via NOT IN ('sale','giveaway','soft_launch') THEN
    RAISE EXCEPTION 'invalid acquired_via: %', p_acquired_via;
  END IF;

  -- Sale cap: 90 paid slots
  IF p_acquired_via = 'sale' THEN
    SELECT COUNT(*) INTO v_sale_count
      FROM founder_slots
      WHERE acquired_via = 'sale';
    IF v_sale_count >= 90 THEN
      RAISE EXCEPTION 'no_sale_slots_remaining';
    END IF;
  END IF;

  -- Idempotency: if this stripe session already claimed a slot, return it
  IF p_stripe_session_id IS NOT NULL THEN
    SELECT number INTO v_slot
      FROM founder_slots
      WHERE stripe_session_id = p_stripe_session_id;
    IF v_slot IS NOT NULL THEN
      RETURN v_slot;
    END IF;
  END IF;

  -- Atomic claim of next available slot
  UPDATE founder_slots
    SET claimed_by_user_id = p_user_id,
        email = p_email,
        acquired_via = p_acquired_via,
        stripe_session_id = p_stripe_session_id,
        claimed_at = now()
    WHERE number = (
      SELECT number FROM founder_slots
        WHERE claimed_by_user_id IS NULL
        ORDER BY number ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING number INTO v_slot;

  IF v_slot IS NULL THEN
    RAISE EXCEPTION 'no_slots_available';
  END IF;

  -- Flip user to lifetime
  UPDATE users
    SET subscription_status = 'lifetime',
        founder_number = v_slot,
        current_period_end = NULL
    WHERE id = p_user_id;

  RETURN v_slot;
END;
$$ LANGUAGE plpgsql;
