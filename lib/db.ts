import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _db: SupabaseClient | null = null;

function getDb(): SupabaseClient {
  if (!_db) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
    _db = createClient(url, key, { auth: { persistSession: false } });
  }
  return _db;
}

// Server-only client with full access (service role)
export const db = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getDb() as never)[prop as never];
  },
});

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string;
  current_period_end: string | null;
  onboarding_completed: boolean;
  journal_tour_completed: boolean;
  role: string;
  is_banned: boolean;
}
