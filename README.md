# Esperanza — Community Services App

> A neighborhood-focused resident portal for the Esperanza community, built for the Institute of Urban Studies. Think "patient portal" for community services — residents discover events, navigate to services, and access resources, while providers and county staff track engagement and demographics.

## Quick Start (Local Dev)

Local dev uses a **nix flake** (Node + pnpm + the Prisma schema engine for NixOS). With [direnv](https://direnv.net) you can `direnv allow`; otherwise run everything inside `nix develop`.

```bash
# 1. clone + enter the dev shell
git clone <repo-url>
cd esperanza
nix develop            # or: direnv allow

# 2. env: copy the template and add your Geoapify key (see Maps below)
cp .env.example .env

# 3. install deps (pnpm)
pnpm install

# 4. create the local SQLite db + seed it
pnpm exec prisma migrate dev
pnpm run db:seed

# 5. run the app (hot reload)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The database is a local **SQLite file** (`prisma/dev.db`) — no database server to run. Translation is optional; start a local LibreTranslate with `docker compose up -d libretranslate` if you want it.

Seed accounts: `admin@esperanza.app` / `admin123`, `provider@esperanza.app` / `provider123`, `user@esperanza.app` / `user123` (plus `resident01…30@esperanza.app` / `user123`).

> **Not on NixOS?** The app itself runs anywhere with Node 22 + pnpm; the flake just wires up Prisma's schema engine for NixOS. On other systems, `pnpm install && pnpm exec prisma migrate dev && pnpm dev` is enough.

## Deployment

Esperanza deploys to the shared **NPTS AWS infrastructure** (`NPTS-tech/infra`) — ECS on EC2, behind a shared ALB, with the SQLite file and uploaded images on EFS. Pushing to the `stage` / `prod` branches triggers the CI pipeline (build → migrate via Lambda → push to ECR → ECS deploy).

See [`MIGRATION_TO_NPTS_INFRA.md`](./MIGRATION_TO_NPTS_INFRA.md) for the full deployment runbook.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), standalone output |
| Language | TypeScript |
| Package manager | pnpm 11 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Database | SQLite (file on EFS in prod) |
| ORM | Prisma 7 via the libsql driver adapter |
| Auth | Better Auth (email/password, DB-backed sessions, HTTP-only cookies) |
| i18n | next-intl (English / Spanish) |
| Maps | MapLibre GL + OpenFreeMap tiles (keyless) |
| Geocoding | Geoapify autocomplete (region-scoped), keyless Photon fallback |
| Image uploads | Local filesystem / EFS (`UPLOAD_STORAGE_PATH`) |
| Dev env | Nix flake + direnv |
| Deploy | AWS ECS on NPTS infra (Docker image → ECR), GitHub Actions |

## User Roles

| Role | Access |
|---|---|
| **User** | View events, RSVP, profile, services, map |
| **Provider** | User access + submit events for review, provider analytics |
| **Admin** | Full access + approve/reject events, manage users, announcements, full analytics |

## Privacy Model

- Demographics (race, age, income) stored in a **separate table** from user identity
- Providers see aggregate demographic data for their events — never emails or names
- In-app behavior (searches, page views, direction requests) tracked anonymously
- Only individual social service providers know a user's personal information
- Auth sessions in HTTP-only cookies (not localStorage)

## Project Structure

```
esperanza/
├── flake.nix / .envrc          # nix dev shell (node + pnpm + prisma engine)
├── docker-compose.yml          # optional LibreTranslate for local translation
├── Dockerfile                  # multi-stage production build (standalone)
├── prisma/
│   ├── schema.prisma           # database schema (SQLite)
│   ├── migrations/             # SQL migration history
│   └── seed.ts                 # dev seed data
├── prisma.config.ts            # Prisma 7 config (migrate datasource URL)
├── src/
│   ├── app/
│   │   ├── [locale]/           # i18n route group (en/es)
│   │   │   ├── auth/           # login, register
│   │   │   ├── (app)/          # events, map, profile, admin, provider, …
│   │   └── api/                # API routes (auth, events, users, uploads, …)
│   ├── components/             # shared UI (maps, forms, calendar, …)
│   ├── lib/                    # db client, auth, geocode, map, uploads, validators
│   ├── generated/prisma/       # generated Prisma client (gitignored)
│   └── middleware.ts           # auth presence + locale routing (edge-safe)
├── translations/               # i18n JSON (en.json, es.json)
├── public/                     # static assets, PWA manifest + service worker
├── .github/workflows/          # NPTS CI (deploy.yml + prod.yml/stage.yml)
├── MIGRATION_TO_NPTS_INFRA.md  # deployment runbook
└── .env.example                # env variable template
```

## Maps & Geocoding

- **Tiles/rendering:** MapLibre GL with OpenFreeMap — free and keyless, nothing to configure.
- **Address autocomplete:** Geoapify. Create a free key at [myprojects.geoapify.com](https://myprojects.geoapify.com), restrict it to your origins, and set `NEXT_PUBLIC_GEOAPIFY_KEY` in `.env`. Results are hard-scoped to the DFW metroplex (`NEXT_PUBLIC_GEOCODE_BBOX` to widen). Without a key it falls back to the keyless public Photon instance (slower).

## Localization (i18n)

Esperanza uses `next-intl` for App-Router translations via the `[locale]` routing segment.
- String dictionaries live in `translations/en.json` and `translations/es.json`.
- Don't hardcode UI strings — add them under a namespace (e.g. `"Profile": { "title": "My Profile" }`) in **both** files.
- Client components: `useTranslations("Namespace")`. Server components: `await getTranslations("Namespace")`.
- Import navigation (`Link`, `useRouter`, `usePathname`, `redirect`) from `@/i18n/routing` for correct locale prefixing.

## Security

| Area | How |
|---|---|
| Passwords | Better Auth (scrypt), stored on the credential account row |
| Sessions | Better Auth, HTTP-only / Secure / SameSite cookies |
| HTTPS | Terminated at the NPTS ALB |
| Database | SQLite file on EFS — not network-exposed |
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escaping |
| Input Validation | Zod schemas on API routes |
| Authorization | Edge middleware (auth presence) + `requireRole()` guards on protected pages |
| Data Segregation | Demographics in a separate table from identity |
