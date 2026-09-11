# Digital Marketing Task & Social Management — Product/UI Contract

Status: FROZEN FOR PHASE 2  
Contract version: 1.0.0  
Date: 2026-09-10  
Machine contract: `docs/marketing/phase-1-contract.json`  
Feature registry: `docs/marketing/PHASE-1-FEATURE-MATRIX.csv`

## 1. Product boundary

This workstream combines the useful workflows in the AI Studio brief with the
existing ERP Task and Social modules. It does not copy the prototype shell,
localStorage architecture, sample metrics, emoji navigation, or standalone sidebar.

Release 1 contains operational task management, multi-view social planning, manual
verified reporting, and hardened Meta sync. Automatic TikTok, YouTube, Search Console,
GA4, and Google Ads ingestion remains Release 2 because provider credentials and API
approval are separate delivery risks.

The Digital Marketing sidebar remains exactly four top-level destinations:

1. Dashboard
2. OmniCRM
3. Social Media
4. Management Task

Reporting and integrations are children of Social Media, not new top-level items.

## 2. Authority and traceability

The explicit user request brings Digital Marketing into scope and supersedes the old
module exclusion for this workstream only. The Golden Reference remains visual
authority. The AI Studio brief is functional evidence only.

New module requirements use `DM-*` identifiers because no canonical `SCR-NNN` entries
exist for these new workflows. Every future field, API, test, and page must cite one or
more IDs from the feature matrix. Existing ERP requirements keep their original SCR IDs.

Precedence:

1. This product contract for Task/Social behavior.
2. Golden Reference and `VISUAL_DNA.md` for appearance and composition.
3. `DNA-RULES-CONTRACT.md` for component usage.
4. Current API/schema for backward compatibility.
5. AI Studio brief for missing functional coverage.

## 3. Information architecture

| Route | Purpose | URL state |
|---|---|---|
| `/marketing/management-task` | Stable entry redirect | Redirects to `/overview` |
| `/marketing/management-task/overview` | Team overview | `view`, `q`, `status`, `pic`, `project`, `brand`, `from`, `to`, `sort`, `page` |
| `/marketing/management-task/[member]` | Member-scoped workspace | Same filters; member is path state |
| `/marketing/social-tracker` | Content planner | `view`, `brand`, `platform`, `status`, `pillar`, `q`, `sort`, `page` |
| `/marketing/social-tracker/reporting` | Brand/channel reporting | `brand`, `channel`, `period`, `tab` |
| `/marketing/social-tracker/integrations` | Connection and sync health | `provider`, `tab` |

Filters, tabs, periods, sorting, and pagination must be deep-linkable. Browser Back must
restore the preceding view and filter state. Modal/drawer state may remain ephemeral.

## 4. Roles and permissions

| Capability | SUPER_ADMIN | HEAD_OPS | MARKETING | DIGIMAR | DIRECTOR | COMMERCIAL |
|---|---:|---:|---:|---:|---:|---:|
| Read all tasks | Yes | Yes | Yes | No | No | No |
| Read scoped tasks | Yes | Yes | Yes | Yes | No | No |
| Create/reassign any task | Yes | Yes | Yes | No | No | No |
| Create/update own or delegated task | Yes | Yes | Yes | Yes | No | No |
| Manage projects/brands | Yes | Yes | Yes | No | No | No |
| Read social planner/reporting | Yes | Yes | Yes | Yes | Yes | Yes |
| Create/update social content | Yes | No | Yes | Yes | No | No |
| Delete social content | Yes | No | Yes | No | No | No |
| Enter verified metrics | Yes | No | Yes | Yes | No | No |
| Configure provider secrets | Yes | No | Yes | No | No | No |
| Trigger provider sync | Yes | No | Yes | Yes | No | No |

The backend is authoritative. Frontend hiding is convenience, never authorization.
Unauthorized object access returns 404 when existence itself is sensitive and 403 when
the object is already visible but the attempted action is forbidden.

## 5. Canonical domain fields

### Task — DM-TASK-004 through DM-TASK-009

| Field | Type | Required | Rule |
|---|---|---:|---|
| `id` | UUID | Yes | Internal immutable identity |
| `taskCode` | string | Yes | Server-generated, immutable |
| `type` | enum | Yes | `DAILY` or `PROJECT` |
| `title` | string(255) | Yes | Trimmed, non-empty |
| `projectId` | UUID | Conditional | Required for `PROJECT` |
| `brandId` | UUID | No | Must reference active brand |
| `channel` | enum | Yes | Canonical channel registry |
| `category` | string(100) | Yes | Controlled value, not UI label |
| `ownerId` | UUID | Yes | Creator/accountable owner |
| `assigneeId` | UUID | Yes | ERP User; never stored as a free name |
| `reviewerId` | UUID | No | ERP User |
| `priority` | enum | Yes | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `status` | enum | Yes | Canonical state machine |
| `startDate` | date | Yes | Jakarta business date |
| `dueDate` | date | Yes | Must be on/after start date |
| `brief` | text | No | Sanitized rich/plain text contract |
| `outputUrl` | URL | No | HTTP/HTTPS only |
| `referenceUrl` | URL | No | HTTP/HTTPS only |
| `estimatedMinutes` | integer | No | Non-negative |
| `actualMinutes` | integer | No | Non-negative |
| `version` | integer | Yes | Optimistic concurrency token |

Checklist, comment, attachment, and history are normalized child records. `checklistDone`
and `checklistTotal` become response aggregates, not writable source fields.

### Brand — DM-SOC-001

`id`, `code`, `name`, `handle`, `primaryPlatform`, `ownerId`, `notes`, `accentToken`,
`isActive`, `createdAt`, and `updatedAt`. Brand color is a whitelisted semantic token;
arbitrary user-provided CSS/hex is not rendered directly.

### Social post — DM-SOC-002 through DM-SOC-006

`id`, `brandId`, `title`, `platform`, `contentType`, `status`, `scheduledAt`,
`publishedAt`, `pillar`, `caption`, `hooks[]`, `cta`, `hashtags[]`, `targetAudience`,
`campaignId`, `assigneeId`, `reviewerId`, `brief`, `referenceUrl`, `metaPostId`,
`metaPermalink`, `version`, timestamps, media children, checklist children, and metric
snapshots. Author display name/avatar are read models from ERP User, not writable identity.

### Reporting — DM-REP-001 through DM-REP-008

Every report row is keyed by `brandId`, `channel`, `periodStart`, `periodEnd`, `timezone`,
and `source`. Manual entries record `enteredById`, `verifiedById`, and audit timestamps.
Imported records additionally record provider, external ID, sync job, and freshness.

Raw facts are stored; engagement rate, net growth, averages, CPL, conversion, and ROAS
are calculated consistently by backend services. Derived values are not separately
editable unless explicitly designated as a verified override with reason and actor.

## 6. State machines

### Task

`NOT_STARTED → IN_PROGRESS → IN_REVIEW → DONE`

- `IN_REVIEW → REVISION → IN_PROGRESS`
- Any non-terminal state may become `CANCELLED` by a manager with a reason.
- Reopening `DONE` requires manager permission and an audit reason.
- `DONE` requires all mandatory checklist items complete.

### Social post

`IDEA → DRAFT → SCRIPTING → PRODUCTION → IN_REVIEW → APPROVED → SCHEDULED → PUBLISHED`

- `IN_REVIEW → REVISION → PRODUCTION`
- Any state may become `ARCHIVED` subject to permission.
- `SCHEDULED` requires brand, platform, scheduled time, assignee, and approved state.
- `PUBLISHED` requires published time and either external post ID/permalink or a manual
  publication verification record.

Legacy strings remain accepted only at the compatibility boundary and are immediately
normalized to canonical enum values.

## 7. UI composition contract

The UI follows a dense operational SaaS pattern using the repository Golden Reference.
The skill search utility was unavailable because this workstation has no Python
interpreter, so these rules use the skill's built-in priority defaults plus the repo's
binding Golden Reference.

### Management Task

1. `DnaPageHeader`: title, breadcrumb, period/scope context.
2. `DnaKpiGrid`: at most four actionable metrics.
3. `DnaTabNav`: Overview, My Tasks, Team, Projects.
4. `DnaTableToolbar`: search, status, PIC, project, brand, date, reset, one primary add action.
5. `DnaDataTableCard` for table; DNA-composed board for Kanban.
6. `DnaSheet` for detail and `DnaModal` for create/edit/confirm.
7. `DnaAuditTimeline`, comment thread, attachment area, checklist in the detail sheet.

### Social Planner and Reporting

1. `DnaPageHeader`: brand/channel/period context, one primary add-content action.
2. `DnaKpiGrid`: scheduled, published, reach, engagement; unavailable data is `—`.
3. `DnaTabNav`: Planner views or Reporting sections depending on route.
4. `DnaTableToolbar`: URL-backed filters.
5. Table/board/calendar/gallery/list content views.
6. Reporting charts always include a table alternative and a textual insight summary.

### Non-negotiable interaction rules

- Minimum touch target 44×44 CSS pixels for icon-only/compact actions.
- Every icon-only action has an accessible name and visible focus state.
- Drag-and-drop has keyboard/menu alternatives.
- Loading over 300 ms uses stable skeletons; no layout shift or mock-data flash.
- Errors state cause and recovery action near the affected control.
- Long brief/report forms preserve a server draft or explicitly warn before discard.
- Toasts use `aria-live="polite"` and never steal focus.
- Status and chart meaning never rely on color alone.
- Animations use transform/opacity, 150–300 ms, and respect reduced motion.
- Lists over 50 visible rows use server pagination or virtualization.
- Body text remains readable; existing 10–12px labels are limited to metadata/table labels.

## 8. API boundary

The current `/marketing/prototype/*` API remains a compatibility adapter during Release
1. New canonical controllers use `/marketing/tasks`, `/marketing/projects`,
`/marketing/brands`, `/marketing/social/posts`, `/marketing/social/reports`, and
`/marketing/social/integrations`.

All list APIs support `page`, `limit`, deterministic `sort`, filters, and return:

```json
{
  "data": [],
  "page": 1,
  "limit": 50,
  "total": 0,
  "hasMore": false
}
```

All mutations return a current `version`; stale writes return HTTP 409. Validation errors
return a stable field-error structure. POST mutations support persistent idempotency.
Secrets are write-only and are never serialized back to the browser.

## 9. Acceptance catalogue

| Acceptance group | Required outcome |
|---|---|
| `AC-TASK-001..013` | Correct deep links, scope, CRUD, workflow, checklist, collaboration, audit, pagination |
| `AC-SOC-001..008` | Brand-aware content lifecycle persists across users and sessions with no sample fallback |
| `AC-REP-001..008` | Period/channel facts reconcile to displayed aggregates and exportable tables |
| `AC-INT-001..002` | Secrets remain server-side; sync exposes freshness, failure, retry, and immutable job history |

Every P0/P1 feature needs positive, permission-denied, validation, empty, loading, API-error,
and concurrency coverage where applicable. Release 1 cannot ship with known P0/P1 defects.

## 10. Phase 1 sign-off

Phase 1 is complete when:

- the machine contract validates;
- every feature has a unique ID, priority, release, route, role, and acceptance ID;
- the deterministic Task entry route contains no localStorage identity routing;
- exactly four Digital Marketing sidebar destinations remain;
- database design in Phase 2 cites this contract;
- migration execution remains blocked until Phase 0 migration divergence is reconciled.
