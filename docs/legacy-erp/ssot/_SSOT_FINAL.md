# SSOT — Single Source of Truth (Index)

> **PROVENANCE / HISTORICAL INDEX — NOT RUNTIME AUTHORITY.**
> Implementasi mengikuti pemilik subjek di `../contracts/00_MASTER_SPEC.md §9.1`.
> Versi: 3.0 | Tanggal: 2026-09-16 | Workflow: **Doc-first**

---

## 1. Cara Baca SSOT Folder

```
docs/legacy-erp/
├── README.md                  ← Human entry (folder overview)
├── AGENTS.md                  ← AI CLI entry (with task lookup)
│
├── ssot/                      ← 4 overview SSOT docs
│   ├── _SSOT_FINAL.md          ← MASTER INDEX (this file)
│   ├── _SSOT_AUTH.md           ← Auth spec
│   ├── _SSOT_COMMUNICATION.md  ← Comm protocol
│   └── _SSOT_KPI_BENCHMARK.md  ← KPI targets
│
├── process/                   ← 3 process docs
│   ├── _PROCESS_DECISIONS_LOG.md  ← 36+ decisions
│   ├── _PROCESS_CRAWL_STATUS.md   ← Recon log
│   └── _PROCESS_CLEANUP_LOG.md    ← Cleanup history
│
├── contracts/                 ← canonical contracts; current certification status PROVISIONAL
│   ├── 00_MASTER_SPEC.md
│   ├── 01_DOMAIN_MODEL.md
│   ├── schema.prisma
│   ├── 02_DATA_OWNERSHIP.yaml
│   ├── 03_WORKFLOW_STATE_MACHINE.yaml
│   ├── 04_BUSINESS_RULES.md
│   ├── 05_API_CONTRACT.yaml
│   ├── 06_SCREEN_CONTRACT.json
│   ├── 07_RBAC_MATRIX.yaml
│   ├── 08_INTEGRATION_EVENT_CONTRACT.yaml
│   ├── 09_NON_FUNCTIONAL_CONTRACT.md
│   └── 10_TRACEABILITY_MATRIX.yaml
│
├── reference/                 ← External specs (legacy + NEX base)
│   ├── REQUIREMENT.md
│   ├── NEX_ERP_MASTER_SPECIFICATION.md
│   ├── NEX_ERP_SCREEN_AND_API_CATALOG.json
│   ├── NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md
│   ├── NEX_FINANCE_FINAL_SPEC.md
│   ├── API_CONTRACT.yaml
│   ├── KPI_REFERENCE.md
│   ├── LEGACY_ERP_SPEC.md
│   ├── LEGACY_ERP_AUDIT.md
│   ├── kil_erp_full_inventory.csv
│   └── kil_erp_full_inventory_v2.csv
│
├── data/                      ← Raw data
│   ├── crawl/                 ← 93 live URLs
│   ├── master/                ← 7 CSV exports
│   └── analytics/             ← 25 unique analytical docs
│
└── _archive/                  ← Historical
    ├── backend/               ← Project management
    └── _AUDIT_ANALYSIS_2026-09-09.md
```

> **Doc tier convention** (in `ssot/` + `contracts/` + `process/`):
> - `_SSOT_*.md` = **Spec docs** (what we're building)
> - `_PROCESS_*.md` = **Process docs** (how we work)
> - `00-10` numbered = **Implementation contracts** (detailed, locked)

---

## 2. Executive Summary

### 2.1. Reconnaissance Hasil

| Domain | URLs crawled | HTTP 200 | HTTP 404 |
|--------|--------------|----------|----------|
| Sales pipeline | 18 | 17 | 1 |
| Purchase pipeline | 16 | 14 | 2 |
| Master data | 22 | 21 | 1 |
| Production + R&D + QC + Checklist | 16 | 16 | 0 |
| Reports + Ops + Finance | 21 | 21 | 0 |
| **TOTAL** | **93** | **89** | **4** |

**4 halaman 404** (semua child entities, dibuat dari parent detail):
- `/sales-invoice/create` → dari `/sales/{id}` "Buat Faktur"
- `/purchase-in/create` → dari `/purchase/{id}` "Buat GR"
- `/purchase-invoice/create` → dari `/purchase/{id}` "Buat Faktur"
- `/formulation-manage/create` → dari `/formulation-manage/{goods_id}/create`

### 2.2. Implementation Contracts Overview (11 docs, 1.3 MB, 37K baris)

| Doc | Size | Scope |
|---|---|---|
| 00_MASTER_SPEC.md | 48KB | Modules, actors, glossary, 52 principles |
| 01_DOMAIN_MODEL.md | 75KB | 78 entities, relationships, ER diagram |
| schema.prisma | 93KB | Concrete Prisma schema |
| 02_DATA_OWNERSHIP.yaml | 51KB | 74 entities with owners + 14 cross-module rules + 7 delegations |
| 03_WORKFLOW_STATE_MACHINE.yaml | 101KB | 36 entities, 129 transitions, 94 forbidden |
| 04_BUSINESS_RULES.md | 82KB | 105 rules (Indonesian, 100% REQUIREMENT.md coverage) |
| 05_API_CONTRACT.yaml | 230KB | OpenAPI 3.0.3, 297 operations |
| 06_SCREEN_CONTRACT.json | 359KB | 178 screens across 11 modules |
| 07_RBAC_MATRIX.yaml | 88KB | 43 roles × 86 permissions |
| 08_INTEGRATION_EVENT_CONTRACT.yaml | 36KB | 59 events across 10 modules |
| 09_NON_FUNCTIONAL_CONTRACT.md | 33KB | NFR: tech stack, timezone, currency, security |
| 10_TRACEABILITY_MATRIX.yaml | 122KB | Req → Rule → Workflow → Entity → API → Screen → Test |

### 2.3. Tier SSOT (Single Source of Truth)

| Tier | Definisi | Sumber |
|------|----------|--------|
| **T1 — Live Code** | Yang ada & berjalan di `kil.gserp.id` | `_crawl/*.html` + `_crawl/*.json` |
| **T2 — Spec Spec** | Definisi new ERP | `NEX_ERP_MASTER_SPECIFICATION.md` + `NEX_ERP_SCREEN_AND_API_CATALOG.json` |
| **T3 — Parity Spec** | Klasifikasi fungsi (KEEP/UPGRADE/etc.) | `raw/ERP_FUNCTIONAL_PARITY_MATRIX.md` |
| **T4 — KPI Spec** | Definisi KPI per divisi | `KPI_REFERENCE.md` + `_SSOT_KPI_BENCHMARK.md` |
| **T5 — Auth Spec** | JWT + Refresh + RBAC + MFA | `_SSOT_AUTH.md` |
| **T6 — Communication Spec** | Notes + transfer + tags | `_SSOT_COMMUNICATION.md` |
| **T7 — Decision Log** | Track semua keputusan | `_PROCESS_DECISIONS_LOG.md` |
| **T8 — Implementation Contract** | Detailed implementation contracts | `_IMPLEMENTATION_CONTRACTS/00-10` |

### 2.4. Key Decisions Made (See `_PROCESS_DECISIONS_LOG.md`)

36+ locked decisions including:
- DEC-001: `docs/legacy-erp/` = single SSOT folder
- DEC-002: Doc-first workflow (ubah spec sebelum code)
- DEC-003: JWT + Refresh Token (long-lived)
- DEC-004: Communication = notes + transfer + tags (no chat)
- DEC-005: KPI = national + global, multi-industry; pembatasan historis per-person superseded 2026-09-17
- DEC-006: Old ERP shutdown 6-9 bln, aman 1 tahun
- DEC-007: Stock intelligence REMOVE
- DEC-008-009: Finance spec = `NEX_FINANCE_FINAL_SPEC.md`, Requirement = `REQUIREMENT.md` (selalu menang)
- DEC-011: Auth data extraction dari legacy (Phase 6)
- DEC-015-019: Cart pattern, child entity creation, `sales_details_id` bridge, FALLBACK removal, format kode universal
- DEC-022-026: Password hash verify, orphan role 10, permission slugs preservation, legacy ID preservation, auth extraction complete
- DEC-027-034: Soft-delete middleware, IDR integer API, audit 3-tier retention, canonical error codes, idempotency keys, perf floor, data residency Indonesia, S3 presigned URLs
- DEC-035: Historical lock claim from 2026-09-16; superseded by the current certification report
- DEC-036: 06_SCREEN_CONTRACT.json supplemented after network failure

---

## 3. Sub-SSOT Documents (Quick Links)

### 🔐 `_SSOT_AUTH.md` — Authentication & Authorization
- JWT (15 min access) + Refresh Token rotation (30 days)
- Long-lived sessions (production staff)
- RBAC with 16+ roles + permission granularity
- MFA optional (TOTP, admin-enrollable)
- Password policy: 10 char, expiry 90 days, bcrypt(12)
- Phase 6: extract all users + roles + permissions from legacy

### 💬 `_SSOT_COMMUNICATION.md` — Communication Protocol
- **Per-entity communication layer**: notes, status transitions, tags, cross-ref comments
- **Document transfer status** with SLA per pipeline stage
- **@mention tags** with in-app + email notification
- **NO real-time chat** (explicit user decision)
- Badge polling per module (legacy pattern preserved)
- Sidebar notification center

### 📊 `_SSOT_KPI_BENCHMARK.md` — KPI Benchmark Reference
- **National (ID) + Global** benchmark, **multi-industry**
- Covers 10 domains: QC, Production, Digimar, BusDev, Finance, SCM, Warehouse, R&D, HR, System
- Each KPI: National range, Global range, Recommended target
- Per-person KPI = **IN SCOPE** melalui REQ-035/036; benchmark global tetap menjadi referensi target, bukan pengganti scorecard individu
- Quarterly review (3 bulan sekali)
- Admin can override per division

### 📋 `_PROCESS_DECISIONS_LOG.md` — Decisions Log
- 36+ locked decisions (DEC-001 s/d DEC-036)
- 9+ pending decisions (OD-1 s/d OD-9+)
- Workflow reminder: doc-first before code
- Each entry: rationale, implications, affected spec docs

---

## 4. Implementation Contracts (Quick Links)

### `_IMPLEMENTATION_CONTRACTS/00_MASTER_SPEC.md`
Modules, actors, glossary, 52 global principles, cross-dependencies, implementation order.

### `_IMPLEMENTATION_CONTRACTS/01_DOMAIN_MODEL.md` + `schema.prisma`
78 entities dengan fields, relationships, indexes. Valid Prisma schema (migration-ready).

### `_IMPLEMENTATION_CONTRACTS/02_DATA_OWNERSHIP.yaml`
74 entities dengan authoritative writer + readers + data scopes. 14 cross-module write rules, 7 delegations, 5 sensitivity tiers.

### `_IMPLEMENTATION_CONTRACTS/03_WORKFLOW_STATE_MACHINE.yaml`
36 entities dengan state machines (129 transitions, 94 forbidden moves). Includes orphan preventions + cross-module triggers.

### `_IMPLEMENTATION_CONTRACTS/04_BUSINESS_RULES.md`
105 rules (Indonesian) — validations, calculations, invariants. 100% REQUIREMENT.md coverage.

### `_IMPLEMENTATION_CONTRACTS/05_API_CONTRACT.yaml`
OpenAPI 3.0.3 spec, 297 operations, 50+ entity schemas. Universal response envelope, error codes, pagination.

### `_IMPLEMENTATION_CONTRACTS/06_SCREEN_CONTRACT.json`
178 screens across 11 modules. Per-screen: columns, forms, actions, KPI definitions, permissions.

### `_IMPLEMENTATION_CONTRACTS/07_RBAC_MATRIX.yaml`
43 roles × 86 permissions matrix. Hierarchy (inherits_from), data scopes, approval thresholds.

### `_IMPLEMENTATION_CONTRACTS/08_INTEGRATION_EVENT_CONTRACT.yaml`
59 events across 10 modules (CloudEvents-style). Consumer groups, delivery guarantees, DLQ, versioning.

### `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md`
Tech stack, timezone, currency, date format, soft-delete, audit, session, API constraints, file upload, security, NFR.

### `_IMPLEMENTATION_CONTRACTS/10_TRACEABILITY_MATRIX.yaml`
Req (34) → Rule (105) → Workflow (30) → Entity (78) → API (297) → Screen (178) → Test (233). Full traceability.

---

## 5. Business Flow State Machines (Live Reference)

### 5.1. Sales Pipeline
```
Leads → Sample (Pending → Approved → Paid) → DP → Sales Order → 
Approval → Invoice → Payment → Delivery → [Return → Approval → Return In]
```
Key bridge: `sales_details_id` (DEC-017)

### 5.2. Purchase Pipeline
```
PR (Draft → Pending → Approved) → PO (Draft → Pending → Approved) → 
[DP | GR (from PO detail) | Invoice (from PO/GR)] → Payment → 
[Return (from GR) → Approval → Return Out]
```

### 5.3. Production Pipeline
```
Sales (approved SO) → Batch Record → Schedule Mixing → Schedule Filling → 
Schedule Packaging → Production Mixing → Production Filling → 
Production Packaging → Delivery Out
```
Bridge: `sales_details_id` (DEC-017). Production Packaging emits event → FG stock auto-increment (BUS-RULE-037 fixes broken lineage).

### 5.4. R&D Formulation
```
Draft (Rev 0) → Pending → Approved → Locked → [Rejected → Revised → Pending]
```

### 5.5. Checklist 17-Stage (industry standard)
```
Desain Logo → HKI → BPOM Merk → BPOM NA → MOU →
Desain Kemasan → Approval Desain → Bahan Baku → Pelunasan →
Mixing → Bahan Kemas → Filling → Label → Box → Packing → Delivery
```

### 5.6. Finance Chain (Double-Entry)
```
general-journal → general-ledger → trial-balance → balance-sheet + P&L
Stock chain: purchase-in → transfer → goods-request → delivery
Opname: stock-opname → stock-adjustment → general-journal
```
Invariant: total_debit == total_credit per journal entry.

---

## 6. Per-Domain Screen Inventory (Live)

Lihat **§2 di atas** untuk summary per-domain. Detail screen-by-screen ada di `_IMPLEMENTATION_CONTRACTS/06_SCREEN_CONTRACT.json` (178 screens).

Detail per-URL crawl di `_crawl/_extracted_all.json` (1.1 MB) atau per-file `_crawl/{url_slug}.json`.

---

## 7. API Endpoint Patterns (Live)

### 7.1. Universal Patterns

| Pattern | Example | Purpose |
|---------|---------|---------|
| `/{module}/detail` | `/sales/detail?id=X` | Modal popup with full detail |
| `/{module}/badge` | `/purchase-approval/badge` | Notification count |
| `/{module}/{id}/print` | `/sales/{id}/print` | Print-friendly view |
| `add-cart`/`get-cart`/`delete-cart`/`clear-cart` | `/sales/add-cart` | Multi-line item forms |
| `get-{entity}` | `/sales/get-sales-samples` | Dropdown population AJAX |

### 7.2. Module-Specific (Sampled)
- Sales: `/sales/get-price-reference`, `/sales/upload-image`, `/sales/set-session-values`
- Purchase: `/purchase/get-supplier-detail`, `/purchase/set-session-tax`
- Production: `/batch-record/get-sales-details/{id}`, `/batch-record/process`, `/schedule-{m,f,p}/get-batch-records`
- R&D: `/formulation/{detail, detail-sample, detail-sales-sample, get-goods, add-cart}`

---

## 8. Migration Strategy: Live → New

### 8.1. Phases

| Phase | Durasi | Deliverable |
|-------|--------|-------------|
| **P1: Backend foundation** | 2 minggu | Prisma schema applied, JWT auth, RBAC skeleton, base modules |
| **P2: Master data migration** | 2 minggu | Customer, Supplier, Goods, Warehouse, User, Role (with auth data extraction) |
| **P3: Sales + Purchase pipeline** | 3 minggu | SO + PR + PO end-to-end, with cart pattern |
| **P4: Production + R&D + Checklist** | 3 minggu | Batch Record → Production → Delivery + 17-stage checklist |
| **P5: Finance + Reports + Dashboards** | 3 minggu | GL, AR/AP, all reports, 13 dashboards with KPI |
| **P6: Migration execution + parallel run** | 4 minggu | ETL from legacy → new, 2-4 weeks parallel, training |
| **P7: Old ERP shutdown** | 1 minggu | Final cutover |

**Total**: ~16-18 minggu (~4-4.5 bulan)

### 8.2. Old ERP Shutdown Timeline
- 6-9 bulan: aggressive target
- 1 tahun: safe maximum (DEC-006)

### 8.3. Data Migration
- Customers, Vendors, Goods, Formulation: directly from legacy DB
- Sales/Purchase/Production history: optionally migrate last 12 months
- Users + Roles: re-hash passwords (bcrypt 12), force reset on first login
- See `_crawl/auth/_auth_extract.json` (45 users, 16 roles, 77 perms)

---

## 9. Workflow Reminder

**Sebelum implementasi** (per DEC-002):
1. Cek spec doc terkait (`_SSOT_*.md` + `_IMPLEMENTATION_CONTRACTS/*.md`)
2. Cek decisions log (`_PROCESS_DECISIONS_LOG.md`) — keputusan terkait sudah ada?
3. Update spec kalau ada gap
4. Tambah entry di decisions log (kalau keputusan baru)
5. Implement (DB → backend → frontend)
6. Verify against spec

**Setiap perubahan signifikan → tambah entry di `_PROCESS_DECISIONS_LOG.md`**

---

## 10. File Index

| Path | Use as SSOT for |
|------|-----------------|
| `_SSOT_FINAL.md` | THIS FILE — index + overview |
| `_SSOT_AUTH.md` | Auth + RBAC + MFA |
| `_SSOT_COMMUNICATION.md` | Notes + transfer + tags |
| `_SSOT_KPI_BENCHMARK.md` | KPI targets (national+global) |
| `_PROCESS_DECISIONS_LOG.md` | Decisions + open questions |
| `_IMPLEMENTATION_CONTRACTS/00_MASTER_SPEC.md` | Modules, actors, principles |
| `_IMPLEMENTATION_CONTRACTS/01_DOMAIN_MODEL.md` | 78 entities + relationships |
| `_IMPLEMENTATION_CONTRACTS/schema.prisma` | Prisma schema |
| `_IMPLEMENTATION_CONTRACTS/02_DATA_OWNERSHIP.yaml` | Per-entity ownership |
| `_IMPLEMENTATION_CONTRACTS/03_WORKFLOW_STATE_MACHINE.yaml` | State machines |
| `_IMPLEMENTATION_CONTRACTS/04_BUSINESS_RULES.md` | 105 business rules (Indonesian) |
| `_IMPLEMENTATION_CONTRACTS/05_API_CONTRACT.yaml` | OpenAPI 3.0 spec |
| `_IMPLEMENTATION_CONTRACTS/06_SCREEN_CONTRACT.json` | 178 screen contracts |
| `_IMPLEMENTATION_CONTRACTS/07_RBAC_MATRIX.yaml` | RBAC matrix |
| `_IMPLEMENTATION_CONTRACTS/08_INTEGRATION_EVENT_CONTRACT.yaml` | 59 events |
| `_IMPLEMENTATION_CONTRACTS/09_NON_FUNCTIONAL_CONTRACT.md` | NFR |
| `_IMPLEMENTATION_CONTRACTS/10_TRACEABILITY_MATRIX.yaml` | Req → Test trace |
| `NEX_ERP_MASTER_SPECIFICATION.md` | New ERP blueprint (178 screens) |
| `NEX_ERP_SCREEN_AND_API_CATALOG.json` | New ERP screen+API catalog |
| `NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md` | Official parity patokan |
| `NEX_FINANCE_FINAL_SPEC.md` | Finance module detailed spec |
| `KPI_REFERENCE.md` | Per-division KPI definitions |
| `API_CONTRACT.yaml` | OpenAPI spec (49 endpoints) |
| `REQUIREMENT.md` | Upii's requirement (34 poin) |
| `LEGACY_ERP_SPEC.md` | Legacy function/field spec |
| `LEGACY_ERP_AUDIT.md` | Legacy audit findings |
| `raw/ERP_FUNCTIONAL_PARITY_MATRIX.md` | KEEP/UPGRADE/REPLACE classification |
| `raw/ERP_INPUT_OUTPUT_LINEAGE.md` | Data flow + orphan audit |
| `raw/ERP_NEW_ADVANCEMENT_MAP.md` | 8 new advantages |
| `raw/r&d.md`, `production.md`, `warehouse.md`, dll. | Domain-specific deep dives |
| `MASTER_DATA/*.csv` | Master data exports from legacy |
| `kil_erp_full_inventory*.csv` | v0/v2 live screen inventory |
| `_crawl/*.html`, `*.json` | Raw crawl data from live ERP |

---

## 11. Implementation Readiness

**Status**: ⚠️ PROVISIONAL — see `../verification/_SSOT_CERTIFICATION_REPORT.md`; historical DEC-035 does not override current validation evidence.

**AI CLI hanya boleh generate code untuk trace yang seluruh referensinya lulus validasi** per:
1. `schema.prisma` → Prisma migrate → DB schema
2. `_IMPLEMENTATION_CONTRACTS/01_DOMAIN_MODEL.md` → entity TypeScript types
3. `_IMPLEMENTATION_CONTRACTS/03_WORKFLOW_STATE_MACHINE.yaml` → state machine logic
4. `_IMPLEMENTATION_CONTRACTS/04_BUSINESS_RULES.md` → validators + calculators
5. `_IMPLEMENTATION_CONTRACTS/05_API_CONTRACT.yaml` → backend endpoints
6. `_IMPLEMENTATION_CONTRACTS/07_RBAC_MATRIX.yaml` → NestJS guards
7. `_IMPLEMENTATION_CONTRACTS/08_INTEGRATION_EVENT_CONTRACT.yaml` → Redis Streams handlers
8. `_IMPLEMENTATION_CONTRACTS/06_SCREEN_CONTRACT.json` → Next.js pages
9. `_IMPLEMENTATION_CONTRACTS/10_TRACEABILITY_MATRIX.yaml` → test cases per requirement

---

## 12. Next Phase

After all docs locked, next phase = **backend implementation** per Phase 1 (P1) in roadmap:
1. Apply `schema.prisma` → database schema
2. Implement JWT auth per `_SSOT_AUTH.md` + `07_RBAC_MATRIX.yaml`
3. Build entities one per domain (sales, purchase, production)
4. Wire APIs per `05_API_CONTRACT.yaml`
5. Test per `10_TRACEABILITY_MATRIX.yaml` (each requirement → test case)

Frontend plan comes after backend (or in parallel).

---

**Generated**: 2026-09-16 by reconnaissance + manual synthesis + AI agent parallel drafting (5 waves)
**Status**: SSOT v3.0 — implementation contract layer COMPLETE
**Maintainer**: Dev team (kamu + Claude)

Lihat juga:
- `_CRAWL_STATUS.md` — crawl progress log
- `_cleanup_log.md` — file apa saja yang dihapus
- `README.md` — direktori index
