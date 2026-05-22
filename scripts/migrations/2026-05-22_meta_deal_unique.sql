-- Prevent duplicate trade entries when concurrent syncs race on the same MetaAPI deal.
-- Without this constraint, the application-level SELECT-then-INSERT check in
-- /api/meta/sync/route.ts can be defeated by two syncs running at the same instant.

-- Step 1: clean up any existing duplicates (keep the earliest entry per deal).
DELETE FROM trade_entries a
USING trade_entries b
WHERE a.user_id = b.user_id
  AND a.meta_deal_id = b.meta_deal_id
  AND a.meta_deal_id IS NOT NULL
  AND a.created_at > b.created_at;

-- Step 2: add the unique index (partial — only enforced when meta_deal_id is set).
CREATE UNIQUE INDEX IF NOT EXISTS trade_entries_user_meta_deal_unique
  ON trade_entries (user_id, meta_deal_id)
  WHERE meta_deal_id IS NOT NULL;
