# Phase 3 — Canonical Marketing Backend

## Outcome

Phase 3 establishes one canonical backend contract for marketing task management and social media operations. It includes server-enforced workflow rules, object-scoped authorization, optimistic concurrency, persistent idempotency, encrypted integration credentials, reporting endpoints, and a real PostgreSQL rehearsal. The legacy social planner route remains available as a compatibility adapter.

The active database is intentionally not migrated by the implementation or verification scripts. Migration application remains a separate deployment action.

## Canonical API

All routes require JWT authentication and are mounted below `/marketing`.

| Area | Routes | Purpose |
| --- | --- | --- |
| Tasks | `GET/POST /tasks`, `GET/PATCH /tasks/:id` | Paginated task retrieval and mutation |
| Workflow | `PATCH /tasks/:id/status` | Validated task state transition with history |
| Collaboration | `POST /tasks/:taskId/checklist`, `PATCH /tasks/:taskId/checklist/:itemId`, `POST /tasks/:taskId/comments` | Checklist and comment operations |
| Projects | `GET/POST /projects`, `PATCH /projects/:id` | Project portfolio operations |
| Brands | `GET/POST /brands`, `PATCH /brands/:id` | Brand master data |
| Social | `/marketing/social/posts` compatibility CRUD | Canonical social workflow through the existing planner URL |
| Reporting | `GET /social/reports`, `POST /social/reports/channel-metrics` | Funnel and channel KPI read/write |
| Integrations | `GET/POST /social/integrations`, `POST /social/integrations/sync` | Encrypted connection configuration and queued sync jobs |

## Access policy

`SUPER_ADMIN`, `DIRECTOR`, and `MARKETING` can manage the canonical marketing domain. `DIGIMAR` can read and update only tasks assigned to that user and cannot manage brands, projects, reporting writes, integrations, or destructive social actions. The global role guard no longer gives `DIRECTOR` an implicit bypass: a route must list that role explicitly.

Task reads and writes apply object scope in the database query. Client-supplied author identity, ownership, and performance metrics are not trusted.

## Workflow rules

Task flow is `NOT_STARTED → IN_PROGRESS → IN_REVIEW → DONE`. Revisions return `IN_REVIEW → REVISION → IN_PROGRESS`. Required checklist items must be complete before `DONE`. Cancellation and reopening require manager authority and a reason.

Social flow is `IDEA → DRAFT → SCRIPTING → PRODUCTION → IN_REVIEW → APPROVED → SCHEDULED → PUBLISHED`, with revision returning to production. Scheduling requires a brand, assignee, and scheduled time; publishing requires publication time and evidence.

Mutable resources carry a `version`. Updates use an atomic version predicate and return `VERSION_CONFLICT` when another writer has already changed the record.

## Reliability and security

Mutating create/configuration routes accept `Idempotency-Key`. Results are stored in `marketing_idempotency_keys`, scoped to route and authenticated actor, protected by a transaction-level PostgreSQL advisory lock, and replayed only for an identical payload. Reusing the key for a different payload returns `IDEMPOTENCY_KEY_REUSED`.

Integration secrets use AES-256-GCM and are never selected in API read responses. Production must set `MARKETING_INTEGRATION_KEY` to either 64 hexadecimal characters or a base64-encoded 32-byte key. Changing this key requires an explicit secret rotation procedure because existing ciphertext depends on it.

Validation responses use a stable shape containing `code`, `message`, and `fieldErrors`. `Idempotency-Key` and `X-Idempotency-Key` are allowed by CORS.

## Verification

Run the complete Phase 3 gate from the repository root:

```powershell
npm run verify:marketing:phase3
```

The gate validates the marketing foundation and API migration policies, Prisma schema, backend and frontend marketing typechecks, marketing tests, the production backend build, and a disposable PostgreSQL service rehearsal. The rehearsal creates a temporary database, applies the full migration ledger, exercises task/social/integration/idempotency flows, and drops the database in `finally`. It does not depend on or mutate the configured active database.

Phase 4 must update the frontend to consume canonical uppercase workflow statuses and version fields. Compatibility responses expose `legacyStatus` during that migration window.
