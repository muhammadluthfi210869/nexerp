# OmniCRM MVP — Phase 0 Contract (Scope & Goals)

**Status:** Locked scope for OmniCRM MVP, frozen 2026-09-11.
**Branch:** `feature/omnicrm-mvp` (based on `origin/production-light`)
**Audience:** Head of Marketing, Sales / BusDev team, Director
**Author:** Marketing MVP workstream (Phase 1 of 6)

---

## 1. Why this exists

Head of Marketing needs an **Omni CRM-like** surface inside the existing ERP —
not a separate tool — to operate the lead → sales pipeline that today leaks
through WhatsApp DMs, scattered Google Sheets, and a third-party Kommo CRM whose
API keeps expiring. The MVP must:

- Receive leads from the director's website (`dreamlab.id`) round-robin across
  5 thank-you page variants (organic, google-ads, metaads, medsos, ads), with
  full UTM/attribution preserved.
- Track which BusDev picked up which lead, and let BusDevs approve buku-tamu
  (visitor log) entries as they arrive.
- Allow Marketing to broadcast WhatsApp messages to filtered lead audiences
  (by stage, by traffic source) via a composer.
- Show a real-time WhatsApp monitor (inbound + outbound, 3 channels).
- Expose a Sales KPI dashboard (reply rate, first-response time, conversion
  by stage, broadcast deliver/read, buku-tamu count, round-robin distribution).

This is delivered as a new sidebar destination `/marketing/omnicrm` with 5
sub-views. It must not fork the existing backend; it extends
`backend/src/modules/crm/` (new module — production-light does not have it
yet; phase-3 had it; we re-create cleanly here).

## 2. What is in scope (MVP, 6 phases)

| # | Surface | URL | Purpose |
|---|---------|-----|---------|
| 1 | **Leads inbox** | `/marketing/omnicrm` (default tab) | Kanban board by stage. Drag-drop moves lead between stages. |
| 2 | **Buku Tamu** | `/marketing/omnicrm/guestbook` | Visitor event log with APPROVE / REJECT actions. |
| 3 | **Broadcast composer** | `/marketing/omnicrm/broadcast` | Compose WA message + audience filter → send via Meta Cloud. |
| 4 | **Real-time WA monitor** | `/marketing/omnicrm/monitor` | Live list of WhatsApp messages, 3 channels, INBOUND/OUTBOUND. |
| 5 | **Sales KPI tiles** | `/marketing/omnicrm/kpi` | 6 tiles: leads today, by stage, avg first response, reply rate, broadcast stats, buku-tamu count. |

All 5 surfaces live under a single sidebar entry "OmniCRM" — this is the 4th
frozen sidebar slot (per `docs/design/LAYOUT_GOVERNANCE.md` Sidebar Rule 1).

## 3. What is NOT in scope (deferred to Release 2)

- Multi-WA-number per BusDev (single Meta WABA only).
- Pipeline visual editor (manual config in DB for now).
- Salesbot visual flow builder (manual rules + Ami Incoming only).
- CPL / ROAS pull from Meta Ads spend + GSC clicks (KPI tiles are internal only).
- TikTok / YouTube comment sync.
- 8 dashboard Direksi pages (locked shadcn per `nex-erp-refactor-scope.md`).
- `samples/omni-crm/` and `samples/lead-capture/` prototype pages (delete after production route is live).

## 4. Roles & RBAC

| Role | OmniCRM access |
|------|----------------|
| `SUPER_ADMIN` | Full read/write, all leads, all broadcasts |
| `HEAD_OPS` | Full read/write, all leads, all broadcasts |
| `MARKETING` | Full read/write (composer + KPI + buku-tamu approval) |
| `DIGIMAR` | Read all, write only on `assignedTo == self.id` |
| `COMMERCIAL` | Read all leads assigned to their busdev team |
| `DIRECTOR` | Read all KPI tiles only (no write) |

Write operations:
- `POST /crm/leads/:id/stage` (PATCH) — `MARKETING,SUPER_ADMIN,HEAD_OPS`
- `POST /crm/guestbook/:id/approve` — `MARKETING,SUPER_ADMIN,HEAD_OPS,COMMERCIAL`
- `POST /crm/broadcasts` (compose + send) — `MARKETING,SUPER_ADMIN,HEAD_OPS`
- `PATCH /crm/busdevs/:id/status` — `MARKETING,SUPER_ADMIN,HEAD_OPS`

Read operations:
- `GET /crm/leads` (filtered by RBAC) — all 6 roles
- `GET /crm/kpi/summary` — all 6 roles
- `GET /crm/busdevs` — all 6 roles
- `GET /crm/guestbook/events` — all 6 roles

`MARKETING_DEV_AUTH_BYPASS=false` in production env. Auth uses the existing
JWT flow from `backend/src/modules/auth/`.

## 5. Status machine (FIVE_STAGE_FUNNEL)

Canonical stages, frozen 2026-09-11. Reused from
`omnicrm---core-engine-&-whatsapp-coexistence/src/data/initialState.ts`:

```
LEADS_MASUK  →  COLD  →  WARM  →  HOT  →  SAMPLE  →  CLIENT_DEAL  (won)
   ↓              ↓       ↓       ↓
JUNK_LEADS      CLOSED_LOST      CLOSED_LOST  (loss stages)
```

| Stage | Color | Tag | Notes |
|-------|-------|-----|-------|
| `LEADS_MASUK` | `#06b6d4` | `meta/google/tiktok/linktree/webform/booth tamu → Ami Incoming bot` | Default for new leads from webhook |
| `COLD` | `#64748b` | outreach, belum responsif | Auto-tag if no inbound within 48h |
| `WARM` | `#f59e0b` | konsultasi MOQ, katalog | Manual move |
| `HOT` | `#ef4444` | minta HPP, penawaran, meeting | Manual move |
| `SAMPLE` | `#a855f7` | kirim tester | Manual move |
| `JUNK_LEADS` | `#475569` | spam detection | Loss stage |
| `CLIENT_DEAL` | `#10b981` | SPK + DP | Won stage |
| `CLOSED_LOST` | `#71717a` | disqualified | Loss stage |

Stage transition rules enforced server-side:
- Cannot move backward from `JUNK_LEADS` or `CLOSED_LOST`.
- Cannot move to `CLIENT_DEAL` without `lostReason == null && wonAt == null`.
- Every transition writes a `LeadAudit` row with `fromStage`, `toStage`, `actorId`, `at`.

## 6. Canonical fields for `CrmLead`

`CrmLead` is a pointer/aggregation over the existing `LeadCapture` row (not a
duplicate). Schema lives in `backend/prisma/schema/crm.prisma`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | UUID | PK | Prisma default |
| `leadCaptureId` | UUID | FK → `LeadCapture.id` | The upstream row |
| `stage` | enum `CrmStage` | new | One of 8 above |
| `displayName` | string(120) | user-editable | Override `LeadCapture.extractedFullName` for UI |
| `phone` | string(30) | `LeadCapture.phone` | Display only |
| `source` | enum `LeadSource` | `LeadCapture.source` | organic / google-ads / metaads / medsos / ads / dreampreneur |
| `pageUrl` | text | `LeadCapture.pageUrl` | For drawer detail |
| `assignedToId` | UUID | FK → `User` | Round-robin agent |
| `firstInboundAt` | timestamp | computed | First `LeadMessage.direction=INBOUND` |
| `firstOutboundAt` | timestamp | computed | First `LeadMessage.direction=OUTBOUND` |
| `firstResponseAt` | timestamp | computed | First INBOUND after first OUTBOUND |
| `lastInboundAt` | timestamp | computed | Latest INBOUND |
| `lastOutboundAt` | timestamp | computed | Latest OUTBOUND |
| `createdAt` | timestamp | default now() | |
| `updatedAt` | timestamp | @updatedAt | |

Computed columns are denormalized for KPI query speed. Updated by trigger /
service on every `LeadMessage` insert.

## 7. Acceptance catalogue (20 cases)

These will become the Jest + Playwright test cases in Phase 5.

| # | Case | Phase |
|---|------|-------|
| 1 | Lead arriving from `POST /crm/leads/ingest` lands in `LEADS_MASUK` with `assignedToId` populated | 5 |
| 2 | HMAC validation rejects requests with wrong/missing `X-Dreamlab-Signature` | 5 |
| 3 | HMAC validation rejects replayed body (timestamp window 5 minutes) | 5 |
| 4 | Stage machine rejects `LEADS_MASUK → JUNK_LEADS → LEADS_MASUK` (backward) | 5 |
| 5 | Stage transition writes one `LeadAudit` row atomically | 5 |
| 6 | `PATCH /crm/leads/:id/displayName` updates only `displayName`, not other fields | 5 |
| 7 | `GET /crm/leads?stage=HOT` returns only HOT leads | 5 |
| 8 | `GET /crm/leads` for `DIGIMAR` returns only leads where `assignedToId == self.id` | 5 |
| 9 | `POST /crm/guestbook/:id/approve` sets `GuestbookEvent.approvalStatus=APPROVED` + creates Ami Incoming intro WA | 5 |
| 10 | `POST /crm/broadcasts` with empty recipient list returns 400 | 5 |
| 11 | `POST /crm/broadcasts` with template > 1024 chars returns 400 | 5 |
| 12 | `GET /crm/kpi/summary.replyRate` returns 0 when no outbound exists (no division by zero) | 5 |
| 13 | `GET /crm/kpi/summary.roundRobinDistribution` groups by `assignedToId` correctly | 5 |
| 14 | Buku Tamu APPROVE only allowed for `MARKETING,SUPER_ADMIN,HEAD_OPS,COMMERCIAL` | 5 |
| 15 | Broadcast composer rejected for `DIGIMAR` (403) | 5 |
| 16 | WA monitor subscribes to SSE gateway, new INBOUND appears within 5s | 5 |
| 17 | Leads inbox kanban drag-drop triggers `PATCH /crm/leads/:id/stage` | 5 |
| 18 | LeadDetailDrawer shows phone, displayName (editable), full WA message timeline | 5 |
| 19 | KpiTiles refresh every 30s, shows fresh numbers after a new lead ingested | 5 |
| 20 | RoundRobinStrip shows 5 BusDevs with their today's lead count | 5 |

## 8. Definition of done

- All 5 surfaces live on `https://nexerp.id/marketing/omnicrm/*`.
- Lead ingestion from `dreamlab.id/ads/thankyou/*` arrives in ERP buku-tamu within 30s.
- BusDev can click APPROVE in buku-tamu → lead appears in inbox within 1s.
- Marketing can compose a broadcast → messages delivered via WA within 5 minutes (Meta Cloud SLA).
- KPI tiles update every 30s with real numbers.
- All 20 acceptance cases green in CI.
- `docs/QA_GATE.md` checklist completed + gate report entry written.

---

**Frozen by:** Marketing MVP workstream
**Date:** 2026-09-11
**Next:** Phase 1 — Database foundation (Prisma migration + new module registration)
