create extension if not exists "pgcrypto";

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  scraped_data jsonb not null,
  report jsonb not null,
  score int not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_url_created_at_idx
  on public.analyses (url, created_at desc);

create index if not exists analyses_created_at_idx
  on public.analyses (created_at desc);

alter table public.analyses enable row level security;
