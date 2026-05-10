import { NextResponse } from 'next/server';

import { createServiceClient } from '../../../lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SidebarCounts {
  unread_chats: number;     // chats with at least one unread inbound message
  found: number;            // total propiedades indexed
  pending: number;          // placeholder until "pendientes" has a concrete source
}

export async function GET() {
  const supabase = createServiceClient();

  // Count chats with unread_count > 0. We can't `count: 'exact'` and `gt` together
  // cleanly with the typed client without altering Database types, so use a head
  // query against an unbounded select.
  const [chatsRes, foundRes] = await Promise.all([
    supabase.from('chats').select('id', { count: 'exact', head: true }).gt('unread_count', 0),
    // propiedades isn't typed in our minimal Database; cast to bypass.
    (supabase.from('propiedades' as never) as unknown as { select: (cols: string, opts: { count: 'exact'; head: true }) => Promise<{ count: number | null; error: { message: string } | null }> })
      .select('posting_id', { count: 'exact', head: true }),
  ]);

  const counts: SidebarCounts = {
    unread_chats: chatsRes.count ?? 0,
    found: foundRes.count ?? 0,
    pending: 0,
  };

  return NextResponse.json(counts, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
