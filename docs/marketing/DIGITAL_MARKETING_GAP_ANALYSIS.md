# Digital Marketing Gap Analysis

**Snapshot:** 2026-09-13
**Scope:** OmniCRM (crm_leads + ingest + UI), Marketing Reports workspace, Executive Audit Logs view, Activity-Log ingest path, Management Task feature.

---

## 1. Backend gaps

- **No CRUD for lead messages timeline.** Schema has `CrmLead.firstInboundAt / firstOutboundAt / firstResponseAt / lastInboundAt / lastOutboundAt` (`backend/prisma/schema/crm.prisma:31-35`) but no `CrmLeadMessage` table. BusDevs cannot see per-lead conversation history. Either add a new table or reuse `communication.prisma Message` rows scoped by `crmLeadId`.

- **No lost-deals write path into CRM.** CRM kanban writes `lostAt / lostReason` (`crm.prisma:42-43`) but no service method to populate them from a kanban action. Endpoint `POST /crm/leads/:id/lost` missing. The legacy `bussdev.prisma:97-109` `lost_deals` table is wired to the old `SalesLead`, not `CrmLead`.

- **No `GET /crm/leads/:id/audits`.** `lead_audits` rows (`crm.prisma:76-91`) get written on INGEST and STAGE_CHANGE but no controller exposes them. UI shows current stage with no history.

- **HMAC env silently misconfigures prod.** `lead-svc-webhook.controller.ts:62-66` returns `401 "Server not configured"` when `LEAD_SVC_INGEST_SECRET` is empty — correct behaviour, but `backend/.env.example` did not document the var (now added). Easy to forget on fresh deploy.

- **RBAC matrix holes.** `BusDevsController` allows `DIGIMAR` (`busdevs.controller.ts:22-25`); `LeadsController.list` only auto-scopes `DIGIMAR` and gives full access to `MARKETING / COMMERCIAL / SUPER_ADMIN / HEAD_OPS` (`leads.service.ts:54-61`). No canonical role for `BUSDEV`/`SALES_LEAD` viewing their own leads only — they go through `DIGIMAR` today. Decide and document.

- **Throttle coverage thin.** Ingest is throttled at 30/min (`lead-svc-webhook.controller.ts:56`). `/crm/leads/*` read endpoints have no per-user throttle — the 30 s UI refresh can hammer the DB when many BusDevs have the dashboard open.

- **RFC 7807 not used.** All `HttpException` payloads are plain strings (`activity-log.controller`, `lead-svc-webhook.controller.ts:65,73`). Frontend cannot switch on `type` URIs. Adopt Nest's default exception filter that emits `application/problem+json`.

- **No mark-as-junk endpoint.** `CrmStage` enum includes a JUNK-like stage (verify `enums.prisma`); no service method to transition `LEADS_MASUK → JUNK` with an audit row.

- **No `CrmStage` / `LeadSource` seeder.** `backend/prisma/seed*.ts` (30+ files) cover everything except `CrmStage` enum mapping and `LeadSource` enum exposure. Frontend hardcodes `"WEBSITE"`, `"META_ADS"` strings; one enum rename = silent runtime miss.

---

## 2. Database gaps

- **No `CrmLead` seeder anywhere.** Confirmed: `backend/prisma/seed-leads.ts` covers the legacy `SalesLead`, not `CrmLead`. Lead ingestion is the only path. Test fixtures must round-trip through the HMAC webhook or be added via a new `seed-crm.ts`.

- **`crm_leads.assignedToId` has no `@relation`.** `crm.prisma:30` declares `assignedToId String? @db.Uuid` without `assignedTo User? @relation(...)`. Prisma will not enforce referential integrity or allow `include: { assignedTo: true }` joins without raw SQL.

- **Missing indexes** (covered by `leads.service.ts:64-76` queries):
  - `@@index([assignedToId, createdAt])` — currently only `@@index([assignedToId, stage])` (`crm.prisma:49`). BusDev inbox paginates by `assignedToId ORDER BY createdAt DESC`.
  - `@@index([source, createdAt])` — only `@@index([source])` (`crm.prisma:51`). Source-filter kanban group-by will full-scan.
  - `@@index([ingestedAt])` — schema uses `createdAt` as proxy. If `firstInboundAt` becomes the canonical ingest timestamp, index it.
  - `@@index([leadCaptureId])` — declared `@unique` (`crm.prisma:16`) so unique index already exists.

- **No FK between `CrmLead` ↔ `BussdevStaff`.** `crm_leads.assignedToId` → `User.id` (via the missing relation above); `BussdevStaff.userId` → `User.id` (`bussdev.prisma:121`). Two hops to answer "is this lead owned by an active BusDev?". Add denormalized `crm_leads.bussdevStaffId String? @db.Uuid` + `@relation` to skip the join.

- **No media tracking tables.** The dreamlab-erp reference's `ContentPlannerView` plans posts per channel, but no `PlannedPost` / `PublishedPost` / `ChannelMetric` tables exist in `marketing.prisma`. Brand report channel sections (TikTok/YouTube/Website/PaidAds) read from hardcoded fixtures in `BrandReportingView.tsx:330-335`.

- **Dreamlab DB coupling risk.** `backend/src/modules/crm/dreamlab/dreamlab-prisma.service.ts` opens a second Prisma client to the dreamlab.id database for round-robin historical view. Single point of failure: dreamlab DB outage = historical KPIs blank. Cache the last good snapshot in a `crm_round_robin_snapshots` table.

---

## 3. Frontend gaps

- **`TaskWorkspaceV2.tsx` stale comment.** Lines 3-5 claim it uses `marketingService` + localStorage, but the code uses canonical hooks (`useMarketingTasks` etc., per commit `2362af9`). Comment out of sync with code.

- **V1 dead code.** `TaskWorkspace.tsx` (V1) is not mounted by any route. Delete or document as historical.

- **`/samples/*` parallel route group.** `frontend/src/app/samples/` exists with demo routes not mounted in the dashboard. Confuses build output and bundle analysis. Either delete or gate behind a `NEXT_PUBLIC_ENABLE_SAMPLES` flag.

- **Brand report pages lack channel sections.** `BrandReportingView.tsx:331-335` declares `defaultTikTok / defaultYouTube / defaultWebsite / defaultMeta / defaultGoogle` but the rendered output only shows funnel + totals. TikTok / YouTube / Website / PaidAds sections exist in the `BrandReport` type but are not rendered.

- **No planner view.** `ContentPlannerView` from the dreamlab-erp reference (`dreamlab-erp-—-task-&-social-media-management/src/components/ContentPlannerView.tsx`) was never ported. BusDevs cannot see scheduled posts alongside leads.

- **No executive summary dashboard.** `executive/audit/page.tsx` shows raw rows. No rollup (mutations/day by role, top actors, risk heatmap).

- **Field-mismatch pattern.** `executive/audit/page.tsx` read `entityType` / `log.hash` / `log.user.name` while backend returned `entity` / no `hash` / flat `user` string. Fix landed (`fix(audit): align ...`). Apply the same contract-check pass to sibling dashboard views:
  ```
  grep -rn '\.user\.name\|\.user\.role\|\.entityType\|\.hash\.substring' frontend/src/app/\(dashboard\)
  ```

- **Sub-page layout drift.** Sidebar has separate `/marketing/reports/dreamlab` and `/marketing/reports/toribio` entries (Sidebar.tsx:138-141), but both wrap the same `BrandWorkspace` component. The dreamlab-erp reference treats each brand as a top-level workspace with its own sidebar entry and channel sections — currently collapsed into a single component.

---

## 4. Ops gaps

- **Frontend TS errors block clean deploy.** Run `pnpm tsc --noEmit` in `frontend/` before deploy and block on zero errors. Current state unknown; confirm in CI.

- **nginx `/v1` → backend rewrite missing on default.conf.** Per Wave 4 E2 deploy memory: nginx `default.conf` lacks `location /v1/ { proxy_pass http://backend:3002/v1/; }`, so production frontend calls `/v1/...` and gets 404. Add to `infra/nginx/default.conf` and reload.

- **CF Tunnel vs Cloudflare Pages deployment undecided.** Decide once: Cloudflare Pages for the frontend static export (cheaper, simpler) vs CF Tunnel + VM (current setup). Document choice in `docs/RUNBOOK-DEPLOY-DAN-TEST-OMNICRM.md`.

- **`LEAD_SVC_INGEST_SECRET` not in prod env.** Add to prod env file (PM2 ecosystem / systemd `EnvironmentFile` / Compose) AND share with dreamlab.id `lead-svc-deploy`. Generate with `openssl rand -hex 32`. Documented in `docs/marketing/OMNICRM-DEPLOY.md` §Secrets.

- **No automated seed → UI roundtrip verification.** Manual smoke only. Add a Playwright spec that POSTs one lead via HMAC curl, then asserts it appears in `/marketing/omnicrm` within the 30 s polling window.

- **Mock-only tests.** Specs in `backend/src/modules/crm/__tests__/` use `prismaMock` / `roundRobin` mocks; no test hits a real Postgres. Add one integration spec per module under `__tests__/integration/` that uses `prisma db push` against an ephemeral DB.

---

## 5. Process gaps

- **No E2E spec for CRM ingest.** Add `frontend/e2e/crm-ingest.spec.ts` using Playwright + a test-only HMAC helper that POSTs to `/crm/leads/ingest`, then asserts the row appears in the UI.

- **No integration test for HMAC.** `lead-svc-webhook.controller.spec.ts` covers validation logic with mocks; add one test that hits a real Express instance with a real signature to catch header-parsing / body-parse-order bugs.

- **Missing PR template reminder.** Add to `.github/pull_request_template.md` (or create one) a "Manual smoke test" section: which backend, which curl, which UI page to verify, expected log line. Forces author + reviewer to actually run it before merge.

- **No rollback drill documented.** When a marketing feature ships and breaks lead ingest, the runbook should say: revert commit → drain dreamlab.id HMAC queue → restart backend → verify. Currently ad-hoc.

- **Skill/SOP missing for "first deploy of CRM feature".** Each new CRM PR invents the deploy dance. Capture the canonical steps in `docs/marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md` or a new SOP doc.

---

## Prioritised remediation order

1. **Secrets & ingest** — `LEAD_SVC_INGEST_SECRET` in prod env (Part 2 of fix plan covers local). Without it, every lead silently 401s.
2. **Backend contract alignment** — `executive.service.ts` payload shape (Fix A done). Audit siblings for the same pattern.
3. **Frontend defensive guards** — `BrandReportingView` brandId nullish (Fix B done). Search siblings for `.toLowerCase()` chains on optional fields.
4. **Bug surface area** — activity-log user-agent (Fix C done). One-line Prisma-coercion class of bug likely elsewhere (other req.headers reads).
5. **Database schema** — add the `@relation`, the missing indexes, and a `CrmLead` seeder. Single migration, low risk, high payoff for BusDev inbox performance.
6. **Tests** — one integration spec per CRM module, one Playwright E2E for ingest. Forces the next regression to surface in CI, not prod.
7. **Frontend feature parity** — port `ContentPlannerView` + render the unused channel sections. Multi-day effort, scope as a separate phase.

---

## Related docs

- `docs/marketing/OMNICRM-DEPLOY.md` — deploy runbook
- `docs/marketing/PHASE-0-OMNICRM-CONTRACT.md` — ingest contract (HMAC headers, replay window)
- `docs/marketing/MANAGEMENT-TASK-SSOT-CONTRACT.md` — task management contract
- `docs/RUNBOOK-DEPLOY-DAN-TEST-OMNICRM.md` — full QA + deploy runbook