-- ============================================================
-- 003 — Client profile columns on public.users
-- ============================================================
-- Required client info that the search agent must know before showing
-- results. Stored once per user and reused across sessions so we don't
-- re-ask: pets, owned real estate, guarantor, caución insurance.

alter table public.users add column if not exists has_pet               boolean;
alter table public.users add column if not exists pet_details           text;
alter table public.users add column if not exists has_real_estate       boolean;
alter table public.users add column if not exists real_estate_location  text;
alter table public.users add column if not exists has_guarantor         boolean;
alter table public.users add column if not exists guarantor_details     text;
-- caucion_status: 'has' | 'can_contract' | 'no' | null (unknown)
alter table public.users add column if not exists caucion_status        text;
