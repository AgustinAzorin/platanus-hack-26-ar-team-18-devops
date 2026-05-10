# syntax=docker/dockerfile:1.7
# Multi-stage build for apps/api using `turbo prune` so the image only ships
# the api workspace + its transitive deps.

ARG NODE_VERSION=20.18.0

# ---------- 1. Prune the monorepo down to the api scope ----------
FROM node:${NODE_VERSION}-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /repo

RUN corepack enable

COPY . .
RUN corepack prepare pnpm@9.12.3 --activate
RUN pnpm dlx turbo@2.3.3 prune --scope=api --docker

# ---------- 2. Install dependencies for the pruned workspace ----------
FROM node:${NODE_VERSION}-alpine AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

# Lockfile + manifest layer (cached)
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Ensure node-linker=hoisted from .npmrc is respected during install
COPY --from=pruner /repo/.npmrc ./.npmrc
RUN pnpm install --frozen-lockfile

# Source layer + Prisma generate + build
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @repo/types run build
RUN pnpm --filter @repo/database run db:generate
RUN pnpm --filter @repo/database run build
RUN pnpm --filter api run build

# ---------- 3. Runtime image ----------
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat openssl tini
# Keep WORKDIR at /repo so pnpm hoisted symlinks (node_modules/@repo/*)
# continue to resolve correctly — they were created relative to /repo.
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=installer --chown=nestjs:nodejs /repo/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /repo/apps/api/dist ./apps/api/dist
COPY --from=installer --chown=nestjs:nodejs /repo/apps/api/package.json ./apps/api/package.json
COPY --from=installer --chown=nestjs:nodejs /repo/packages ./packages
COPY --from=installer --chown=nestjs:nodejs /repo/package.json ./package.json

EXPOSE 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
