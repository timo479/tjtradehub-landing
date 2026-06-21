-- Founder Sale-Cap race-fix
-- Run in Supabase SQL editor.
--
-- Problem: claim_founder_slot() prüft den 90er-Sale-Cap über ein ungelocktes
-- SELECT COUNT(*) und claimt erst danach. Zwei parallele Stripe-Webhooks bei
-- count=89 lesen beide 89 < 90, bestehen beide → Platz 91/92 werden als 'sale'
-- verkauft und fressen die 10er-Giveaway-Reserve an. FOR UPDATE SKIP LOCKED
-- schützt nur gegen Doppel-Claim DESSELBEN Slots, nicht gegen den Cap.
--
-- Fix: pg_advisory_xact_lock(<konstante>) als ERSTE Anweisung serialisiert alle
-- Claims transaktionsweit. Der Lock wird am Transaktionsende automatisch
-- freigegeben (kein manuelles unlock nötig). Identischer Body wie Original,
-- nur die eine Lock-Zeile ergänzt.

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
  -- Serialisiert alle Founder-Claims: erst NACH diesem Lock laufen COUNT-Check
  -- und Claim, sodass der Sale-Cap nicht von parallelen Webhooks unterlaufen wird.
  PERFORM pg_advisory_xact_lock(42424242);

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
