import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

import type { Env } from '../config/env.schema';

/**
 * Two clients:
 *   - `admin` uses the SERVICE_ROLE_KEY. Bypasses RLS. Use for admin ops
 *     (creating users, deleting users, querying any row).
 *   - `anon` uses the ANON key. Subject to RLS. Use for user-driven flows
 *     like signInWithPassword where you want Supabase to behave the same
 *     as it would in the browser.
 *
 * Never leak the admin client to a request that's acting on behalf of a
 * user without re-establishing identity — it has full DB access.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  readonly admin: SupabaseClient;
  readonly anon: SupabaseClient;

  constructor(config: ConfigService<Env, true>) {
    const url = config.get('SUPABASE_URL', { infer: true });
    const serviceKey = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    const anonKey = config.get('SUPABASE_ANON_KEY', { infer: true });

    this.admin = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: { transport: ws },
    });

    this.anon = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: { transport: ws },
    });

    this.logger.log('Supabase clients initialized (admin + anon)');
  }
}
