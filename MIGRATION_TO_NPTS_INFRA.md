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

---

## Current status

**🟢 Stage is LIVE — https://esperanza-stage.npts.tech** — deployed, migrated, and
seeded on NPTS infra (ECS + shared ALB + SQLite-on-EFS). Verified end-to-end:
`/api/health` → 200, Better Auth login works with the seeded accounts, DB-backed
APIs return data.

**🟡 Prod is provisioned but dormant** — `disable_prod = true` sets the prod ECS
service to `desired_count = 0`, so `esperanza.npts.tech` exists but runs no task.
Bringing prod up is the remaining work → [§8 Going to production](#8-going-to-production).

Done:
- ✅ App re-platformed (SQLite/Prisma 7, Better Auth, EFS uploads, MapLibre + Geoapify, Gemini) — §6
- ✅ pnpm 11 with an `allowBuilds` block so the migration Lambda's `pnpm install` succeeds (§6)
- ✅ `esperanza` registered in `projects.auto.tfvars`; **stage** resources provisioned via a *targeted* `tofu apply` (other projects untouched)
- ✅ `env/esperanza-stage.env` uploaded to S3; repo vars + secrets set; CI build-args wired
- ✅ `seed.ts` made Lambda-safe; stage DB seeded with demo accounts
- ✅ Stage CI deploys green end-to-end (build → migrate + seed → push → ECS)

Seeded stage logins: `admin@esperanza.app` / `admin123`, `provider@esperanza.app` /
`provider123`, `user@esperanza.app` / `user123` (+ `resident01…30`).

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

# Public values. NEXT_PUBLIC_* are inlined at BUILD time, so they must ALSO be
# passed as build args in CI (already wired in deploy.yml, see 4.4) — the runtime
# env file alone won't reach the client bundle.
NEXT_PUBLIC_APP_URL=https://esperanza.npts.tech  # stage: ...-stage.npts.tech

# Maps render with MapLibre + OpenFreeMap (keyless). Address autocomplete uses
# Geoapify (needs a key; restrict it to the esperanza.npts.tech origin).
NEXT_PUBLIC_GEOAPIFY_KEY=<geoapify key from myprojects.geoapify.com>

# Translation (EN<->ES auto-translation of events via Gemini; server-side only).
# Omit to disable — providers then enter both languages manually.
GEMINI_API_KEY=<gemini api key from aistudio.google.com>

NODE_ENV=production
```

> Uploaded **out-of-band**: tofu no longer manages env file contents — upload directly
> to S3: `aws s3 cp env/esperanza-stage.env s3://npts-env-bucket/esperanza/stage.env`
> (ECS loads it at `s3://npts-env-bucket/<name>/<env>.env` via `environmentFiles`).
> Supabase/Postgres keys are gone — uploads are on EFS, DB is SQLite.

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
# Review the plan first. A full apply ALSO reconciles pre-existing drift across
# EVERY project's ALB target groups (deregistration_delay/health-check timing) —
# benign but org-wide. To deploy ONLY esperanza, use a targeted apply of its
# resources (what was done for stage):
tofu apply -var=verify_project_images=false \
  -target='module.dynamic.aws_ecr_repository.npts-repo["esperanza"]' \
  -target='module.dynamic.aws_ecs_service.npts-ecs-service-stage["esperanza"]' \
  ...   # all module.dynamic.*["esperanza"] / ["esperanza-stage"] addresses
# `verify_project_images=false` is required on first provision (the :stage/:prod
# images don't exist yet). After CI pushes images (section 5), a later apply can
# drop the flag.
```

> `tofu` isn't a one-liner install on NixOS — download the pinned binary and run it
> directly (nix-ld handles it): the `v1.12.0-beta1` release zip, `chmod +x`, run in place.

### 4.4 GitHub repo settings (this repo)

The reusable pipeline needs these. **⚠️ Gotcha:** NPTS is on the GitHub Free plan,
where **org secrets can't be used by *private* repos** (esperanza is private). So the
org `ACTIONS_ROLE_ARN` / `CLUSTER_NAME` resolve empty → the CI AWS-auth step fails with
"Could not load credentials." Fix (done for esperanza): set them as **repo** secrets
(these values aren't sensitive):

```bash
gh secret set ACTIONS_ROLE_ARN -R NPTS-tech/esperanza -b "arn:aws:iam::654654236858:role/GithubActions"
gh secret set CLUSTER_NAME     -R NPTS-tech/esperanza -b "npts-ecs-cluster"
```
(Alternative: make the repo public, or upgrade the org plan. The `GithubActions` role's
OIDC trust already allows `repo:NPTS-tech/*`.)

- **Repo variables:** `REPOSITORY=esperanza`, `NEXT_PUBLIC_GEOAPIFY_KEY=<key>`, and
  `SEED_MIGRATION=true` **only** while you want demo data seeded (⚠️ **turn OFF before
  prod** — see §8). Repo variables/secrets work on private repos; org ones don't.
- **Build args:** `deploy.yml` already passes `NEXT_PUBLIC_APP_URL` (derived from the
  environment) and `NEXT_PUBLIC_GEOAPIFY_KEY` (from the repo var) to the image build.

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
- **Maps & geocoding:** Mapbox → MapLibre GL + OpenFreeMap tiles (keyless) +
  Geoapify autocomplete (region-scoped to DFW), with a keyless Photon fallback.
- **Translation:** LibreTranslate → Gemini (`gemini-flash-lite-latest`), server-side
  only, structured-output + injection-hardened, with graceful 422 fallback.
- **Dockerfile:** rebuilt for the new stack (Node 22, Prisma 7 generate, standalone
  output, no Supabase build args, no Prisma CLI in the runner since the Lambda migrates).
- **CI / migration Lambda:** `pnpm-workspace.yaml` declares an `allowBuilds` block
  (build `@prisma/engines`, deny the rest) so the Lambda's `pnpm install` exits 0 and
  doesn't inject its own partial approvals. `seed.ts` is Lambda-safe (own libsql client
  via a relative path to the generated client, no `@/` alias), and `deploy.yml` bundles
  `src/lib` so the seed's helpers resolve.
- **Local dev:** `flake.nix` + `.envrc` (nix dev shell), health endpoint at `/api/health`.

### Removed (old VM architecture)

The single-VM artifacts have been deleted from the repo: `docker-compose.prod.yml`,
`nginx/` (ALB handles ingress + TLS), `docker-compose.yml`, the `DEPLOYMENT.md`
runbook, and the `TECH_DOC.md` Oracle-VM planning doc. Current docs are this file +
the `README`.

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

---

## 8. Going to production

Stage is live; prod is provisioned-but-dormant. Everything below is what's left to
take `esperanza.npts.tech` live. Do them in order.

### 8.1 Prod environment file → S3
Create `env/esperanza.env` with **prod** values and upload it:
```bash
aws s3 cp env/esperanza.env s3://npts-env-bucket/esperanza/prod.env --profile npts
```
Keys (differ from stage):
- `DATABASE_URL=file:/efs/prod.db`
- `BETTER_AUTH_URL=https://esperanza.npts.tech` and `NEXT_PUBLIC_APP_URL=https://esperanza.npts.tech`
- `BETTER_AUTH_SECRET=` — **generate a fresh one** (don't reuse stage's)
- `NEXT_PUBLIC_GEOAPIFY_KEY=`, `GEMINI_API_KEY=` (same keys are fine)
- `UPLOAD_STORAGE_PATH=/efs/uploads`, `NODE_ENV=production`

### 8.2 ⚠️ Turn OFF seeding before the prod deploy
`SEED_MIGRATION=true` currently seeds demo accounts (incl. `admin123`) on **every**
deploy. Disable it so prod does **not** get demo creds on a public URL:
```bash
gh variable delete SEED_MIGRATION -R NPTS-tech/esperanza    # or set it to false
```

### 8.3 Create a real prod admin (replaces the `admin123` seed)
With seeding off, the prod DB has schema but no users. Pick one:
- **Register + promote:** register via the live site (creates a `USER`), then flip that
  row to `role = "ADMIN"` in `/efs/prod.db` (one-off via a Lambda/SSM exec, or a small
  admin-bootstrap script run through the migration Lambda).
- **One-off admin seed:** a prod-only seed that creates a single admin from
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (no demo data), run once.

Decide this before launch — don't ship `admin123`.

### 8.4 Enable the prod ECS service
In `infra/projects.auto.tfvars`, remove `disable_prod = true` from the esperanza entry
(this flips the prod ECS `desired_count` 0 → 1), then targeted-apply:
```bash
cd infra && tofu apply -var=verify_project_images=false \
  -target='module.dynamic.aws_ecs_service.npts-ecs-service-prod["esperanza"]'
```
(All other esperanza prod resources — target group, listener rule, Route53, task def,
migration Lambda, EFS access point — already exist from the stage provisioning.)

### 8.5 Geoapify origin
Add `esperanza.npts.tech` to the Geoapify key's allowed origins (stage origin is
already there), or address autocomplete will 403 in prod.

### 8.6 Deploy
```bash
git switch prod && git merge stage && git push    # → triggers prod.yml
```
CI runs build → migrate (applies schema to `/efs/prod.db`) → push `:prod` → ECS deploy.

### 8.7 Verify
- `curl https://esperanza.npts.tech/api/health` → `200`
- ECS: `aws ecs describe-services --cluster npts-ecs-cluster --services esperanza-prod-service` → running 1, rollout COMPLETED
- Log in as the real admin; smoke-test event create (maps/geocoding/translation), RSVP, analytics.

### 8.8 Repo secrets (already set — no action)
`ACTIONS_ROLE_ARN` / `CLUSTER_NAME` repo secrets from §4.4 apply to prod too (same repo).

### Also worth doing (not blocking)
- Reconcile the org-wide target-group drift with a deliberate full `tofu apply` (off-hours).
- If you make the repo public or upgrade the org plan, drop the repo secrets and use the org ones.
