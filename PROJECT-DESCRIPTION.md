# Proyecto — Platanus Hack 26 (Buenos Aires) · Team 18

**Track:** Vertical AI

## Equipo

- Agustín Azorin — [@AgustinAzorin](https://github.com/AgustinAzorin)
- Ezequiel Bourlot — [@eze2508](https://github.com/eze2508)
- Juan Montilla — [@Monti3](https://github.com/Monti3)

---

## Resumen

Asistente vertical de IA para búsqueda de propiedades en alquiler/venta en Argentina. El sistema scrapea publicaciones de Zonaprop, las enriquece con análisis de Claude (texto + visión sobre las fotos reales), permite búsqueda semántica vectorial y automatiza el primer contacto con la inmobiliaria por WhatsApp.

El usuario describe en lenguaje natural lo que busca y la plataforma:

1. Traduce la consulta a filtros estructurados.
2. Recupera propiedades candidatas (filtros + similitud vectorial).
3. Genera un informe de "due diligence" (seguridad, contexto del barrio, reputación de la inmobiliaria, condición visual).
4. Inicia outreach por WhatsApp con el tono que el usuario haya elegido en el onboarding.

---

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 15 (App Router) → Vercel — `apps/web`
- **Backend:** NestJS 11 → Railway / Render / Fly — `apps/api`
- **ORM:** Prisma 6 contra Postgres (Supabase) — `packages/database`
- **Auth + DB + Storage:** Supabase (JWT, RLS, pgvector)
- **Validación compartida:** Zod en `packages/types` (consumido por web y api)
- **IA:** Claude (análisis de texto + visión, traducción de queries, resúmenes)
- **Búsqueda vectorial:** pgvector con índice HNSW (cosine) sobre embeddings visuales (1024 dims)
- **WhatsApp:** Kapso (webhooks firmados + envío de mensajes)
- **Scrapers:** Python (listados y ficha individual de Zonaprop)
- **Animaciones / UI:** GSAP + SplitText, Lucide icons
- **TypeScript estricto** en todo el monorepo

---

## Estructura del repo

```
apps/
  web/     Next.js. Auth Supabase (cookies SSR), llama a la API Nest.
  api/     NestJS. Único dueño de Prisma. Verifica JWT de Supabase.
packages/
  database/      schema.prisma + cliente Prisma exportado.
  types/         Esquemas Zod + tipos TS compartidos web/api.
  tsconfig/      Configs base (base, nextjs, nestjs).
  eslint-config/ Configs ESLint compartidas.
scraper/             Scraper de listados de Zonaprop (Python).
scraper_propiedad/   Scraper de ficha individual por posting_id (Python).
supabase-migrations-vectorial-search.sql  Habilita pgvector + RPC de búsqueda.
```

---

## Módulos del backend (NestJS)

Ubicados en `apps/api/src/modules/`:

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Sign up / sign in / refresh / sign out vía Supabase Auth. Espeja `auth.users.id` en la tabla `User`. |
| `users` | CRUD de perfil (mascotas, garante, caución, inmueble propio) capturado durante el onboarding. |
| `properties` | Acceso a la tabla de propiedades scrapeadas y listado de barrios. |
| `analysis` | Genera el informe de la propiedad con Claude (texto + visión) y backfill de embeddings visuales. |
| `search` | Pipeline de búsqueda: traduce la query natural → filtros → ejecutor → resumen. |
| `environment` | Bootstrap y validación de variables de entorno (Zod). |

Convención por módulo: `module → controller → service → repository → Prisma`. Solo el repositorio toca `PrismaService`. DTOs validados con `nestjs-zod` (`createZodDto(Schema)`).

---

## Pantallas del frontend (Next.js App Router)

Ubicadas en `apps/web/app/`:

| Ruta | Qué hace |
| --- | --- |
| `/home` | Composer principal con chips de criterios y feed de actividad en vivo. |
| `/search` | Resultados de la consulta natural + filtros derivados. |
| `/analyze` | Análisis on-demand de una propiedad por barrio o `posting_id`. |
| `/feed` | Tarjetas con score y estado (contactado / respondido / descartado / pendiente). |
| `/informe/[id]` | Informe de due diligence completo de una propiedad. |
| `/chats` | Conversaciones de WhatsApp con inmobiliarias, manejadas por el bot. |
| `/onboarding` | Setup inicial: tono del bot (formal / canchero / directo) y datos del cliente. |
| `/profile` | Datos del perfil reutilizables por el agente. |
| `/dashboard`, `/pending`, `/approve`, `/login` | Áreas auxiliares de control y auth. |

Rutas API internas relevantes (`apps/web/app/api/`):

- `kapso/webhook` — Recibe eventos de WhatsApp (firma `x-webhook-signature` validada).
- `chats/*`, `feed/*`, `informe/*`, `search/*`, `sidebar-counts` — Endpoints de lectura/escritura específicos del front.

---

## Modelo de datos (Prisma)

Definido en `packages/database/prisma/schema.prisma`.

- **`User`** — Espejo de `auth.users` de Supabase. Guarda perfil reutilizable: `hasPet`/`petDetails`, `hasRealEstate`/`realEstateLocation`, `hasGuarantor`/`guarantorDetails`, `caucionStatus` (`has` | `can_contract` | `no`), `phoneE164`, etc.
- **`Analysis`** — Informe generado por Claude para una `url` específica. Contiene `scrapedData` (JSON), `report` (JSON estructurado), `score` (int), y se complementa en SQL con `visual_description` (text) y `visual_embedding` (`vector(1024)`).
- Índices: `(url, createdAt desc)` y `(createdAt desc)` para feed reciente; **HNSW** sobre `visual_embedding` con `vector_cosine_ops` (`m=16`, `ef_construction=64`).
- **RPC `search_analyses_by_embedding`** — Recibe embedding + lista de URLs + score mínimo, devuelve top-N por similitud coseno.

---

## Auth

Dos caminos, ambos contra Supabase Auth:

1. **Frontend → Supabase** (sesiones por cookie, SSR-friendly con `@supabase/ssr`). El front llama a la API Nest con `Authorization: Bearer <jwt>`.
2. **Cliente → Backend `/auth/*`** (sign-up, sign-in, refresh, sign-out, me) para mobile/scripts.

Ambos comparten el mismo guard: `SupabaseAuthGuard` verifica la firma del JWT contra `SUPABASE_JWT_SECRET` localmente (sin round-trip a Supabase). Controllers leen el usuario con `@CurrentUser()`. El frontend nunca importa Prisma.

---

## Pipeline de búsqueda

1. `SearchTranslatorService` → Claude convierte el texto libre en `SearchFilters` (barrios, precio máximo + moneda, tipo de operación, features must-have, score mínimo, rango de ambientes, free-text).
2. `SearchExecutorService` → consulta la tabla de propiedades + RPC vectorial cuando hay free-text.
3. `SearchSummarizerService` → Claude resume los matches con pros/cons.

---

## Pipeline de análisis

`AnalysisService` orquesta:

1. Toma una propiedad (por `posting_id` o por barrio).
2. Llama a Claude con el prompt de `prompts/analysis.prompt.ts` (en español, 3 fases: plan de búsqueda → ejecución con `web_search` priorizando GCBA/INDEC/medios consolidados → síntesis).
3. Adjunta las fotos reales para que el modelo describa condición / humedad / iluminación sin inventar.
4. Persiste el informe (`report` JSON + `score` 0–10) y opcionalmente la `visual_description` que luego se embeddea para búsqueda semántica.

`BackfillEmbeddingsService` rellena embeddings de análisis viejos en lotes.

---

## Integración WhatsApp (Kapso)

- Webhook entrante: `apps/web/app/api/kapso/webhook/route.ts`. Verifica firma HMAC con `KAPSO_WEBHOOK_SECRET`, responde 200 rápido y procesa de forma asíncrona.
- Outbound: el sistema arma el primer mensaje a la inmobiliaria con el **tono elegido en el onboarding** (formal / canchero porteño / directo) y los datos del cliente (mascotas, garante, fechas).
- Normaliza teléfonos AR a E.164 (`lib/kapso/phone.ts`).

---

## Scrapers (Python)

- **`scraper/`** — Listado completo de Zonaprop a partir de una URL de búsqueda. Genera CSV en `data/`. Incluye notebook de análisis exploratorio (`analysis/exploratory-analysis.ipynb`) y un script de `migrate_to_supabase.py`.
- **`scraper_propiedad/`** — Ficha pública individual por `posting_id` o URL. Devuelve CSV/JSON normalizado con datos del anunciante (`seller_whatsapp`, `seller_email`, `publisher_url`, etc.) cuando los expone el HTML público.

---

## Variables de entorno

### `apps/web` (`.env.local`)

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (segura en browser; RLS protege) |
| `NEXT_PUBLIC_API_URL` | URL del backend Nest |
| `KAPSO_WEBHOOK_SECRET` | Validación HMAC de webhooks de WhatsApp |

### `apps/api` (`.env`)

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Supabase pooled (puerto 6543, `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Supabase directo (puerto 5432, usado por migraciones) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Cliente anon del backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server. Nunca exponer al browser. |
| `SUPABASE_JWT_SECRET` | Verificación local de JWT en `SupabaseAuthGuard` |
| `PORT` / `CORS_ORIGIN` | Default 4000 / URL del front |

Todas las env se parsean con Zod en boot (`apps/api/src/config/env.schema.ts`). Si falta o es inválida → el server se niega a arrancar.

---

## Setup local

```bash
nvm use            # Node 20 (.nvmrc)
corepack enable    # habilita pnpm
pnpm install

cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example          apps/api/.env
cp apps/web/.env.example          apps/web/.env.local

pnpm db:generate
pnpm db:migrate         # crea migración local (DIRECT_URL)
pnpm dev                # web :3000 + api :4000
```

Aplicar también `supabase-migrations-vectorial-search.sql` en Supabase para habilitar pgvector y crear el RPC.

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Levanta web + api en paralelo |
| `pnpm build` | Build completo (Prisma generate corre auto) |
| `pnpm lint` | ESLint en todos los packages |
| `pnpm typecheck` | `tsc --noEmit` en todo el monorepo |
| `pnpm test` | Jest en los workspaces que tengan tests |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | `prisma migrate dev` (interactivo, solo dev) |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` (CI / release) |
| `pnpm db:studio` | Abre Prisma Studio |
| `pnpm format` | Prettier write |

---

## Deploy

- **Frontend → Vercel** sobre `apps/web`. `vercel.json` en la raíz controla el build; **no** cambiar el Root Directory. `pnpm-lock.yaml` debe estar commiteado (Vercel corre `--frozen-lockfile`).
- **Backend → Railway / Render / Fly** con el `Dockerfile` raíz. Usa `turbo prune --scope=api --docker` para que la imagen contenga solo la api y sus deps. Comando: `node apps/api/dist/main.js`. Migraciones: `pnpm db:migrate:deploy` como release step (nunca `migrate dev` en prod).
