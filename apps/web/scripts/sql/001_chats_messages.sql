-- ============================================================
-- Casita · WhatsApp chats schema (run in Supabase SQL editor)
-- ============================================================
-- Hackathon-grade: RLS disabled. Tighten before production.

create extension if not exists "uuid-ossp";

-- A chat = (us, a phone number, optionally tied to one propiedad).
create table if not exists public.chats (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete set null,
  phone_e164            text not null,                          -- normalized destination, e.g. +5491155557777
  propiedad_posting_id  text references public.propiedades(posting_id) on delete set null,
  contact_name          text,
  last_message_at       timestamptz,
  last_inbound_at       timestamptz,                            -- used to know if 24h window is open
  unread_count          integer not null default 0,
  status                text not null default 'open',          -- open | closed
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists chats_phone_unique on public.chats (phone_e164);
create index        if not exists chats_user_id_idx   on public.chats (user_id);
create index        if not exists chats_last_msg_idx  on public.chats (last_message_at desc nulls last);

-- One row per WhatsApp message, in either direction.
create table if not exists public.messages (
  id                uuid primary key default uuid_generate_v4(),
  chat_id           uuid not null references public.chats(id) on delete cascade,
  direction         text not null check (direction in ('in','out')),
  body              text,
  kind              text not null default 'text',              -- text | template | image | audio | system
  kapso_message_id  text,                                      -- wamid.* returned by Kapso (out) or received (in)
  status            text,                                      -- queued | sent | delivered | read | failed | received
  error             text,
  created_at        timestamptz not null default now()
);

create unique index if not exists messages_kapso_id_unique on public.messages (kapso_message_id) where kapso_message_id is not null;
create index        if not exists messages_chat_idx        on public.messages (chat_id, created_at);

-- Bump chat counters whenever a message lands.
create or replace function public.touch_chat_on_message() returns trigger
language plpgsql as $$
begin
  if new.direction = 'in' then
    update public.chats
       set last_message_at = new.created_at,
           last_inbound_at = new.created_at,
           unread_count    = unread_count + 1,
           updated_at      = now()
     where id = new.chat_id;
  else
    update public.chats
       set last_message_at = new.created_at,
           updated_at      = now()
     where id = new.chat_id;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat
  after insert on public.messages
  for each row execute function public.touch_chat_on_message();

-- Realtime: enable for /chats subscription.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chats;

-- RLS: leave OFF for hackathon. Re-enable later with proper policies.
alter table public.chats    disable row level security;
alter table public.messages disable row level security;
