# team-18 — Platanus Hack 26: Buenos Aires

<img src="./project-logo.png" alt="Project Logo" width="200" />

Track: Vertical AI

- Agustín Azorin ([@AgustinAzorin](https://github.com/AgustinAzorin))
- Ezequiel Bourlot ([@eze2508](https://github.com/eze2508))
- Juan Montilla ([@Monti3](https://github.com/Monti3))

---

## Stack

- **Turborepo** + **pnpm** workspaces
- **Next.js 15** (App Router) → Vercel — `apps/web`
- **NestJS 11** → Railway / Render / Fly — `apps/api`
- **Prisma 6** ORM against **Supabase** Postgres — `packages/database`
- **Supabase** for Auth (JWT), Postgres, Storage
- **Zod** schemas shared between front and back via `packages/types`
- TypeScript strict everywhere

## Layout

```
apps/
  web/          Next.js (App Router). Talks to Supabase (auth, RLS reads) and the Nest API (writes / business logic).
  api/          NestJS. Owns Prisma. Validates Supabase JWTs via SupabaseAuthGuard.
packages/
  database/     prisma/schema.prisma + the PrismaClient export. Single source of truth for the DB.
  types/        Zod schemas + inferred TS types shared by web and api.
  tsconfig/     base.json, nextjs.json, nestjs.json.
  eslint-config/  index.js, nextjs.js, nestjs.js.
```

## Local setup

```bash
# 1. install
nvm use            # picks up .nvmrc (Node 20)
corepack enable    # enables pnpm
pnpm install

# 2. env files (copy and fill in real values)
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example          apps/api/.env
cp apps/web/.env.example          apps/web/.env.local

# 3. generate Prisma client + run migrations
pnpm db:generate
pnpm db:migrate         # creates a migration locally; uses DIRECT_URL

# 4. dev
pnpm dev                # boots web (3000) and api (4000) together
```

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all `dev` tasks (web + api) in parallel |
| `pnpm build` | Build everything (Prisma generate runs automatically) |
| `pnpm lint` | ESLint across all packages |
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm test` | Run jest in workspaces that have tests |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | `prisma migrate dev` (interactive, dev only) |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` (CI / release step) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm format` | Prettier write |

## Environment variables

### `apps/web` (`.env.local`)
| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe in browser; RLS protects) |
| `NEXT_PUBLIC_API_URL` | URL of the Nest backend |

### `apps/api` (`.env`)
| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Supabase URL, port **6543**, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct Supabase URL, port **5432** (used by migrations) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key. Never expose to the browser. |
| `SUPABASE_JWT_SECRET` | Used by `SupabaseAuthGuard` to verify access tokens locally |
| `PORT` | Default `4000` |
| `CORS_ORIGIN` | URL of the frontend (e.g. `http://localhost:3000`) |

All env is parsed with Zod at boot (`apps/api/src/config/env.schema.ts`). Missing or invalid values → server refuses to start.

## Auth flow

1. The browser uses `@supabase/ssr` (`apps/web/lib/supabase/{client,server}.ts`) to sign in. Sessions live in cookies.
2. Server Components read the session with `createClient()` (server flavor) and grab `session.access_token`.
3. The frontend calls the Nest API with `Authorization: Bearer <jwt>` (see `lib/api-client.ts`).
4. `SupabaseAuthGuard` (`apps/api/src/common/guards/supabase-auth.guard.ts`) verifies the JWT signature against `SUPABASE_JWT_SECRET` — no network round-trip — and attaches `request.user`.
5. Controllers consume the user via `@CurrentUser()`.

The frontend never imports Prisma. Prisma lives only in `apps/api`.

## Adding a new feature (Nest)

For a feature `orders/` under `apps/api/src/modules/`, create:

```
modules/orders/
├── orders.module.ts        # @Module — declares controllers, providers, exports
├── orders.controller.ts    # @Controller('orders'), @Get, @Post, etc.
├── orders.service.ts       # business logic
├── orders.repository.ts    # Prisma access (only place that touches PrismaService)
├── orders.model.ts         # domain types + toApi() mapper
└── dto/
    ├── create-order.dto.ts # extends createZodDto(CreateOrderSchema)
    └── update-order.dto.ts
```

1. Add the Zod schema to `packages/types/src/orders.ts` and export it from `packages/types/src/index.ts`.
2. (Optional) Add the Prisma model to `packages/database/prisma/schema.prisma`, then `pnpm db:migrate`.
3. Wire `OrdersModule` into `apps/api/src/app.module.ts`.

The flow is **Controller → Service → Repository → Prisma**. Controllers only do HTTP shape + validation, services own logic, repositories are the only place Prisma is called from.

There's no `route/` folder — in Nest, routing lives on the controller's decorators. The `*.module.ts` is the conceptual equivalent: it's where routes "register" by declaring their controller.

## Deploy

### Frontend → Vercel (`apps/web`)
- **Root Directory**: `apps/web`
- **Build Command**: `cd ../.. && pnpm turbo build --filter=web`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next` (auto-detected)
- Set `NEXT_PUBLIC_*` env vars in the Vercel dashboard.

### Backend → Railway / Render / Fly (`apps/api`)
- Use the root `Dockerfile`. It runs `turbo prune --scope=api --docker` so the image only contains the api workspace and its transitive deps.
- Build: `docker build -t api .`
- Start: `node apps/api/dist/main.js` (already the Dockerfile's `CMD`)
- Set all `apps/api` env vars in the platform's secrets UI.
- **Migrations**: run `pnpm db:migrate:deploy` as a release step (Railway: pre-deploy command; Render: pre-deploy command; Fly: release_command). Do **not** run `prisma migrate dev` in production.

## Conventions

- TS strict, no `any` unless justified with a comment explaining why.
- DTOs always validate input with Zod via `nestjs-zod` (`createZodDto(Schema)`).
- Repositories don't return raw Prisma rows past the service boundary — `toApi()` maps to the wire shape.
- Keep auth out of services. The guard is cross-cutting.
- New env vars must be added to the Zod schema in `apps/api/src/config/env.schema.ts` (or `apps/web/lib/env.ts`) **and** to the matching `.env.example`.
