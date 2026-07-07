-- ─── Migration: In-App Feedback Bubble ────────────────────────────────────────
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).
--
-- Security model (matches our IDOR-hardening rules):
--   * The `feedback` table is ONLY ever touched by the backend via the service-role
--     key (lib/db.ts), which bypasses RLS. There is NO direct client access.
--   * RLS is ENABLED with NO policies → the anon/authenticated PostgREST roles are
--     denied all access. Users can never SELECT foreign feedback (no email leaks),
--     never UPDATE status/admin_note. Everything goes through the guarded API layer.
--   * We deliberately do NOT grant the Data API roles (relevant for the 2026-10-30
--     GRANT change) — feedback must not be reachable via PostgREST.

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email  TEXT NOT NULL,
  message     TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('bug','idea','question','other')),
  page_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','closed')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- Lock the table down: RLS on, no policies → anon/authenticated get nothing.
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Extra belt-and-suspenders: revoke any default Data API grants.
REVOKE ALL ON feedback FROM anon, authenticated;

-- Verify (run separately):
-- SELECT status, COUNT(*) FROM feedback GROUP BY status;
