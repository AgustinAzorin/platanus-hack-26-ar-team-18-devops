-- ============================================================
-- 006 — propiedades.description_summary: AI-generated short summary
-- ============================================================
-- The /pending and /feed cards label their long-text block as "Resumen IA",
-- and the code in apps/web/app/pending/data.ts + apps/web/app/feed/data.ts
-- reads `description_summary` first and falls back to the raw `description`
-- when missing. After the propiedades table was dropped and re-seeded the
-- column was lost, so every card is currently showing the raw scraped
-- description verbatim.
--
-- Adding the column re-enables the backfill script:
--   pnpm --filter web summarize
-- which calls Claude Haiku 4.5 to populate the field for every row where
-- it is still null.

alter table public.propiedades
  add column if not exists description_summary text;
