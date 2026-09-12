# Accepted Security Risks

**Date**: 2026-09-12
**Owner**: Wave 1 / Agent A4
**Scope**: ERP NEX-ERP monorepo (`backend/`, `frontend/`)

This document enumerates known residual security risks that are intentionally accepted, with their rationale, blast radius, and conditions for revisiting. Generated as part of Wave 1 security close-out.

See [`2026-09-12-npm-audit-summary.md`](./2026-09-12-npm-audit-summary.md) for the current `npm audit --production` snapshot.

---

## R-001: `@xhmikosr/decompress` path traversal (dev-only transitive)

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | CRITICAL (in advisory) — but **dev-only**, **no runtime attack surface** |
| Source        | npm advisory on `@xhmikosr/decompress`                                 |
| Path          | `@swc/cli` → `@xhmikosr/bin-wrapper` → `@xhmikosr/downloader` → `@xhmikosr/decompress` |
| Where         | Backend devDependencies only (`nest build` uses `@swc/core`)            |
| Status        | Latest published (`11.1.4`); no upstream fix                            |
| Workaround    | None — removal breaks `nest build`                                      |
| Why accepted  | Build-time only; never loaded by `src/`; `npm audit --production` (used in CI) excludes it |
| Revisit if    | NestJS adds a tsc-based build path; or `@swc/cli` swaps the dependency |

## R-002: `LEAD_SVC_INGEST_SECRET` env var not set in production

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | HIGH (denial-of-service / silent-fail if unset)                         |
| Source        | Dreamlab lead-svc-deploy HMAC verification                             |
| Path          | `backend/src/modules/crm/ingest/lead-svc-webhook.controller.ts`        |
| Where         | Backend runtime env (`process.env.LEAD_SVC_INGEST_SECRET`)             |
| Status        | Contract enforced (returns 401 if missing or signature mismatch); secret must be set in deployment env |
| Owner         | Ops — set in deployment `.env` to a 32+ char random string              |
| Why accepted  | Hardening is complete; only the **secret provisioning** is left as an operational step |
| Revisit if    | Secret is provisioned. Once set, the doc entry can move to "Resolved" |

**Operational instruction** (for Ops runbook):

```bash
# In backend deployment .env (production, staging, etc.)
LEAD_SVC_INGEST_SECRET="$(openssl rand -hex 32)"
```

The same value must be configured on the **dreamlab lead-svc-deploy** server so it can sign requests with `sha256(secret, timestamp.rawBody)`.

## R-003: NestJS 11 family — 8 HIGH advisories, fix = major upgrade

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | HIGH × 8 (one per direct `@nestjs/*` package)                           |
| Packages      | `@nestjs/core`, `@nestjs/event-emitter`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`, `@nestjs/schedule`, `@nestjs/serve-static`, `@nestjs/swagger`, `@nestjs/websockets` |
| Where         | Backend direct dependencies                                            |
| Status        | Advisory requires upgrade to Nest 12.x                                  |
| Why accepted  | Nest 11 → 12 is a major upgrade touching controller bootstrapping, WebSockets, schedule; needs dedicated migration window |
| Revisit if    | Wave 2 framework-lane picks up the Nest 12 migration                    |

## R-004: `postcss` sourceMappingURL info disclosure

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | HIGH                                                                   |
| Package       | `postcss` (frontend direct, used by Tailwind)                          |
| Status        | Fix path unclear at current major; coordinated migration with Tailwind v4 needed |
| Why accepted  | Direct attack surface is limited (no untrusted CSS sources in the build pipeline); blocked on broader Tailwind upgrade decision |
| Revisit if    | Tailwind v4 migration in Wave 2 or later                                |

## R-005: `html-pdf-node` HIGH (transitive `puppeteer`, `extract-zip`)

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | HIGH                                                                   |
| Package       | `html-pdf-node` (backend direct) → `puppeteer` → `extract-zip`, `tar-fs` |
| Where         | Backend direct dep; used by document-automation module                  |
| Status        | npm reports `html-pdf-node` fix available, but transitive chain (`puppeteer`) is unmaintained |
| Why accepted  | HTML→PDF feature is low-traffic internal use; PDFs are generated server-side only (no user-uploaded HTML); no direct symlink-attack vector in our flow |
| Revisit if    | Replace `html-pdf-node` with a maintained alternative (`@react-pdf/renderer`, headless-chrome via Playwright) |

## R-006: `prisma` (backend direct) — `mysql2`, `@prisma/config` chain

| Field         | Value                                                                  |
|---------------|------------------------------------------------------------------------|
| Severity      | HIGH                                                                   |
| Package       | `prisma` (backend direct, version 7.x)                                 |
| Where         | Backend runtime                                                        |
| Status        | Fix available within Prisma 6.x patch line; current is 7.x             |
| Why accepted  | Prisma 7 is current major with breaking schema changes (e.g. `adapter-pg`); bump needs separate QA pass |
| Revisit if    | Prisma 7 → 7.x patch update available with no schema-client breakage    |

---

## Resolved in Wave 1

- **`next` middleware bypass (CRITICAL, frontend)** — fixed in 2026-09-11 via `next` bump to `^16.3.4`. See `SECURITY-AUDIT-2026-09-11.md`.
- **HMAC verification on `/crm/leads/ingest`** — controller enforces signature + missing-env rejection (commit `3016277`). Pre-existing logic, contract now explicitly tested.
- **Per-route throttling on `/auth/login` and `/crm/leads/ingest`** — `@Throttle` decorators added (commit `b4822dd`); global 100/min default still applies.

## How to update this doc

When a residual risk is fixed:
1. Move the entry from a numbered section to "Resolved in Wave N+1"
2. Reference the commit hash that resolved it
3. Update the npm audit summary doc with the new count

When a new residual risk is identified:
1. Add an entry with the next R-NNN number
2. Run `npm audit --production --json` and reference the advisory
3. Categorise: env-misconfig (Ops), dev-only (compiler chain), major-upgrade blocker, etc.