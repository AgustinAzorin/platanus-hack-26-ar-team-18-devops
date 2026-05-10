-- ============================================================
-- 005 — analyses.posting_id: link analyses to a specific property
-- ============================================================
-- Up to 004 the `analyses` table only stored the property URL, which
-- caused mismatches when /informe tried to fetch the report for a
-- specific feed_result: the URL we computed from `propiedades.url`
-- often did not match the URL the API persisted (e.g. when the API
-- analysed the FIRST property of a neighborhood instead of the one
-- requested). Linking by `posting_id` removes that ambiguity.

alter table public.analyses
  add column if not exists posting_id text;

create index if not exists analyses_posting_id_idx
  on public.analyses (posting_id);

-- Disable RLS so the web app's anon-key client can read reports for the feed
-- and pending pages. Matches the convention used in 004 for `feed_results`.
alter table public.analyses disable row level security;
