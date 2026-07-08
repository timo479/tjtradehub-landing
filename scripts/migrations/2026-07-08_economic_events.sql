-- Economic calendar events (ForexFactory free feed) for the Market Calendar.
CREATE TABLE IF NOT EXISTS economic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  country VARCHAR(8) NOT NULL,            -- currency code: USD, EUR, ...
  event_time TIMESTAMPTZ NOT NULL,        -- parsed from ISO+offset → stored as UTC
  impact VARCHAR(10) NOT NULL CHECK (impact IN ('high','medium','low')),
  forecast TEXT,
  previous TEXT,
  feed_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,  -- optional link to AI analysis
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country, title, event_time)     -- upsert key
);

CREATE INDEX IF NOT EXISTS idx_econ_events_time ON economic_events(event_time);

-- Public read (scheduled events, not user data). Writes only via service role (cron).
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_events" ON economic_events;
CREATE POLICY "public_read_events" ON economic_events
  FOR SELECT USING (true);

-- Explicit grants (Supabase Data-API GRANT requirement from 2026-10-30 onward).
GRANT SELECT ON economic_events TO anon, authenticated;
