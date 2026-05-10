import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../env';
import type { Database } from './database';

let cached: SupabaseClient<Database> | null = null;

/**
 * Cookie-less Supabase client for server-to-server contexts (webhooks, route
 * handlers that don't need a logged-in user). Uses the anon key — relies on
 * RLS being disabled for `chats`/`messages`. Swap for the service-role key
 * when RLS is enabled.
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
