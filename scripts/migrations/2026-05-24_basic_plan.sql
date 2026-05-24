-- ─── Migration: Replace 7-day Trial with Basic (free forever) ──────────────────
-- Run this in Supabase SQL Editor. Safe to re-run (idempotent).
-- After running, ALL existing trialing / null / canceled / past_due users
-- can access the journal again on the new free Basic plan (no MT5 sync).
-- Lifetime + active subscribers are NOT touched.

-- 1) Migrate everyone who is not currently paying to "basic".
--    'canceled' and 'past_due' users also flip back to basic so they regain journal access.
UPDATE users
   SET subscription_status = 'basic',
       current_period_end = NULL
 WHERE subscription_status IN ('trialing', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid')
    OR subscription_status IS NULL;

-- 2) Clear obsolete trial fields for safety (column stays, value is null).
UPDATE users
   SET trial_ends_at = NULL,
       trial_emails_sent = NULL
 WHERE subscription_status = 'basic';

-- 3) Verify counts (run as a separate query to inspect).
-- SELECT subscription_status, COUNT(*) FROM users GROUP BY subscription_status ORDER BY 2 DESC;
