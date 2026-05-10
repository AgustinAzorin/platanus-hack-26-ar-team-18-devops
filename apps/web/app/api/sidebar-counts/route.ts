import { NextResponse } from 'next/server';

import { getCurrentClientUserId } from '../../../lib/search/profile';
import { createServiceClient } from '../../../lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SidebarCounts {
  unread_chats: number;     // chats with at least one unread inbound message
  found: number;            // feed_results awaiting user OK (or total propiedades when none)
  pending: number;          // placeholder until "pendientes" has a concrete source
}

export async function GET() {
  const supabase = createServiceClient();
  const userId = await getCurrentClientUserId();

  // /feed badge: prefer the user's IA-generated pending feed_results; fall back to
  // total propiedades indexed (so the badge keeps showing something on a fresh DB).
  const [chatsRes, feedRes, propsRes] = await Promise.all([
    supabase.from('chats').select('id', { count: 'exact', head: true }).gt('unread_count', 0),
    supabase
      .from('feed_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending'),
    // propiedades isn't typed in our minimal Database; cast to bypass.
    (supabase.from('propiedades' as never) as unknown as { select: (cols: string, opts: { count: 'exact'; head: true }) => Promise<{ count: number | null; error: { message: string } | null }> })
      .select('posting_id', { count: 'exact', head: true }),
  ]);

  const counts: SidebarCounts = {
    unread_chats: chatsRes.count ?? 0,
    found: feedRes.count && feedRes.count > 0 ? feedRes.count : (propsRes.count ?? 0),
    pending: 0,
  };

  return NextResponse.json(counts, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
