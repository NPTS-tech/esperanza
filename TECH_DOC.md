# Esperanza App — Technical Document

> For a team of 6 developers. June 2026 deadline.

## 1. Cloud Provider Recommendation (Free Tier)

Your best option for **free, self-hosted** development and demo hosting:

### 🏆 Primary: Oracle Cloud Always Free Tier

| Resource | Spec |
|---|---|
| **ARM Compute** | Up to **4 OCPUs + 24 GB RAM** (Ampere A1) |
| **AMD Compute** | 2 VMs × 1/8 OCPU + 1 GB RAM each |
| **Block Storage** | 200 GB total |
| **Duration** | **Forever free** — not a trial |
| **Credit Card** | Required for verification, but **never charged** |
| **Bonus Trial** | $300 credits for 30 days on sign-up |

> [!IMPORTANT]
> Oracle's Always Free ARM instance (**4 OCPU, 24 GB RAM**) is wildly overpowered compared to every other free tier. This is enough to run your entire stack — Next.js app, Postgres, Nginx, and Redis — on a single VM for the entire semester with zero cost.

### Backup Options

| Provider | Credits | Duration | Notes |
|---|---|---|---|
| **DigitalOcean** | $200 | 1 year | Via [GitHub Student Developer Pack](https://education.github.com/pack) |
| **Azure for Students** | $100 | 12 months, renewable | No credit card required, use `.edu` email |
| **AWS Educate** | $100 | varies | Can earn extra $100 via tutorials |
| **Google Cloud** | $300 | 90 days only | Short window, better for burst testing |

**Recommendation**: Sign up for **Oracle Cloud** as your primary host. Have one team member also activate **DigitalOcean** via GitHub Student Pack as a failover.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Oracle Cloud VM                   │
│              (ARM, 4 OCPU, 24GB RAM)                │
│                                                     │
│  ┌───────────┐   ┌──────────┐   ┌───────────────┐  │
│  │   Nginx   │──▶│ Next.js  │   │  PostgreSQL   │  │
│  │  (reverse │   │  (App +  │──▶│  (Database)   │  │
│  │   proxy)  │   │   API)   │   │               │  │
│  └───────────┘   └──────────┘   └───────────────┘  │
│       │                                             │
│       │ HTTPS (Let's Encrypt)                       │
│       ▼                                             │
│  Port 443/80                                        │
└─────────────────────────────────────────────────────┘
         ▲
         │
    ┌────┴────┐
    │ Internet│
    │ (Users) │
    └─────────┘
```

### How This Works (Simple Explanation)

Think of the VM as one computer in the cloud running three programs:

1. **Nginx** — the bouncer at the front door. All web traffic hits Nginx first. It handles HTTPS (via free Let's Encrypt certs) and forwards requests to Next.js.
2. **Next.js** — your actual app. Serves the website, handles API routes (`/api/*`), runs server-side logic.
3. **PostgreSQL** — the database. Stores users, events, demographics, etc. Runs on the same VM but only accessible internally (not exposed to the internet).

All three run inside **Docker containers** on the same VM, managed by **Docker Compose** (one `docker-compose.yml` file starts everything).

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | React-based, SSR + API routes in one project, PWA-ready |
| **Language** | TypeScript | Catch bugs at dev time, LLMs generate better TS |
| **Styling** | Tailwind CSS | Fast UI dev, LLM-friendly, swappable via design tokens |
| **Database** | PostgreSQL 16 | Industry standard, free, robust, handles all your data needs |
| **ORM** | Prisma | Type-safe DB queries, easy migrations, great docs |
| **Auth** | NextAuth.js (Auth.js v5) | JWT-based, email/password credentials provider, role-based access baked in |
| **i18n** | `next-intl` | First-class Next.js App Router support, simple JSON translation files |
| **Map (Events)** | Leaflet + OpenStreetMap | Free, no API key, embedded map for event locations |
| **Navigation** | Link out to Google/Apple Maps | Simple intent URL, zero cost |
| **PWA** | `next-pwa` (or `@serwist/next`) | Adds service worker, installable on iPad home screen |
| **Containerization** | Docker + Docker Compose | Consistent environments for all 6 devs and production |
| **Reverse Proxy** | Nginx | HTTPS termination, static file caching |
| **CI/CD** | GitHub Actions | Auto-deploy on push to `master` |

### Why Not Supabase / Vercel / Auth0?

You asked about self-hosted (Path B). The stack above gives you:
- **Zero vendor lock-in** — everything is open source
- **Zero monthly cost** on Oracle Always Free
- **Full control** over data, which matters for the county handoff
- **One VM** that runs everything (way simpler than managing 3 different SaaS accounts)

If you ever want to migrate to Vercel + Supabase later, the Next.js app is the same — you'd just swap the hosting and DB connection string.

---

## 4. Monorepo Structure

```
esperanza/
├── docker-compose.yml          # starts all services locally and in prod
├── docker-compose.dev.yml      # dev overrides (hot reload, debug ports)
├── Dockerfile                  # production build for Next.js app
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── nginx/
│   └── nginx.conf              # reverse proxy config
├── prisma/
│   ├── schema.prisma           # database schema
│   └── seed.ts                 # seed data for dev
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/           # i18n route group (en/es)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # home / dashboard
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── events/
│   │   │   │   ├── page.tsx        # event list + calendar
│   │   │   │   └── [id]/page.tsx   # event detail + RSVP
│   │   │   ├── services/
│   │   │   ├── resources/
│   │   │   ├── map/
│   │   │   ├── transit/
│   │   │   ├── profile/
│   │   │   ├── admin/              # admin dashboard (protected)
│   │   │   └── provider/           # provider dashboard (protected)
│   │   └── api/                # API routes
│   │       ├── auth/
│   │       ├── events/
│   │       ├── users/
│   │       └── analytics/
│   ├── components/             # shared UI components
│   ├── lib/                    # utility functions, db client, auth config
│   ├── middleware.ts            # auth + locale middleware
│   └── messages/               # i18n translation JSON files
│       ├── en.json
│       └── es.json
├── public/                     # static assets (icons, manifest)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 5. Team Development Workflow

### Local Dev Setup (Per Developer)

Each dev runs the **database** in Docker, but runs Next.js **natively** (way faster hot-reload on macOS):

```bash
# one-time setup
git clone <repo-url>
npm install
cp .env.example .env.local

# start postgres + any other services in docker
docker compose -f docker-compose.dev.yml up -d

# run the app with hot reload
npm run dev
```

> [!NOTE]
> Running Next.js natively (not inside Docker) gives instant hot-reload. Docker on macOS has file system overhead that slows things down. Only Postgres runs in the container.

### Why Not Isolated Docker Containers Per Dev?

You mentioned this — but for a team of 6 on a single app, it adds complexity without benefit:
- Everyone works on the **same** app, just different features
- Docker is used to ensure **Postgres version** is identical across all machines
- The app itself is just `npm run dev` — no container needed for development
- Isolated containers make sense for microservices architecture, which this isn't

### Git Workflow

```
master (production — deploys automatically)
  └── feature/event-calendar     (dev 1)
  └── feature/user-auth          (dev 2)
  └── feature/admin-dashboard    (dev 3)
  └── fix/rsvp-validation        (dev 4)
  └── feature/map-embed          (dev 5)
  └── feature/i18n-spanish       (dev 6)
```

**Rules:**
1. **Never push directly to `master`** — always use PRs
2. Branch naming: `feature/short-description` or `fix/short-description`
3. PRs require **at least 1 approval** before merge
4. `master` auto-deploys to the Oracle VM via GitHub Actions
5. Use **squash merge** to keep history clean

### CI/CD Pipeline (GitHub Actions)

On push to `master`:
1. Run linter (ESLint)
2. Build the Next.js app
3. Build Docker image
4. SSH into Oracle VM → pull new image → restart containers

This is a simple `deploy.yml` file — ~40 lines of YAML. No complex orchestration.

---

## 6. Authentication & Role-Based Access

### Three Roles

| Role | Access | Example Users |
|---|---|---|
| **User** | View events, RSVP, profile, services, map, transit | Neighborhood residents |
| **Provider** | Everything users see + provider analytics dashboard, submit events for review | Social service providers |
| **Admin** | Everything + approve/reject events, manage users, broadcast announcements, full analytics | County data staff, IT team |

### Auth Flow

```
Register → email + password + consent + demographics
  ↓
JWT issued (stored in HTTP-only cookie)
  ↓
Middleware checks role on every request
  ↓
/admin/* routes → admin only
/provider/* routes → provider only
Everything else → any authenticated user
```

### iPad Kiosk Consideration

For iPads in the community center:
- **Auto-timeout** session after 10 minutes of inactivity
- `beforeunload` listener clears session
- PWA runs in **standalone** mode (no browser chrome)
- Consider a "Log out" button prominently placed in the header

---

## 7. Database Schema (Core Tables)

```
users
  ├── id (UUID)
  ├── email
  ├── password_hash
  ├── role (USER | PROVIDER | ADMIN)
  ├── language_pref (en | es)
  ├── created_at
  └── consented_at

demographics (1:1 with users)
  ├── user_id (FK)
  ├── race
  ├── gender
  ├── age (integer, NOT date of birth)
  ├── annual_personal_income
  ├── annual_household_income
  ├── county (dropdown, Dallas County region)
  ├── has_children_under_18 (boolean)
  ├── has_children_under_5 (boolean)
  ├── educational_attainment
  ├── has_personal_vehicle (boolean)
  ├── is_employed (boolean)
  └── industry_area

events
  ├── id
  ├── title_en / title_es
  ├── description_en / description_es
  ├── location_name
  ├── latitude / longitude
  ├── start_time / end_time
  ├── provider_id (FK → users)
  ├── status (PENDING | APPROVED | REJECTED)
  ├── category
  └── created_at

rsvps
  ├── user_id (FK)
  ├── event_id (FK)
  └── created_at

announcements
  ├── id
  ├── title_en / title_es
  ├── body_en / body_es
  ├── author_id (FK → users, admin only)
  ├── target_role (ALL | USER | PROVIDER)
  └── created_at

analytics_events (in-app behavior tracking)
  ├── id
  ├── user_id (FK, nullable for anonymous)
  ├── event_type (SEARCH | PAGE_VIEW | DIRECTION_REQUEST | RSVP)
  ├── metadata (JSONB — search query, page path, etc.)
  └── created_at
```

> [!NOTE]
> Demographics are stored in a **separate table** from users to enforce data segregation. Provider queries can join on `rsvps` to see which demographics signed up for their events, without ever seeing emails or personal identity.

---

## 8. Security Best Practices

| Area | Implementation |
|---|---|
| **Passwords** | bcrypt hashing (12 salt rounds) |
| **Auth tokens** | JWT in HTTP-only, Secure, SameSite cookies (not localStorage) |
| **HTTPS** | Let's Encrypt via Certbot on Nginx (auto-renew) |
| **Database** | Not exposed to internet — only accessible from localhost inside the VM |
| **SQL Injection** | Prisma ORM parameterizes all queries |
| **XSS** | React auto-escapes by default; CSP headers via Nginx |
| **CSRF** | SameSite cookies + CSRF token on mutations |
| **Rate Limiting** | Nginx `limit_req` on `/api/auth/*` endpoints |
| **Env Variables** | `.env` files, never committed — use `.env.example` as template |
| **Secrets in CI** | GitHub Actions encrypted secrets for SSH key + DB password |
| **Data Segregation** | Demographics in separate table, role-based API access |

---

## 9. Domain Name

You don't have one yet. Options:

| Option | Cost | Notes |
|---|---|---|
| **Oracle VM public IP** | Free | Use the raw IP for dev/demo (e.g., `http://129.xxx.xx.xx`) |
| **Free subdomain** (e.g., `esperanza.duckdns.org`) | Free | DuckDNS gives free DDNS, works with Let's Encrypt |
| **`.tech` domain** | Free 1 year | Via GitHub Student Pack |
| **Buy a real domain** | ~$10-15/yr | Namecheap, Cloudflare Registrar |

**Recommendation**: Use **DuckDNS** for a free subdomain during development. Get a proper domain when the county is ready for public launch.

---

## 10. MVP Feature Scope

### Phase 1 — MVP (Target: April 2026)

- [ ] User registration + login (email/password)
- [ ] Demographic intake form (Census-aligned questions)
- [ ] Event listing page (list + calendar view)
- [ ] Event detail page with RSVP
- [ ] Embedded map showing event locations (Leaflet)
- [ ] Link-out navigation to Google/Apple Maps
- [ ] Admin dashboard: approve/reject events
- [ ] Provider dashboard: submit events, view RSVPs
- [ ] Bilingual toggle (English/Spanish)
- [ ] PWA manifest (installable on iPad)
- [ ] Basic in-app behavior tracking (analytics_events table)
- [ ] Role-based access control

### Phase 2 — Post-MVP (May–June 2026)

- [ ] Broadcast announcements (admin → users)
- [ ] Service recommendations based on demographics (e.g., 65+ → senior services)
- [ ] Resources/services directory page
- [ ] Trail information pages
- [ ] DART trip planner iframe embed
- [ ] Provider analytics dashboard (demographic breakdown of RSVPs)
- [ ] iCal export for events
- [ ] iPad kiosk auto-timeout
- [ ] Offline caching (service worker)

---

## 11. Deployment Steps (Once You're Ready)

High-level steps for the Oracle VM setup:

1. Create Oracle Cloud account → provision ARM A1 instance (Ubuntu 22.04)
2. SSH in → install Docker + Docker Compose
3. Clone repo → set up `.env` with production DB credentials
4. Run `docker compose up -d` → starts Nginx, Next.js, Postgres
5. Point DuckDNS subdomain to the VM's public IP
6. Run Certbot for HTTPS on the Nginx container
7. Set up GitHub Actions to auto-deploy on `master` push

Each of these is a 5-10 minute task. The full initial setup is ~1 hour.

---

## 12. Open Questions (For the Team to Decide Later)

| Question | When to Decide |
|---|---|
| Design system (fonts, colors, themes) | Before starting frontend work |
| Which calendar library (FullCalendar, react-big-calendar, etc.) | When building events page |
| Spanish translations: in-house or professional? | Before i18n implementation |
| iPad kiosk security model (guided access, auto-clear cookies) | Before iPad deployment |
| County IT handoff process | After prototype demo |
