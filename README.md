# Esperanza — Community Services App

> A neighborhood-focused resident portal for the Esperanza community, built for the Institute of Urban Studies. Think "patient portal" for community services — residents discover events, navigate to services, and access resources, while providers and county staff track engagement and demographics.

## Quick Start (Local Dev)

```bash
# 1. clone and install
git clone <repo-url>
cd esperanza
npm install

# 2. copy env template
cp .env.example .env

# 3. start postgres in docker
docker compose up -d

# 4. run database migrations and seed
npx prisma migrate dev
npm run db:seed

# 5. run the app (hot reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seed accounts: `admin@esperanza.app` / `admin123`, `provider@esperanza.app` / `provider123`, `user@esperanza.app` / `user123`

## Architecture

- **Nginx** — reverse proxy, HTTPS termination, rate limiting, security headers
- **Next.js** — full-stack app (React frontend + API routes as backend)
- **PostgreSQL** — stores users, demographics, events, RSVPs, analytics

All services run in Docker containers managed by Docker Compose.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix + Tailwind) |
| Icons | Lucide React |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) — JWT, HTTP-only cookies |
| i18n | next-intl (English / Spanish) |
| Maps | Leaflet + OpenStreetMap |
| PWA | @serwist/next |
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |

## User Roles

| Role | Access |
|---|---|
| **User** | View events, RSVP, profile, services, map, transit |
| **Provider** | User access + provider analytics, submit events for review |
| **Admin** | Full access + approve/reject events, manage users, announcements, full analytics |

## Privacy Model

- Demographics (race, age, income) stored in a **separate table** from user identity
- Providers see aggregate demographic data for their events — never emails or names
- In-app behavior (searches, page views, direction requests) tracked anonymously
- Only individual social service providers know a user's personal information
- All auth tokens in HTTP-only cookies (not localStorage)

## Project Structure

```
esperanza/
├── docker-compose.yml          # dev (default): postgres only
├── docker-compose.prod.yml     # production: postgres + next.js + nginx
├── Dockerfile                  # multi-stage production build
├── nginx/
│   ├── Dockerfile              # prod reverse proxy (TLS templates + entrypoint)
│   ├── nginx.http.conf         # HTTP until Let's Encrypt certs exist
│   ├── nginx.https.conf        # HTTPS + redirect once certs exist
│   └── nginx.conf              # reference copy (not used by prod compose)
├── prisma/
│   ├── schema.prisma           # database schema
│   ├── migrations/             # SQL migration history
│   └── seed.ts                 # dev seed data (admin, provider, user)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # i18n route group (en/es)
│   │   │   ├── auth/           # login, register
│   │   │   ├── events/         # event list, detail, RSVP
│   │   │   ├── services/       # service directory
│   │   │   ├── map/            # embedded map
│   │   │   ├── admin/          # admin dashboard (protected)
│   │   │   └── provider/       # provider dashboard (protected)
│   │   └── api/                # API routes (the backend)
│   │       ├── auth/
│   │       ├── events/
│   │       ├── users/
│   │       └── analytics/
│   ├── components/             # shared UI components
│   ├── lib/                    # utilities, db client, auth config
│   │   ├── dal/                # data access layer (Prisma queries)
│   │   └── validators/         # Zod input validation schemas
│   ├── middleware.ts            # auth + locale + role gating
│   └── messages/               # i18n JSON files (en.json, es.json)
├── public/                     # static assets, PWA manifest
├── mock/                       # reference MVP (not used in prod)
├── .env.example                # env variable template
├── .dockerignore
├── package.json
└── tsconfig.json
```

## Docker Commands

```bash
# --- Local Development (default) ---
docker compose up -d                                          # start postgres
docker compose down                                           # stop postgres
docker compose logs -f                                        # view logs

# --- Production (requires -f flag) ---
docker compose -f docker-compose.prod.yml up -d --build       # build and start everything
docker compose -f docker-compose.prod.yml down                # stop everything
docker compose -f docker-compose.prod.yml logs -f             # view logs
docker compose -f docker-compose.prod.yml exec postgres psql -U esperanza  # connect to DB
```

## Localization (i18n)
Esperanza uses `next-intl` for App-Router translations via the `[locale]` dynamic routing segment.
- String dictionaries are stored centrally in `translations/en.json` and `translations/es.json`.
- When adding new UI text, **do not hardcode strings**.
- Add your strings under a logical namespace (e.g., `"Profile": { "title": "My Profile" }`) in both JSON files.
- In **Client Components**, use `useTranslations("Namespace")`.
- In **Server Components**, use `await getTranslations("Namespace")`.
- Route navigation (`Link`, `useRouter`, `usePathname`, `redirect`) should always be imported from `@/i18n/routing` to ensure seamless prefix handling.

## Security

| Area | How |
|---|---|
| Passwords | bcrypt (12 salt rounds) |
| Auth tokens | JWT in HTTP-only, Secure, SameSite cookies |
| HTTPS | Let's Encrypt via Certbot on Nginx |
| Database | Internal Docker network only (not exposed to internet) |
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escaping + CSP headers via Nginx |
| Rate Limiting | Nginx: 10r/s on auth endpoints, 30r/s on general API |
| Input Validation | Zod schemas on all API routes |
| Data Segregation | Demographics in separate table, role-based DAL |