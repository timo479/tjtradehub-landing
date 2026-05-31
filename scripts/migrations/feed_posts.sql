-- KI News Feed: feed_posts table
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  scenarios JSONB NOT NULL DEFAULT '[]',
  impact VARCHAR(10) NOT NULL CHECK (impact IN ('high','medium','low')),
  symbols TEXT[] NOT NULL DEFAULT '{}',
  source_name VARCHAR(100) NOT NULL,
  source_url TEXT NOT NULL,
  disclaimer TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  ai_model VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feed_status_published ON feed_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_impact ON feed_posts(impact);
CREATE INDEX IF NOT EXISTS idx_feed_symbols ON feed_posts USING GIN(symbols);

-- Row Level Security: public read only published posts, service role has full access
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published" ON feed_posts
  FOR SELECT USING (status = 'published');

-- Service role bypasses RLS automatically (used by backend via service role key)
