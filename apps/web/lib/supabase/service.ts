import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { env } from '../env';
import type { Database } from './database';

let cached: SupabaseClient<Database> | null = null;

/**
 * Cookie-less Supabase client for server-to-server contexts (webhooks, route
 * handlers that don't need a logged-in user). Uses the service-role key so it
 * bypasses RLS — required for routes that read across users (sidebar counts,
 * the Kapso webhook, scraper writes, etc.).
 */
export function createServiceClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required (set it in apps/web/.env). ' +
        'Get it from Supabase Dashboard → Project Settings → API → service_role secret.',
    );
  }
  cached = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
