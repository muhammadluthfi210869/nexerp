# Marketing Module

Management-task board for DreamLab / Toribio — tracks projects, tasks, comments, attachments, ads metrics, content assets, and omnichannel CRM conversations.

Sub-controllers:

| Controller | Prefix | Purpose |
|---|---|---|
| `MarketingController` | `/marketing` | Ads, content-asset, and analytics CRUD |
| `MarketingPrototypeController` | `/marketing/prototype` | Task board (projects + tasks + comments + attachments) |
| `OmniCrmStateController` | `/marketing/omni-crm` | Per-user CRM state (Kanban funnel) |
| `OmniCrmConversationController` | `/v1/marketing/omni-crm/conversations` | WA lead conversations |

---

## Public API Endpoints

### Task Board — `POST /marketing/prototype/*`

| Route | Method | Roles | Body / Notes |
|---|---|---|---|
| `/tasks` | GET | MANAGER, DIGIMAR | Returns filtered task list |
| `/tasks` | POST | MANAGER, DIGIMAR | `{ title, projectId?, channel?, ... }` — idempotent |
| `/tasks/:id` | PATCH | MANAGER, DIGIMAR | Partial update |
| `/tasks/:id` | DELETE | MANAGER, DIGIMAR | Service enforces ownership |
| `/tasks/:id/status` | PATCH | MANAGER, DIGIMAR | `{ status, note? }` |
| `/tasks/:id/comment` | POST | MANAGER, DIGIMAR | `{ author, body }` — idempotent |
| `/tasks/:id/attachments` | POST | MANAGER, DIGIMAR | Multipart file upload — idempotent |
| `/tasks/:id/attachments/:aid` | DELETE | MANAGER, DIGIMAR | Remove attachment |
| `/tasks/:id/attachments/:aid/content` | GET | MANAGER, DIGIMAR | Stream file content |
| `/projects` | GET | MANAGER, DIGIMAR | List projects |
| `/projects` | POST | MANAGER only | `{ name, channel, category, ... }` |
| `/projects/:id` | PATCH | MANAGER only | `{ name?, deadline?, ... }` |
| `/projects/:id` | DELETE | MANAGER only | Cascade-deletes tasks |
| `/reset` | POST | MANAGER only | Reset board state |
| `/bundle` | GET | MANAGER, DIGIMAR | Full board snapshot (tasks + projects + KPI) |
| `/dashboard` | GET | MANAGER, DIGIMAR | Aggregated dashboard view |

### Analytics & Ads — `GET/POST /marketing/*`

| Route | Method | Roles | Notes |
|---|---|---|---|
| `/daily-ads` | POST | MANAGER, DIGIMAR | Upsert daily ad metric |
| `/ads/:id` | PATCH | MANAGER, DIGIMAR | Update ad record |
| `/ads/:id` | DELETE | MANAGER, DIGIMAR | Delete ad record |
| `/logs/ads` | GET | MANAGER, DIGIMAR | List daily ad logs |
| `/weekly-organic` | POST | MANAGER, DIGIMAR | Create organic metric |
| `/organic/:id` | PATCH | MANAGER, DIGIMAR | Update organic record |
| `/organic/:id` | DELETE | MANAGER, DIGIMAR | Delete organic record |
| `/logs/organic` | GET | MANAGER, DIGIMAR | List organic logs |
| `/content-asset` | POST | MANAGER, DIGIMAR | Create content asset |
| `/content-assets` | GET | MANAGER, DIGIMAR | Paginated list |
| `/logs-content` | GET | MANAGER, DIGIMAR | All content logs |
| `/analytics` | GET | MANAGER, DIGIMAR, COMMERCIAL | Dashboard analytics |
| `/organic-analytics` | GET | MANAGER, DIGIMAR, COMMERCIAL | Organic performance |
| `/acquisition-hub` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?month&year` |
| `/funnel-efficiency` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?month&year` |
| `/content-performance` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?month&year` |
| `/comparison` | GET | MANAGER, DIGIMAR | `?date&type=ADS|ORGANIC` |
| `/budget-audit` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?start&end` |
| `/platform-performance` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?start&end` |
| `/realized-roi` | GET | SUPER_ADMIN, FINANCE, MARKETING | `?month&year` |
| `/sample-efficiency` | GET | MANAGER, COMMERCIAL, PPIC | — |
| `/targets` | GET | MANAGER, DIGIMAR, COMMERCIAL | `?month&year` |
| `/targets` | POST | SUPER_ADMIN, FINANCE | `{ month, year, ... }` |
| `/audit-ads` | POST | SUPER_ADMIN, FINANCE | `{ id, isAudited }` |

### Omni CRM — `/marketing/omni-crm` and `/v1/marketing/omni-crm/conversations`

| Route | Method | Roles | Notes |
|---|---|---|---|
| `/state` | GET | MANAGER, DIGIMAR, DIRECTOR | Get user's CRM state |
| `/state` | PUT | MANAGER, DIGIMAR, DIRECTOR | `{ state, version? }` — version conflict = 409 |
| `/conversations` | GET | MANAGER, DIGIMAR, COMMERCIAL, DIRECTOR | `?limit&assignedTo` |
| `/conversations/:leadId/messages` | GET | MANAGER, DIGIMAR, COMMERCIAL, DIRECTOR | Full WA thread |
| `/conversations/send` | POST | MANAGER, DIGIMAR, COMMERCIAL | `{ leadId?, phone, message, phoneNumberId? }` |

**Role constants:** `MANAGER = SUPER_ADMIN | HEAD_OPS | MARKETING`; `MEMBER_ROLES = MANAGER | DIGIMAR`

---

## Data Model

```
MarketingTask
  ├── MarketingTaskHistory    (audit trail per state change)
  ├── MarketingTaskAttachment (file uploads)
  ├── MarketingTaskComment    (threaded comments)
  └── MarketingProject        (parent project)

MarketingProject
  └── MarketingTask[]

User (via relations: pic, reviewer, assignedBy, owner, uploadedBy, by)

DailyAdsMetric    — ads spend/impressions/clicks per platform
MarketingTarget   — monthly KPI targets
ContentAsset      — published content tracking
AccountHealthLog — weekly social health metrics
SearchVisibilityMetric — SEO impressions/clicks
```

All sub-models use `@relation(..., onDelete: Cascade)` from `MarketingTask`.

---

## Permission Model

**Manager role** — `SUPER_ADMIN`, `HEAD_OPS`, or `MARKETING`:
- Full write on all task/project operations
- Access to `reset`, project DELETE, target setting, ad auditing

**Member role** — `DIGIMAR` (and all manager roles inherit it):
- Read all tasks filtered by delegated scope
- Create tasks (pinned to self as PIC)
- Update status, add comments, upload attachments on visible tasks
- Cannot create/delete projects, cannot reset

**Delegated manager scope** (e.g. Rahmat → gusti, zarka):
- Resolved at runtime via `resolveViewer()` → `DELEGATED_MANAGER_SCOPE` alias map
- `canManageTask()` checks: isManager OR viewer name aliases the task PIC OR managedMembers list
- `isVisibleToViewer()`: manager sees all; DIGIMAR sees only scoped tasks

---

## Idempotency

`POST /tasks`, `POST /tasks/:id/comment`, and `POST /tasks/:id/attachments` accept an `Idempotency-Key` header.

```ts
// In-memory Map, single-process only
const idempotencyCache = new Map<string, { result: unknown; expiresAt: number }>();
const IDEMPOTENCY_TTL_MS = 60_000;
```

- Cache key = `${endpoint}:${idempotencyKey}`
- 60-second TTL; expired entries are purged on next check
- Replay returns the cached result with `isReplay: true` (HTTP 200, not 201)
- **Single-instance only** — no Redis or distributed store; does not survive server restarts

---

## Concurrency

**`taskCode`**: generated as `TSK-${uuid().slice(0,8).toUpperCase()}` — UUID v4, collision-resistant.

**Multi-write operations** are wrapped in `prisma.$transaction([...])`:

```ts
// Status update: history row + task row in one atomic write
await this.prisma.$transaction([
  tx.marketingTaskHistory.create({ data: historyEntry }),
  tx.marketingTask.update({ where: { id }, data: updateData }),
]);

// Task creation: task + history in one atomic write
return this.prisma.$transaction(async (tx) => {
  const task = await tx.marketingTask.create({ data: { taskCode, ... } });
  await tx.marketingTaskHistory.create({ data: { taskId: task.id, ... } });
  return task;
});
```

`OmniCrmStateService.upsert` uses optimistic locking via `version` field — concurrent PUT returns HTTP 409.

---

## Audit Trail

`MarketingTaskHistory` is written on every task state change:

| Field | Purpose |
|---|---|
| `taskId` | FK to the task |
| `byId` | Actor who triggered the change |
| `fromStatus` | Previous canonical status |
| `toStatus` | New canonical status |
| `note` | Human-readable description of the change |
| `at` | Timestamp |

Canonical statuses: `Not started` | `Working on it` | `Revision` | `Done`

---

## Known Limitations

- **Idempotency is single-instance**: in-memory Map — not shared across multiple server instances; does not survive restart. Upgrade path: Redis-backed store.
- **No distributed transactions**: `$transaction` is local to the DB connection — not safe for multi-region PostgreSQL without row-level locking.
- **TypeScript strictness**: `MarketingPrototypeController` carries `// @ts-nocheck` because inferred return types reference internal service-only types. Safe at runtime; fix with explicit `Promise<unknown>` annotations.
- **No rate limiting** on ad/content write endpoints.
- **OmniCrmState** is not validated against a schema — accepts any JSON `state` payload.

---

## Recent Fixes

- **Wave 1 (16 bugs)**: Fixed task creation, status transitions, comment ordering, attachment upload path, SLA derivation, project deletion cascade, bundle pagination, and null PIC handling.
- **Wave 2**: Fixed memory leak in `getKPI` aggregation (unbounded `reduce` on large datasets).
- **Wave 3**: Added permission guard on `reset`, `deleteProject`, and ad audit endpoints; enforced `ensureManager()` at service layer.
- **Wave 4**: Removed dead code, deleted `MarketingTaskBoard` model and legacy controller, cleaned up unused DTO exports.
- **Wave 5–6**: Restored `MarketingTaskHistory`, `MarketingTaskAttachment`, `MarketingTaskComment`, and `MarketingProject` models; reconnected Prisma relations.
- **Wave 7**: Added idempotency-key support; wrapped all multi-write ops in `$transaction`.
- **Wave 8**: Added DTO validation (`class-validator` decorators) and UTC normalization on all date inputs.

---

## Run Commands

```bash
# Dry-run orphan upload cleanup (lists files, deletes nothing)
npm run cleanup:uploads

# Apply orphan cleanup (actually deletes)
npm run cleanup:uploads:apply
```

Script: `backend/scripts/cleanup-orphan-uploads.ts`
