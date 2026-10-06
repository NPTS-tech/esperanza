# Esperanza — Multi-stage production build (Next.js standalone output)
# Runtime DB is SQLite via Prisma 7's libsql driver adapter; the DB file and
# uploaded images live on an EFS mount in prod (DATABASE_URL=file:/efs/prod.db,
# UPLOAD_STORAGE_PATH=/efs/uploads) injected at runtime, not baked in here.

# --- Stage 1: dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts skips the postinstall `prisma generate`; we run it in the builder.
RUN corepack pnpm install --frozen-lockfile --ignore-scripts

# --- Stage 2: build ---
FROM node:22-alpine AS builder
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Only NEXT_PUBLIC_* values are needed at build time (they get inlined).
# Maps use MapLibre + OpenFreeMap (keyless) — no map token required.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN corepack pnpm exec prisma generate \
    && corepack pnpm run build

# --- Stage 3: runner ---
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
