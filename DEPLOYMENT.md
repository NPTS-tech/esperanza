# Esperanza — Deployment & Handoff Guide

This document is the practical handoff guide for the Esperanza app. It covers the external services the app depends on, every environment variable the app expects, how to run the stack locally with Docker, how to deploy the app to a VM with Docker Compose, and what to consider for the next stage of production hosting.

If you are taking the project over, read sections 1–4 first. They cover everything needed to run the app locally and to stand up a deployment. Sections 5–6 cover handoff logistics and future direction.

---

## 1. Architecture Overview

The app is a single Next.js application backed by Postgres, with a few supporting services. The repo ships two Docker Compose files:

| File                      | Use                  | What it starts                                             |
| ------------------------- | -------------------- | ---------------------------------------------------------- |
| `docker-compose.yml`      | Local development    | Postgres + LibreTranslate only. Devs run Next.js natively. |
| `docker-compose.prod.yml` | Single-VM deployment | Postgres + LibreTranslate + Next.js app + Nginx + Certbot. |

### The production stack (`docker-compose.prod.yml`)

Five containers on a private bridge network:

1. **postgres** — PostgreSQL 16, data persisted in the `postgres_data` Docker volume.
2. **libretranslate** — self-hosted translation service, loads only `en` and `es` models.
3. **app** — the Next.js application (built from the repo's `Dockerfile`).
4. **nginx** — reverse proxy, TLS termination, basic rate limiting.
5. **certbot** — long-running cert renewal loop.

The `app` container is the only place application code runs. Nginx is the only container exposed to the internet (ports 80 and 443). Postgres and LibreTranslate are reachable only inside the Docker network.

### CI/CD

The repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that SSHes into a target VM on every push to `main` and runs:

```bash
cd ~/Esperanza
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T app prisma migrate deploy
docker image prune -f
```

To use it, configure these repo secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret       | Purpose                                 |
| ------------ | --------------------------------------- |
| `VM_HOST`    | Public IP or hostname of the VM         |
| `VM_USER`    | SSH user on the VM (typically `ubuntu`) |
| `VM_SSH_KEY` | Private SSH key authorized on the VM    |

---

## 2. External Services

The app depends on the following external services. Each requires its own account, dashboard, and key(s). The new team should create or take over each one.

### 2.1 Mapbox

- **What it does:** address autocomplete and the location picker in the event creation form. Used by `src/components/location_picker.tsx`, `src/components/event_map.tsx`, `src/components/map_view.tsx`, `src/components/event_form.tsx`.
- **Account:** [https://account.mapbox.com](https://account.mapbox.com)
- **Key needed:** a public access token
- **Required scopes:** `styles:read`, `geocoding:read`
- **Recommendation:** add URL restrictions in the Mapbox dashboard so the token can only be used from the production domain.
- **Env var:** `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Pricing:** free tier covers low traffic. Mapbox bills per-request above the free tier — monitor the usage dashboard if traffic grows.

### 2.2 Supabase Storage

- **What it does:** stores uploaded event images. Used by `src/app/api/uploads/event-image/route.ts` via `src/lib/supabase_admin.ts`.
- **Why Supabase:** only the Storage product is used — not Supabase Auth, not Supabase Postgres. The app's own Postgres holds all relational data.
- **Account:** [https://supabase.com](https://supabase.com)
- **Setup:**
  1. Create a Supabase project.
  2. Create a public storage bucket (default name `event-images`).
  3. Copy the project URL and the **service role key** (not the anon key).
- **Env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET` (defaults to `event-images`)
- **Security note:** the service role key is privileged. It must only exist in the server-side env, never in client code. Do not commit it.

### 2.3 LibreTranslate (self-hosted)

- **What it does:** translates event titles and descriptions between English and Spanish. Used by `src/lib/services/translation.ts`.
- **Hosting model:** runs as a container in the same Docker Compose stack as the app. There is no external account — it pulls the public `libretranslate/libretranslate:latest` image and downloads the en/es language models on first start.
- **Env var:** `TRANSLATION_BASE_URL` (set to `http://libretranslate:5000` inside the compose network)
- **Contract used by the app:** `POST /translate` with body `{q, source, target, format}`, expecting `{translatedText}` in the response.
- **Trade-off:** zero ongoing cost and full control, but quality is lower than commercial services and a fresh container takes a minute or two to download models. See section 6 for a recommended upgrade path.

### 2.4 Domain (DuckDNS or alternative)

- **What it does:** provides the public hostname pointed at the VM's IP. Used in `LETSENCRYPT_DOMAIN` and `NEXT_PUBLIC_APP_URL`.
- **Free option:** [https://duckdns.org](https://duckdns.org) — create a subdomain and point it at the VM's public IP. DuckDNS works fine with Let's Encrypt.
- **Trade-off:** free and good for early-stage hosting, but not a long-term identity for a county-facing app. See section 6.

### 2.5 Let's Encrypt

- **What it does:** issues the TLS certificate served by Nginx. Renewed automatically by the `certbot` container every 12 hours.
- **No account needed.** The initial certificate must be bootstrapped manually the first time the VM comes up — see section 4.4.

### 2.6 VM host (Oracle Cloud or alternative)

- **What it does:** runs the entire Docker stack on a single Linux VM.
- **Note:** all persistent state (Postgres data, Let's Encrypt certs) lives in Docker volumes on the VM. If the VM is destroyed without a database backup, the data is gone.

### 2.7 GitHub

- **Repo and CI/CD.** The deploy workflow lives in `.github/workflows/deploy.yml`. Pushes to `main` deploy automatically once the secrets in section 1 are configured.

---

## 3. Environment Variables

The app reads from a single `.env` file. The same file is used by Docker Compose (variable substitution in YAML) and by Next.js and Prisma at runtime. The complete template lives in `.env.example`.

Every variable below is required unless marked **optional**.

### 3.1 PostgreSQL (used by docker-compose to initialize the container)

| Variable            | Example             | Notes                                                     |
| ------------------- | ------------------- | --------------------------------------------------------- |
| `POSTGRES_USER`     | `esperanza`         | DB role created at container init                         |
| `POSTGRES_PASSWORD` | `<strong password>` | Set a strong value in production; this is the DB password |
| `POSTGRES_DB`       | `esperanza`         | Initial database name                                     |

These three are used both to initialize the Postgres container and to construct `DATABASE_URL` for the app container.

### 3.2 Database connection (used by Prisma at runtime)

| Variable       | Example                                              | Notes                                                                                            |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | `postgresql://esperanza:...@postgres:5432/esperanza` | In production the host is `postgres` (the compose service name). In local dev it is `localhost`. |

### 3.3 Auth.js (NextAuth v5)

| Variable      | How to generate           | Notes                                                                                                                                                                                   |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET` | `openssl rand -base64 32` | Used to sign JWTs. Anyone with this can forge sessions — keep it private and generate a fresh one for every environment. Paste only the secret value; do not include the variable name. |

`NEXTAUTH_URL` is intentionally **not set**. The app uses `trustHost: true` so Auth.js reads the request `Host` header, which works for both `localhost` and a deployed domain.

### 3.4 Mapbox

| Variable                   | Notes                                                                    |
| -------------------------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Public Mapbox access token. Embedded in the client bundle at build time. |

Because this is `NEXT_PUBLIC_*`, it is baked into the build. The production Docker build receives it as a `--build-arg` in `docker-compose.prod.yml`. Changing it requires a rebuild, not just a restart.

### 3.5 Supabase Storage

| Variable                    | Notes                                                                     |
| --------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Project URL, e.g. `https://abcdefg.supabase.co/`. Embedded at build time. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side key. Never exposed to the client.                  |
| `SUPABASE_STORAGE_BUCKET`   | Bucket name. Defaults to `event-images` if unset.                         |

### 3.6 Translation

| Variable                 | Notes                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `TRANSLATION_BASE_URL`   | In production: `http://libretranslate:5000`. In local dev: `http://localhost:5001`. |
| `TRANSLATION_TIMEOUT_MS` | Per-request timeout. Defaults to `3000` (3s) if unset.                              |

### 3.7 App URL

| Variable              | Notes                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Public site URL with scheme, e.g. `https://esperanza.duckdns.org`. Used for ICS calendar links and embedded into the build. |
| `NODE_ENV`            | `production` in prod, `development` locally. Docker Compose sets it for you in prod; in local dev it is set by `next dev`.  |

### 3.8 Nginx + Let's Encrypt (production only)

| Variable             | Notes                                                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LETSENCRYPT_DOMAIN` | The hostname **without** `https://`, e.g. `esperanza.duckdns.org`. Must match the hostname in `NEXT_PUBLIC_APP_URL`. Nginx fails to start if this is unset. |

### 3.9 Optional flags

| Variable                     | Notes                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DISABLE_PWA_SW` | Optional. Disables the PWA service worker when set. Useful for debugging caching issues. |

---

## 4. Running the App

### 4.1 Local development

The dev compose file (`docker-compose.yml`) runs Postgres and LibreTranslate in containers. Next.js runs on the host with `npm run dev` for fast hot reload.

```bash
# 1. clone and install deps
git clone <repo-url>
cd Esperanza
npm install

# 2. copy env template and fill in real values
cp .env.example .env
#   - set NEXT_PUBLIC_MAPBOX_TOKEN
#   - set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
#   - generate AUTH_SECRET: openssl rand -base64 32
#   - leave DATABASE_URL pointing at localhost
#   - leave TRANSLATION_BASE_URL pointing at http://localhost:5001

# 3. start postgres + libretranslate
docker compose up -d

# 4. apply migrations and seed sample data
npx prisma migrate dev
npm run db:seed

# 5. run the app with hot reload
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seed accounts** (all created by `prisma/seed.ts`):

- `admin@esperanza.app` / `admin123`
- `provider@esperanza.app` / `provider123`
- `user@esperanza.app` / `user123`

### 4.2 Common local commands

```bash
# Stop everything
docker compose down

# View postgres / libretranslate logs
docker compose logs -f

# Connect to the local Postgres
docker compose exec postgres psql -U esperanza

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Reset the local database completely
npx prisma migrate reset
```

### 4.3 Deploying changes (after CI/CD is set up)

Once a VM is provisioned (section 4.4) and the GitHub Actions secrets are configured (section 1), deploys are automatic:

```bash
git push origin main
# Watch progress at: github.com/<org>/Esperanza/actions
```

The workflow SSHes into the VM, pulls `main`, rebuilds the app image, restarts changed containers, and applies any new Prisma migrations. The Postgres volume is not touched, so data persists across deploys.

### 4.4 First-time VM setup

When provisioning a fresh VM, the steps are:

1. **Provision the VM** (Ubuntu 22.04 or newer recommended) and open ports `22`, `80`, `443` in the cloud firewall.
2. **Install Docker and Docker Compose** on the VM.
3. **Create a domain** (e.g. a DuckDNS subdomain) and point it at the VM's public IP. Wait for DNS to propagate.
4. **Clone the repo** to `~/Esperanza` on the VM.
5. **Create `.env`** with production values. Generate a fresh `AUTH_SECRET`. Set `LETSENCRYPT_DOMAIN` to the domain. Set `NEXT_PUBLIC_APP_URL` to `https://<that domain>`.
6. **Bring up the stack the first time:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   On first start, Nginx serves plain HTTP because no certs exist yet — that is expected.
7. **Apply migrations and seed:**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T app prisma migrate deploy
   docker compose -f docker-compose.prod.yml exec -T app tsx prisma/seed.ts
   ```
8. **Issue the first TLS certificate** using the Certbot container against the running Nginx (HTTP-01 challenge):
   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot -w /var/www/certbot \
     -d <your-domain> \
     --email <admin-email> --agree-tos --no-eff-email
   ```
9. **Restart Nginx** so it picks up the new certs and switches to the HTTPS config:
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```
10. **Add the deploy secrets** to GitHub Actions (see section 1) so future pushes deploy automatically.

The Certbot container then handles renewals automatically. After a renewal you can reload Nginx with:

```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 4.5 Common production operations

All run on the VM, from `~/Esperanza`.

```bash
# Tail logs across all services
docker compose -f docker-compose.prod.yml logs -f

# Tail logs for just the app
docker compose -f docker-compose.prod.yml logs -f app

# Connect to the production Postgres
docker compose -f docker-compose.prod.yml exec postgres psql -U esperanza

# Apply any pending migrations (the deploy workflow does this automatically)
docker compose -f docker-compose.prod.yml exec -T app prisma migrate deploy

# Re-seed (only if intentionally wiping data)
docker compose -f docker-compose.prod.yml exec -T app tsx prisma/seed.ts

# Restart just the app container (after an env change that doesn't need a rebuild)
docker compose -f docker-compose.prod.yml restart app

# Full stack down / up (rare)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### 4.6 Backups

`docker-compose.prod.yml` does not include any backup automation. Before the app sees real traffic, a scheduled backup job should be added. To take a manual snapshot of the database:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U esperanza esperanza > esperanza-$(date +%Y%m%d).sql
```

Copy the dump file off the VM (e.g. `scp`) and store it somewhere safe.

---

## 5. Handoff Checklist

When transferring the project to a new team, work through this list:

- [ ] Transfer or invite the new team to the **GitHub repo**.
- [ ] Issue a new **Mapbox token** under the new team's Mapbox account; the old token can then be revoked.
- [ ] Transfer or invite the new team to the **Supabase project**, or migrate to a fresh Supabase project owned by the new team.
- [ ] Decide on a **hosting target** (see section 6) and provision it under the new team's accounts.
- [ ] Decide on a **domain** and point DNS at the new host.
- [ ] Generate a fresh **`AUTH_SECRET`** for the new environment.
- [ ] Choose a strong **`POSTGRES_PASSWORD`** for the new environment.
- [ ] Configure GitHub Actions secrets (`VM_HOST`, `VM_USER`, `VM_SSH_KEY`) if using the Docker Compose / VM path.
- [ ] Confirm the new team can **deploy successfully** by making a trivial change to `main` and watching the workflow run.

---

## 6. Future Production Direction

The Docker Compose / single-VM model documented above is a workable starting point, but for a county-facing production system the recommended direction is to move toward managed services. None of this is required to stand the app back up, but it should guide the next stage of the project.

### 6.1 Recommended production target

- **Application hosting:** Render (managed Web Service)
- **Database:** managed Postgres with backups and recovery (Render Postgres or Supabase Postgres)
- **Translation service:** Google Cloud Translation Advanced (replacing self-hosted LibreTranslate)
- **Domain:** county-managed domain or subdomain (replacing DuckDNS)
- **Retained:** Supabase Storage and Mapbox

The current Docker-based architecture is compatible with Render because:

- the repo already includes a production Dockerfile
- the app is packaged as a standalone Next.js Node server
- Prisma is already used in the runtime architecture
- the deployment model is server-oriented and Docker-friendly

Render supports Docker deployment, long-running web services, managed Postgres, custom domains, and managed TLS — so moving to it does not require restructuring the application.

### 6.2 Deployment options, ranked

#### Option A (recommended): managed hosting

- Render Web Service for the Next.js app
- Render Postgres or Supabase Postgres for the database
- Google Cloud Translation Advanced for translation
- County-managed domain
- Supabase Storage and Mapbox retained

**Why:** removes manual infrastructure burden (no Nginx/Certbot/VM patching), provides managed DB backups and recovery, and gives a more supportable operational story for a county-facing system.

#### Option B (fallback): single VM with Docker Compose

This is the path documented in section 4. Best if a production cutover must happen quickly with minimal architectural change. The operational burden — Postgres backups, Nginx and Certbot management, VM patching, monitoring, incident response — stays with the operating team.

#### Option C (last resort): VM for app + Nginx, managed Postgres only

Improves only the database story. The rest of the operational burden remains (VM, Nginx, certs, patching). Creates a split architecture without eliminating enough operations work. Only reasonable as a transition step.

### 6.3 Translation: moving off LibreTranslate

The app currently expects a LibreTranslate-compatible HTTP contract:

- `POST /translate` with body `{q, source, target, format}`
- response containing `{translatedText}`

This is wired through the `TRANSLATION_BASE_URL` env var and implemented in `src/lib/services/translation.ts`. For county production, replace LibreTranslate with **Google Cloud Translation Advanced**:

- purpose-built for translation workflows
- stronger reliability than a self-hosted service
- better support and operational story
- better fit for bilingual event-content workflows

This requires a small adapter in `src/lib/services/translation.ts` to call the Google API instead of the LibreTranslate HTTP contract. The rest of the app calls `translateText()` and does not need to change.

### 6.4 Database: moving to managed Postgres

For county production, prefer a managed Postgres provider over a self-hosted Postgres container. Managed providers give backups, point-in-time recovery, and lower operational overhead. Two natural choices:

- **Render Postgres** — keeps app and DB on the same platform.
- **Supabase Postgres** — consolidates database and storage under the existing Supabase vendor relationship.

Switching is a `DATABASE_URL` change plus a one-time data migration (`pg_dump` from the source DB, `psql` into the new managed DB).

### 6.5 Domain: moving off DuckDNS

DuckDNS is acceptable for early-stage hosting but not for a county production identity. Prefer a county-managed domain or subdomain. If that is not available, a purchased domain (around $10–15/year) is a reasonable fallback. A real domain also makes Let's Encrypt issuance and renewal simpler regardless of which hosting option is chosen.

### 6.6 Final recommended direction

If the goal is a real county production deployment, **Option A** should be the first choice: a **Render-first managed deployment** with managed Postgres, a real domain, and a production-grade translation provider. Option B remains the fallback because it is the closest path to what the repo is already set up for. Option C is least preferred because it splits the architecture without removing enough operational burden.

---

## 7. Repository Layout (for quick orientation)

```
Esperanza/
├── docker-compose.yml          # dev: postgres + libretranslate
├── docker-compose.prod.yml     # prod: + nextjs app + nginx + certbot
├── Dockerfile                  # multi-stage build for the app
├── nginx/
│   ├── Dockerfile              # nginx image with TLS-aware entrypoint
│   ├── docker-entrypoint.sh    # picks http vs https config based on cert presence
│   ├── nginx.http.conf         # served before Let's Encrypt certs exist
│   └── nginx.https.conf        # served once certs are issued
├── prisma/
│   ├── schema.prisma           # database schema
│   ├── migrations/             # migration history
│   └── seed.ts                 # seed accounts + sample events
├── src/
│   ├── app/                    # Next.js App Router (UI + /api routes)
│   ├── components/             # shared UI components
│   ├── lib/
│   │   ├── services/
│   │   │   └── translation.ts  # LibreTranslate client
│   │   ├── supabase_admin.ts   # Supabase Storage client
│   │   └── ...
│   └── middleware.ts           # auth, locale, role gating
├── .github/workflows/deploy.yml  # SSH-based deploy on push to main
├── .env.example                # template — copy to .env and fill in
└── README.md                   # high-level project overview
```

For deeper architectural background, see `TECH_DOC.md` and `DESIGN.md`.
