-- ============================================================
-- 004 — feed_results: AI-curated property reports for /feed
-- ============================================================
-- When the search agent (in /chats with Casita IA) finishes collecting
-- filters, it queries `propiedades`, scores each candidate, generates a
-- short AI report and persists rows here. /feed reads from this table
-- (filtered by the current user) instead of the old mock-only listing.
--
-- The user can mark each card as accepted/rejected from /feed; the IA
-- then takes over the accepted ones (outreach, scheduling) and surfaces
-- confirmed visits in /pending.

create extension if not exists "uuid-ossp";

create table if not exists public.feed_results (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid,                                         -- references public.users(id) when auth lands
  search_id             uuid not null,                                -- groups all rows produced by one /chats run
  posting_id            text not null,                                -- references public.propiedades(posting_id)
  filters               jsonb not null,                               -- the SearchFilters used to generate this row
  match_score           integer,                                      -- 0–100 quick score
  report_summary        text,                                         -- short AI-written summary of why it matches
  report_highlights     jsonb,                                        -- {pros: [...], cons: [...]} (optional)
  status                text not null default 'pending'
                          check (status in ('pending','accepted','rejected')),
  decided_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists feed_results_user_status_idx
  on public.feed_results (user_id, status, created_at desc);

create index if not exists feed_results_search_idx
  on public.feed_results (search_id);

-- Idempotency: don't duplicate the same propiedad in the same search run.
create unique index if not exists feed_results_unique_per_run
  on public.feed_results (search_id, posting_id);

alter table public.feed_results disable row level security;

alter publication supabase_realtime add table public.feed_results;
