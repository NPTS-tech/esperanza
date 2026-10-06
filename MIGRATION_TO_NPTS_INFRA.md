# Deploying Esperanza on NPTS Infra

How to move Esperanza from its original single-VM deployment to the shared
**NPTS-tech** AWS infrastructure (`NPTS-tech/infra`).

---

## 1. Architecture: before → after

| Concern        | Original (single VM)                              | NPTS infra (target)                                        |
| -------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Compute        | Docker Compose on an Oracle Cloud VM              | AWS ECS service on the shared EC2 (Graviton/arm64) cluster |
| Ingress / TLS  | nginx + certbot (Let's Encrypt) in the repo       | Shared Application Load Balancer, TLS terminated at the ALB |
| DNS            | DuckDNS subdomain                                 | `esperanza.npts.tech` (prod) / `esperanza-stage.npts.tech` (stage) via Route53 |
| Database       | PostgreSQL container on the VM                    | **SQLite file on EFS** (`/efs/prod.db`, `/efs/stage.db`)   |
| Image uploads  | Supabase Storage                                  | **Filesystem on EFS** (`/efs/uploads`)                     |
| Auth           | NextAuth (Auth.js v5)                             | **Better Auth** (email/password)                           |
| Config/secrets | `.env` on the VM                                  | `.env` files in S3 (`npts-env-bucket`), loaded at runtime  |
| Image registry | built on the VM                                   | per-project ECR, built in GitHub Actions                   |
| DB migrations  | `prisma migrate deploy` on the VM                 | run by a per-project **migration Lambda** during deploy    |
| Deploy trigger | push to `main` → SSH + `docker compose up`        | push to `prod` / `stage` branch → GitHub Actions pipeline  |

The app-level changes (SQLite + Prisma 7, Better Auth, EFS uploads, nix flake)
are **already done in this repo** — see [CHANGELOG below](#6-what-already-changed-in-this-repo).
This guide covers the infra wiring that remains.

---

## 2. Prerequisites

- Access to the `NPTS-tech/infra` repo and AWS (OpenTofu state, S3 env bucket, ECR).
- OpenTofu `v1.12.0-beta1+` (see the infra README) **or** the `infratui` wizard.
- This repo's default branch is now **`dev`**, with **`stage`** and **`prod`** as
  the deploy branches. NPTS CI triggers on pushes to `stage`/`prod`.

---

## 3. Package manager: pnpm (done)

The infra's migration Lambda (`infra/cicd/.github/workflows/deploy.yml`) bundles
`package.json pnpm-lock.yaml tsconfig.json prisma/` and runs `pnpm i --frozen-lockfile`
before `prisma migrate deploy`, so the repo must use pnpm. **This is already done** —
Esperanza now uses **pnpm 11.12.0** (matches the Lambda), with `pnpm-lock.yaml`
committed and `packageManager` pinned in `package.json`. The Dockerfile and CI use
pnpm too. No action needed.

---

## 4. One-time infra setup (`NPTS-tech/infra`)

### 4.1 Environment files → S3

Create `env/esperanza.env` and `env/esperanza-stage.env` in the infra repo
(uploaded to `npts-env-bucket` by OpenTofu). Minimum keys:

```dotenv
# Database — the SQLite file MUST live under /efs so it survives restarts.
DATABASE_URL=file:/efs/prod.db          # stage file: file:/efs/stage.db

# Image uploads — also on EFS so they persist.
UPLOAD_STORAGE_PATH=/efs/uploads

# Better Auth
BETTER_AUTH_SECRET=<openssl/node 32-byte base64 secret>
BETTER_AUTH_URL=https://esperanza.npts.tech      # stage: https://esperanza-stage.npts.tech

# Public values (also pass as build args, see 4.3)
NEXT_PUBLIC_APP_URL=https://esperanza.npts.tech  # stage: ...-stage.npts.tech
# Maps/geocoding use MapLibre + OpenFreeMap + Photon — all keyless, nothing to set.

# Translation (EN<->ES auto-translation of events via Gemini; server-side only).
# Omit to disable — providers then enter both languages manually.
GEMINI_API_KEY=<gemini api key from aistudio.google.com>

NODE_ENV=production
```

> The old Supabase keys are gone — uploads are on EFS now. Postgres keys are gone — DB is SQLite.

### 4.2 Register the project

Add to `infra/projects.auto.tfvars`:

```hcl
{
  project_id       = "<new uuid>"
  name             = "esperanza"
  subdomain_name   = "esperanza"
  healthcheck_path = "/api/health"   # added in this repo; returns 200 unauthenticated
}
```

(Set `disable_stage`/`disable_prod` if you only want one environment.)

### 4.3 Provision

Use the `infratui` add-project wizard (provisions ECR, ECS services, ALB rules,
Route53, migration Lambda with image checks skipped), or manually:

```bash
cd infra
tofu init
tofu apply -var=verify_project_images=false   # first time only; images don't exist yet
# ...push first images via CI (section 5)...
tofu apply                                     # re-enable image verification
```

### 4.4 GitHub repo settings (this repo)

The reusable pipeline expects these (most are inherited org-wide via `secrets: inherit`):

- **Variables:** `REPOSITORY=esperanza`, `SEED_MIGRATION=true` (only if you want the
  DB seeded on first deploy — turn off afterwards).
- **Secrets (org-level):** `ACTIONS_ROLE_ARN`, `CLUSTER_NAME` — already set for NPTS.
- Pass `NEXT_PUBLIC_APP_URL` as a build arg to the image (it's inlined at build time).
  Wire it in `deploy.yml`'s build step or as a repo var. (Maps need no token.)

---

## 5. Deploying

CI is already wired in `.github/workflows/`:

- `prod.yml` → triggers on push to **`prod`**, deploys the `prod` environment.
- `stage.yml` → triggers on push to **`stage`**, deploys the `stage` environment.
- `deploy.yml` → the shared pipeline (copied from the infra repo): **build → migrate
  (via Lambda) → push to ECR → `aws ecs update-service --force-new-deployment`**. A
  failed migration never publishes an image.

Day-to-day:

```bash
git switch stage && git merge dev && git push   # → esperanza-stage.npts.tech
git switch prod  && git merge stage && git push  # → esperanza.npts.tech
```

The app listens on **port 3000** (required by the ECS task definition).

---

## 6. What already changed in this repo

Done as part of this migration (no action needed, listed for review):

- **Database:** Postgres → SQLite via Prisma 7's **libsql** driver adapter
  (`prisma/schema.prisma`, `prisma.config.ts`, `src/lib/db.ts`). libsql ships
  prebuilt native binaries per platform (no node-gyp build step — reproducible under
  pnpm, in Docker, and in the migration Lambda). Enums became `String` columns
  (SQLite has no enums); values are validated in the zod schemas.
- **Package manager:** npm → pnpm 11 (required by the migration Lambda).
- **Prisma 6 → 7:** new `prisma-client` generator (`engineType = "client"`, WASM
  query engine — no native engine binary, which is also what makes it run on NixOS).
- **Auth:** NextAuth → Better Auth (`src/lib/auth.ts`, `src/lib/auth-client.ts`).
  Added `Session`/`Account`/`Verification` tables; passwords live on the credential
  `Account` row. Edge middleware now uses Better Auth's cookie helper (no Prisma in
  the edge runtime); role authorization moved into `requireRole()` page guards.
- **Uploads:** Supabase Storage → filesystem (`src/lib/uploads.ts`,
  `src/app/api/uploads/...`). `UPLOAD_STORAGE_PATH` = local dir in dev, `/efs/uploads`
  in prod. Images are served through a streaming route (files live outside Next's
  static dir on EFS).
- **Dockerfile:** rebuilt for the new stack (Node 22, Prisma 7 generate, standalone
  output, no Supabase build args, no Prisma CLI in the runner since the Lambda migrates).
- **Local dev:** `flake.nix` + `.envrc` (nix dev shell), `docker-compose.yml` for the
  translation service, health endpoint at `/api/health`.

### Safe to delete (old VM architecture)

These are no longer used by the NPTS deployment — remove once you're happy:

- `docker-compose.prod.yml`, `nginx/` (ALB handles ingress + TLS)
- `DEPLOYMENT.md` sections describing the VM/nginx/certbot flow
- `.env.example` Postgres/Supabase remnants (already updated)

---

## 7. Local parity

Local dev mirrors prod except paths: SQLite at `./prisma/dev.db`, uploads at
`./uploads`. Bring it up with:

```bash
nix develop            # or: direnv allow  (provides node + pnpm via corepack)
pnpm install           # set GEMINI_API_KEY in .env for auto-translation
pnpm exec prisma migrate dev
pnpm run db:seed       # dev credentials printed at the end
pnpm run dev
```
