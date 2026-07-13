-- Trustpilot review-invitation tracking.
-- One flag per user so we never invite twice — shared by BOTH paths:
--   1) client-side Trustpilot Invitation JS (createInvitation) on the dashboard
--   2) server-side fallback Resend email sent from the daily cron
-- Set once (whichever path fires first), checked by both.

ALTER TABLE users ADD COLUMN IF NOT EXISTS trustpilot_invited_at TIMESTAMPTZ;

-- Partial index: the cron only ever scans the not-yet-invited tail.
CREATE INDEX IF NOT EXISTS idx_users_trustpilot_uninvited
  ON users (id) WHERE trustpilot_invited_at IS NULL;
