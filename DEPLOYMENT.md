# Esperanza Production Deployment Architecture Recommendation

## Document Purpose

This document defines the recommended production deployment architecture for Esperanza when moving from the current demo setup to a real county operational environment.

It is not a demo deployment guide. The demo environment is already live. This document is focused on the infrastructure, hosting, and operational decisions needed for a production-ready county deployment.

## Decision Summary

The recommended priority order for production deployment options is:

1. **Option A:** Managed application hosting + managed database + production translation provider + real production domain
2. **Option B:** Single DigitalOcean VM using the current Docker Compose deployment model
3. **Option C:** VM-hosted application with managed Postgres

This ordering reflects operational suitability for a county-facing production system.

## Recommendation

The recommended production target is **Option A**.

Option A provides the strongest operational profile for a real deployment because it reduces manual infrastructure management while improving reliability, security, and maintainability. It is the best fit for a county production environment, where the goal is not simply to make the application reachable, but to run it in a stable and supportable way.

### Recommended production shape

- **Application hosting:** Render
- **Database:** Managed Postgres with backups and recovery
- **Translation service:** Google Cloud Translation Advanced
- **Domain:** County-managed domain or subdomain
- **Existing external dependencies retained:** Supabase Storage and Mapbox

## Production Goals

The production deployment should optimize for the following:

- stable hosting
- managed HTTPS/TLS
- clean domain management
- managed database backups and recovery
- reduced operational overhead
- fewer manual deployment and maintenance steps
- lower risk during ongoing county use

A managed hosting approach best aligns with these goals.

---

# Option A: Managed Hosting Architecture

## Overview

Option A is the preferred production architecture. It moves the application toward a managed platform model while preserving compatibility with the current application shape.

### Recommended stack

- **Render Web Service** for the Next.js application
- **Render Postgres** or **Supabase Postgres** for managed database hosting
- **Google Cloud Translation Advanced** for production translation
- **County-managed subdomain** if available, otherwise a purchased production domain

## Why Render is the preferred hosting platform

Both Render and Vercel are technically viable for hosting this application. However, Render is the better first recommendation for the current codebase.

### Reasons

- the repository already includes a production Dockerfile
- the application is packaged as a standalone Next.js Node server
- Prisma is already used in the runtime architecture
- the current deployment model is server-oriented and Docker-friendly

Render allows the team to move to managed hosting without significantly changing the application’s deployment model.

## Render compatibility with the current app

Render is well aligned with the existing architecture because it supports:

- Docker-based deployment
- long-running web services for dynamic applications
- managed Postgres
- custom domains
- managed TLS/HTTPS

This makes it a low-friction managed deployment target.

## Why Vercel is not the first recommendation

Vercel is still technically possible and supports full-stack Next.js applications, backend logic, and custom domains. However, it is not the best primary recommendation for this codebase right now.

The current application is shaped more like:

- a standalone Node application
- Prisma-backed server logic
- a Docker-oriented deployment

Because of that, Render is the more natural production target.

---

# Translation Architecture Recommendation

## Current state

The application currently expects a LibreTranslate-compatible translation backend.

The server is wired to a translation service through `TRANSLATION_BASE_URL`, with a contract that expects:

- `POST /translate`
- request body containing `q`, `source`, `target`, and `format`
- response containing `translatedText`

## Production recommendation

LibreTranslate should not remain the primary translation service for county production.

It is acceptable for demos, testing, or fallback scenarios, but it is not the strongest option for a production county deployment.

### Recommended provider

- **Google Cloud Translation Advanced**

### Rationale

- purpose-built for translation workflows
- stronger production reliability than a self-hosted translation service
- better support and operational story
- better fit for bilingual event-content workflows
- better production choice than using a general-purpose LLM endpoint for translation

## Required application change

The current app does **not** directly support Google Cloud Translation yet.

Moving to Google Cloud Translation will require a small adapter or service-layer update so the application can call the Google API instead of the current LibreTranslate-style HTTP contract.

This is a manageable change and is worth doing for production.

---

# Database Recommendation

County production should use a **managed Postgres database** rather than a self-hosted Postgres container.

## Recommended options

- **Render Postgres**, if the team wants app hosting and database hosting on the same platform
- **Supabase Postgres**, if the team wants to consolidate database and storage under an existing vendor relationship

## Why managed Postgres is preferred

Compared with self-hosted Postgres in Docker, managed Postgres provides:

- backups
- recovery workflows
- lower operational overhead
- reduced maintenance burden
- better production readiness

---

# Domain Recommendation

The production system should not use DuckDNS as its primary public-facing domain.

## Preferred approach

- a county-managed domain or subdomain

## Fallback

- a purchased production domain

DuckDNS is acceptable for demo continuity, but not as the production identity for a county deployment.

---

# Option B: Single VM with Docker Compose

## Overview

Option B is the best fallback path and should be treated as the second-priority option.

### Architecture

- one DigitalOcean VM / Droplet
- Docker Compose running:
  - Postgres
  - LibreTranslate
  - Next.js application
  - Nginx
  - Certbot
- manual certificate bootstrapping
- DNS pointed to the VM public IP

## Strengths

- closely matches the current deployment model
- likely closest to the current demo environment
- lowest-change path if a production move must happen quickly
- easiest continuity option from the current repo and infrastructure approach

## Weaknesses

Option B should not be the first production choice because it keeps most of the infrastructure burden on the team, including:

- self-hosted Postgres backups and restore responsibility
- Nginx management
- Certbot management
- manual certificate setup
- VM patching
- monitoring
- disk management
- incident recovery responsibility

## When to use Option B

Option B makes sense when:

- the team needs the smallest migration from the current setup
- production timing is too tight for a managed-platform migration
- a reliable fallback path is needed while Option A is being prepared

---

# Option C: VM for App + Nginx, Managed Postgres

## Overview

Option C should be the last-priority option.

### Architecture

- application hosted on a VM
- Nginx and TLS certificates managed on the VM
- Postgres moved to a managed provider

## Why it ranks last

Option C improves only one part of the system: the database.

The rest of the operational burden remains, including:

- VM maintenance
- Nginx management
- certificate handling
- server patching
- deployment scripting
- monitoring and host operations

This creates a split architecture without eliminating enough manual operations burden.

## Conclusion on Option C

Option C is weaker than:

- **Option A**, which meaningfully reduces operations overhead
- **Option B**, which at least remains simple and aligned with the current deployment model

## When Option C makes sense

Option C is only reasonable as an intermediate transition step if:

- the team wants a managed database immediately
- but is not yet ready to move application hosting off the VM

It is not the preferred final-state architecture.

---

# Application Constraints That Influence the Decision

The following current application constraints matter when choosing a production architecture:

- the application is packaged as a standalone Next.js server
- the repository already includes a production Dockerfile
- Prisma is used for the main database layer
- Supabase Storage is required for event image uploads
- Mapbox remains a required external dependency
- translation is currently wired to a LibreTranslate-compatible HTTP interface

These constraints do not block Option A, but they do explain why **Render** is a better first managed-hosting recommendation than **Vercel** for this codebase.

---

# Final Recommended Production Direction

The recommended county production architecture is:

- **Render** for application hosting
- **Managed Postgres** with backups and recovery
- **Google Cloud Translation Advanced** instead of LibreTranslate
- **County-managed domain**
- **Supabase Storage retained** unless storage strategy changes separately

## Final decision statement

If the goal is a real county production deployment rather than simply preserving the current demo setup, **Option A should be the first choice**.

More specifically, the recommended direction is a **Render-first managed deployment** with managed Postgres, a real domain, and a production-grade translation provider.

- **Option B** should remain the fallback because it is the easiest continuity path from the current deployment model.
- **Option C** should be last because it increases architectural split without removing enough operational burden.