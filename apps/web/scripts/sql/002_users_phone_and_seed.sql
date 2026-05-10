-- ============================================================
-- 002 — public.users table + phone column + Ezequiel Bourlot seed
-- ============================================================
-- Mirrors the Prisma User model. We create here directly because
-- Prisma migrations have not been applied to this database yet.

create table if not exists public.users (
  id          uuid        primary key,
  email       text        not null unique,
  name        text,
  avatar_url  text,
  phone_e164  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Idempotent: column may already exist if the table was created earlier.
alter table public.users add column if not exists phone_e164 text;

-- Mock client. Synthetic UUID — does NOT exist in auth.users, so this row
-- bypasses Supabase Auth. Useful as a seed reference for demos.
insert into public.users (id, email, name, phone_e164, created_at, updated_at)
values (
  '11111111-1111-4111-8111-111111111111'::uuid,
  'ezequiel.bourlot@casita.test',
  'Ezequiel Bourlot',
  '+5491167474895',
  now(),
  now()
)
on conflict (id) do update set
  email      = excluded.email,
  name       = excluded.name,
  phone_e164 = excluded.phone_e164,
  updated_at = now();
