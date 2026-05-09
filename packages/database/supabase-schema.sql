-- Run this once against your Supabase project (SQL editor or migration script).
-- Existing tables are unaffected.

create table if not exists environment_cache (
  id         uuid        primary key default gen_random_uuid(),
  lat_grid   numeric(9,6) not null,
  lng_grid   numeric(9,6) not null,
  data       jsonb        not null,
  created_at timestamptz  not null default now()
);

-- Unique constraint used by upsert in EnvironmentCacheService
create unique index if not exists environment_cache_grid_idx
  on environment_cache (lat_grid, lng_grid);

-- Used by the TTL filter (gte created_at)
create index if not exists environment_cache_created_at_idx
  on environment_cache (created_at);
