# Phase 4 Plan — Workflow UI + NEW MVP Requirements (v1.0, 2026-09-11)

> **Scope**: Phase 4 existing (State Machine UI) + NEW MVP requirements (KPI, comms, activity tracking, decision support)
> **Authority**: AUTHORITY-2 (master spec) + AUTHORITY-5 (operational addendum). Where conflicting, see `00_AUTHORITY_HIERARCHY.md`.

## 0. TL;DR (60-second scope)

Phase 4 = 5 workstreams, can run in parallel:
- **WS-A**: State Machine UI (workflow visualization G1/G2/G3) — 1-2 days
- **WS-B**: KPI System (auto-calc per orang + per divisi) — 3-5 days
- **WS-C**: Communication Protocol (task notes + reply + @mention + file attach + notifications) — 3-5 days
- **WS-D**: Activity Tracking (full log + leakage detection) — 2-3 days
- **WS-E**: Decision Support Dashboard — 2-3 days

**Total**: 11-18 days wall-clock (single engineer) or 5-7 days with 2-3 subagents in parallel.

**Critical path**: WS-D (activity log is foundation for WS-B, WS-C, WS-E).

## 1. State Machine UI (WS-A)

### 1.1 Scope
- Workflow visualization canvas for G1 (sample payment), G2 (DP production), G3 (final payment)
- Each gate: current state, prerequisites, who can approve, what unlocks
- Visual node graph: states as nodes, transitions as edges
- Click state node → see who acted, when, evidence (audit log)
- Mount: `/master/workflow/g1`, `/master/workflow/g2`, `/master/workflow/g3`

### 1.2 Components
- Reuse: `DnaDataTableCard`, `DnaBadge`, `DnaButton`
- New: `WorkflowCanvas` (D3.js or react-flow — pick cheapest), `StateNode`, `TransitionEdge`
- Props from `state-transition.service.ts:30` (`GateType`, `TRANSITION_MAP`)

### 1.3 Backend work
- ✅ None — state-transition service already exists, 4 gate-controlled transitions defined
- Verify: `state-transition.service.ts:129-147` `GATE_CONTROLLED_TRANSITIONS`

### 1.4 Acceptance criteria
- Each gate shows: name, description, current state, locked/unlocked, who can override
- Click transition → show audit trail (who approved, when, evidence)
- Works with existing `SalesLead.status` (no schema change)

## 2. KPI System (WS-B)

### 2.1 Scope
- **KPI per orang**: auto-calculated from activity log. Examples:
  - Sales: deals closed this month, follow-up completion rate, average closing time
  - Finance: invoices posted, payments processed, period close time
  - Production: batches completed, QC pass rate, machine utilization
  - R&D: samples processed, formulas locked, time to lock
- **KPI per divisi**: 1 angka agregat per divisi. Formula TBD with user.

### 2.2 Architecture
- **Source**: `auditLog` or new `ActivityLog` table (see WS-D)
- **Calculation**: background job (cron) aggregates per user + per divisi per day/week/month
- **Storage**: `KpiSnapshot` table: `{ userId, division, period, metricKey, value, computedAt }`
- **Display**: `/kpi/me` (my KPI), `/kpi/division` (1 number per divisi), `/kpi/team/[userId]`

### 2.3 Open decisions (need user input)
- What metrics per role? (sales has different KPIs than R&D)
- What formula for divisi 1-angka? (avg of team? weighted by role?)
- What period? (daily snapshot, weekly trend, monthly KPI)
- What's "good" vs "bad"? (thresholds, traffic lights)

### 2.4 Backend work
- New module: `backend/src/modules/kpi/`
- New Prisma models: `KpiSnapshot`, `KpiThreshold`
- New service: `KpiService` (aggregation logic)
- New controller: `GET /kpi/me`, `GET /kpi/division`, `GET /kpi/team/:userId`
- Cron: `KpiAggregationJob` (runs at midnight, snapshot per user/divisi)

### 2.5 Frontend work
- `/kpi/me` — my KPI dashboard (cards + line chart trend)
- `/kpi/division` — divisi 1-angka display (1 big number per divisi, drill-down)
- `/kpi/team/[userId]` — team view (if user is manager)
- All use DnaKpiGrid, DnaStatCard

### 2.6 Acceptance criteria
- KPI auto-calculated, NO manual input
- User can see their own KPI + 30-day trend
- Manager can see team KPI
- Director can see divisi 1-angka + ranking

## 3. Communication Protocol (WS-C)

### 3.1 Scope
- **Task-anchored notes/comments** (not real-time chat like WhatsApp)
- Features:
  - Post comment on any entity (task, SO, PO, production batch, etc.)
  - Reply to comment (threaded)
  - @mention user (notifications)
  - File attach
  - Notifications (in-system, NOT email/WhatsApp)

### 3.2 Architecture
- **Storage**: `Comment` table: `{ id, entityType, entityId, parentId (reply), authorId, body, mentions[], attachments[], createdAt }`
- **Attachments**: file storage (S3 or local), `Attachment` table: `{ id, url, mime, size }`
- **Notifications**: `Notification` table: `{ id, userId, type, entityRef, body, readAt }`
- **Real-time**: NO WebSocket/SSE. Polling or on-page refresh only. (Not chat, just async notes)

### 3.3 Open decisions
- File storage: S3 vs local vs both? (cloud-first or on-prem?)
- Notification delivery: in-app only, or also email digest?
- Mentions: just notify, or also subscribe to thread?
- Comment edit/delete: allowed or immutable audit log only?

### 3.4 Backend work
- New module: `backend/src/modules/comms/`
- New Prisma models: `Comment`, `CommentMention`, `Attachment`, `Notification`
- New service: `CommsService` (create, reply, mention, attach)
- New controller: `POST /comms/comments`, `GET /comms/comments?entityType=X&entityId=Y`, `POST /comms/attachments`, `GET /notifications/me`

### 3.5 Frontend work
- `CommentThread` component (DNA new)
- `CommentInput` component (DNA new, with @mention autocomplete + file upload)
- `NotificationBell` in topbar (DNA new)
- Mount `CommentThread` on: SO detail, PO detail, Production batch detail, Task detail, etc.
- Mount `NotificationBell` in `DnaPageHeader` (already exists)

### 3.6 Acceptance criteria
- User can post comment on any entity
- Reply creates threaded structure
- @mention triggers notification
- File attach works (PDF, image, doc)
- Notification bell shows unread count + dropdown

## 4. Activity Tracking (WS-D)

### 4.1 Scope
- **Full activity log** (immutable, append-only)
- **Leakage detection**: detect work done off-system
- Examples of tracked activities:
  - Login/logout
  - Page views (which page, how long)
  - CRUD operations (create/update/delete what, when, by whom)
  - State transitions (which state, from→to, when)
  - Login failures (potential security)
  - Document opens/edits
  - Time spent on pages (idle detection)
- **Leakage**: if work happens outside system (e.g. external email thread, WhatsApp, physical meetings not logged) → ???

### 4.2 Architecture
- **Storage**: `ActivityLog` table: `{ id, userId, type, entityType?, entityId?, metadata, ip, userAgent, createdAt }`
- **Append-only**: no UPDATE/DELETE allowed (only INSERT)
- **Capture points**: middleware in NestJS (request logger), frontend (page-view hook)

### 4.3 Open decisions
- What is "leakage"? How to detect? Heuristic (e.g. SO created via system but no comment for 3 days = suspicious)?
- Retention: how long? (90 days? 1 year? forever?)
- Privacy: log personal data? (GDPR-like concerns)
- Performance: async write or sync write? (recommend async queue)

### 4.4 Backend work
- New module: `backend/src/modules/activity-log/`
- New Prisma model: `ActivityLog` (append-only, indexed by userId+createdAt, entityType+entityId+createdAt)
- New service: `ActivityLogService` (single API: `log(activity)`)
- New controller: `GET /activity-log/me?from=X&to=Y` (user's own log), `GET /activity-log/user/:id` (admin)
- Middleware: NestJS interceptor to auto-log all `POST/PUT/PATCH/DELETE` requests
- Cron: nightly aggregation per user per day (for KPI consumption)

### 4.5 Frontend work
- `useActivityLog()` hook: auto-log page views
- `ActivityTimeline` component (DNA new) — for entity detail pages

### 4.6 Acceptance criteria
- Every CRUD op logged
- Every state transition logged
- Every page view logged
- Leakage heuristic: no comments for X days on a critical entity = flag

## 5. Decision Support Dashboard (WS-E)

### 5.1 Scope
- Help users + CEO make decisions faster
- Examples:
  - "Which SO has been pending Gate 2 (DP) for >7 days?" (action: chase customer)
  - "Which R&D sample has highest revision count this month?" (action: prioritize review)
  - "Which vendor has >3 rejected deliveries this quarter?" (action: switch vendor)
  - "Which employee has 0 closed activities this week?" (action: check in)
  - "What's our cash position forecast for next 30 days?" (action: AR collection)
- Surfaced as: **bento cards on dashboard** + **alerts/notifications** for outliers

### 5.2 Architecture
- **Source**: ActivityLog + state-transition data + entity tables
- **Computation**: scheduled job (cron) computes daily "decision cards"
- **Display**: home dashboard `/dashboard/decisions` — bento layout

### 5.3 Open decisions
- Which decisions to surface? (user's call)
- Format: bento cards, table, chart?
- Personal vs divisional vs CEO view?

### 5.4 Backend work
- New module: `backend/src/modules/decisions/`
- New service: `DecisionCardService` (computes "what needs attention")
- New controller: `GET /decisions/me`, `GET /decisions/division`, `GET /decisions/company`

### 5.5 Frontend work
- `DecisionCardGrid` component (DNA new, bento layout)
- `AlertBanner` component (DNA new, top of page)
- Mount on `/dashboard/decisions` (new page)

### 5.6 Acceptance criteria
- Each card has: title, why-it-matters, recommended-action, data-points
- Click card → drill into entity
- Cards refresh daily (no real-time)
- User can dismiss/snooze cards (track dismissal)

## 6. Sequencing & Parallelization

### Critical path
**WS-D (Activity Tracking)** is foundation for:
- WS-B (KPI needs activity log)
- WS-C (Communications needs activity context)
- WS-E (Decision Support needs activity patterns)

### Recommended order
1. **Day 1-2**: WS-D scaffolding (ActivityLog table, log API, frontend hook)
2. **Day 3-5**: WS-A (State Machine UI) + WS-C scaffolding (Comment table, basic UI)
3. **Day 6-8**: WS-B (KPI calculations) + WS-C (full features: mention, attach)
4. **Day 9-10**: WS-E (Decision cards)
5. **Day 11-14**: integration testing, polish, e2e verification

### Parallel subagents
- Day 1-2: 1 subagent for WS-D scaffolding
- Day 3-5: 2 subagents in parallel (WS-A + WS-C scaffolding)
- Day 6-8: 2 subagents in parallel (WS-B + WS-C full)
- Day 9-10: 1 subagent for WS-E

## 7. Common Infrastructure Needed

All 5 workstreams need:
- `userId` (FK to User)
- `divisionId` (FK to Division) — need to verify Division model exists
- `entityType` + `entityId` polymorphic references
- `createdAt` timestamp

Check: `backend/prisma/schema/*.prisma` for User + Division models. May need to add missing FK.

## 8. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| KPI formula rejected by user | Refactor UI + aggregation | Get user sign-off on formulas before implementation |
| Activity log too verbose | Performance | Async queue, batch writes, sampling |
| Comments in-system vs real users want WhatsApp | UX gap | Show in-app notification "you have new comment", let user check at their pace |
| Decision cards noisy | User ignores | Allow snooze + dismiss; rank by severity |
| New Prisma models require migration | Time | Use `prisma migrate dev` per new model |
| Division model doesn't exist | Can't compute divisi KPI | First add Division if missing |

## 9. Acceptance Criteria (Phase 4 complete)

- [ ] WS-A: User can see workflow visualization for any gate, click state, see audit trail
- [ ] WS-B: User sees their own KPI auto-calculated, no manual input needed
- [ ] WS-B: Director sees 1 angka per divisi with formula visible
- [ ] WS-C: User can post comment on any entity, reply, @mention, attach file
- [ ] WS-C: Notification bell in topbar shows unread count
- [ ] WS-D: Every CRUD + state transition + page view logged
- [ ] WS-D: Leakage heuristic flags suspicious idle (e.g. critical entity no activity X days)
- [ ] WS-E: CEO dashboard shows decision cards with action recommendations
- [ ] All WS pass tsc + lint clean
- [ ] Smoke test 5 golden threads (PO Inbound, SO Pipeline, Production, AR Close, Period Close)

## 10. Reference

- `docs/ssot/HANDOFF_AUDIT_SUMMARY.md` — project state, LOCKED decisions, file paths
- `docs/ssot/00_AUTHORITY_HIERARCHY.md` — governance, conflict resolution
- `docs/legacy-erp/NEX_ERP_OPERATIONAL_ADDENDUM.md` — formulas, defaults, UI labels
- `docs/legacy-erp/API_CONTRACT.yaml` — transport contract (272 paths)
- `docs/plan/_MASTER_TRACKER.md` — overall plan

---

*Plan version 1.0, 2026-09-11. Author: previous chat session. User: Luthfi.*
