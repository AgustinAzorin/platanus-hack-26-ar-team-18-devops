import { NextResponse } from 'next/server';

import { createServiceClient } from '../../../lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SidebarCounts {
  unread_chats: number;     // chats with at least one unread inbound message
  found: number;            // analyses with a posting_id link — what /feed renders
  pending: number;          // same count as `found`; /pending also reads from analyses
}

export async function GET() {
  const supabase = createServiceClient();

  // `analyses` isn't typed in our minimal Database; cast to bypass.
  const analysesQuery = (
    supabase.from('analyses' as never) as unknown as {
      select: (
        cols: string,
        opts: { count: 'exact'; head: true },
      ) => {
        not: (col: string, op: string, val: unknown) => Promise<{
          count: number | null;
          error: { message: string } | null;
        }>;
      };
    }
  )
    .select('id', { count: 'exact', head: true })
    .not('posting_id', 'is', null);

  const [chatsRes, analysesRes] = await Promise.all([
    supabase.from('chats').select('id', { count: 'exact', head: true }).gt('unread_count', 0),
    analysesQuery,
  ]);

  const analysesCount = analysesRes.count ?? 0;
  const counts: SidebarCounts = {
    unread_chats: chatsRes.count ?? 0,
    found: analysesCount,
    pending: analysesCount,
  };

  return NextResponse.json(counts, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
