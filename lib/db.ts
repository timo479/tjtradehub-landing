import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-only client with full access (service role)
export const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  trial_starts_at: string;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string;
  current_period_end: string | null;
}
