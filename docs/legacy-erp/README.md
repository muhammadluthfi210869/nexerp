# `docs/legacy-erp/` — NEX ERP Single Source of Truth

> **Folder ini adalah SSOT untuk build NEX ERP** (`nexerp.id`) yang menggantikan legacy GsERP KIL (`kil.gserp.id`).
> **Workflow**: Doc-first. Ubah spec dulu, baru implement code.

---

## 🚀 Mulai dari sini

**Untuk user/human**: Baca [`ssot/_SSOT_FINAL.md`](ssot/_SSOT_FINAL.md) — master overview.

**Untuk AI CLI agent**: Baca [`AGENTS.md`](AGENTS.md) — entry point dengan task lookup table.

---

## 📁 Struktur Direktori

```
docs/legacy-erp/
│
├── README.md                        ← File ini (human entry)
├── AGENTS.md                        ← AI CLI entry (with task lookup)
│
├── 📋 ssot/                          ← 4 overview SSOT docs (what we're building)
│   ├── _SSOT_FINAL.md                  ← MASTER INDEX — read first
│   ├── _SSOT_AUTH.md                   ← JWT + RBAC + MFA
│   ├── _SSOT_COMMUNICATION.md          ← Notes + transfer + tags (no chat)
│   └── _SSOT_KPI_BENCHMARK.md          ← KPI targets (national + global)
│
├── ⚙️ process/                       ← 3 process docs (how we work)
│   ├── _PROCESS_DECISIONS_LOG.md         ← 36+ decisions tracked
│   ├── _PROCESS_CRAWL_STATUS.md          ← Live ERP reconnaissance log
│   └── _PROCESS_CLEANUP_LOG.md           ← Cleanup history
│
├── 📋 contracts/                    ← 11 canonical contracts (current status: PROVISIONAL)
│   ├── 00_MASTER_SPEC.md                  (48KB)  Modules, actors, glossary, principles
│   ├── 01_DOMAIN_MODEL.md                 (75KB)  78 entities, ER diagram
│   ├── schema.prisma                      (93KB)  Concrete Prisma schema
│   ├── 02_DATA_OWNERSHIP.yaml             (51KB)  Per-entity ownership
│   ├── 03_WORKFLOW_STATE_MACHINE.yaml     (101KB) 129 transitions, 94 forbidden
│   ├── 04_BUSINESS_RULES.md               (82KB)  105 rules (Indonesian)
│   ├── 05_API_CONTRACT.yaml               (230KB) OpenAPI 3.0, 297 ops
│   ├── 06_SCREEN_CONTRACT.json            (359KB) 178 screens
│   ├── 07_RBAC_MATRIX.yaml                (88KB)  43 roles × 86 permissions
│   ├── 08_INTEGRATION_EVENT_CONTRACT.yaml  (36KB)  59 events
│   ├── 09_NON_FUNCTIONAL_CONTRACT.md      (33KB)  NFR
│   └── 10_TRACEABILITY_MATRIX.yaml        (122KB) Req → Test trace
│
├── 📚 reference/                     ← External specs (legacy + NEX base)
│   ├── REQUIREMENT.md                       (10KB) Upii's 34 points (HIGHEST authority)
│   ├── NEX_ERP_MASTER_SPECIFICATION.md      (193KB) Base spec
│   ├── NEX_ERP_SCREEN_AND_API_CATALOG.json  (360KB) Screen catalog
│   ├── NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md  Parity patokan
│   ├── NEX_FINANCE_FINAL_SPEC.md            (59KB) Finance module
│   ├── API_CONTRACT.yaml                    (52KB) Original OpenAPI (extended by contracts/05)
│   ├── KPI_REFERENCE.md                     (23KB) Per-division KPI
│   ├── LEGACY_ERP_SPEC.md                            Legacy spec
│   ├── LEGACY_ERP_AUDIT.md                           Legacy audit
│   ├── kil_erp_full_inventory.csv           (89KB)  v0 baseline (146 screens)
│   └── kil_erp_full_inventory_v2.csv        (124KB) v2 expanded (176 screens)
│
├── 🗄️ data/                          ← Raw data (deep dive only)
│   ├── crawl/                              ← 93 live URLs + auth extraction
│   ├── master/                             ← 7 CSV exports (legacy DB)
│   └── analytics/                          ← 25 unique analytical docs
│
└── 📦 _archive/                       ← Historical (internal project docs)
    ├── backend/                             ← Project management (8 docs)
    └── _AUDIT_ANALYSIS_2026-09-09.md
```

**Total**: 12 main docs (11 contracts + schema.prisma), 4 SSOT overview, 3 process, 10 reference, 39 data, 9 archive.

---

## 🎯 Authority model

Runtime truth is subject-based and owned exclusively by `contracts/00_MASTER_SPEC.md §9.1`. The folders `reference/`, `data/`, `ssot/`, `process/`, and `contracts/_REVIEW/` are provenance/evidence, not parallel runtime authority.

The following table is for navigation only; it is not a precedence order.

| Layer | Purpose | Folder |
|-------|---------|--------|
| **T1 — Live Code** | Reference live ERP (`kil.gserp.id`) | `data/crawl/` |
| **T2 — Spec Spec** | Define new ERP functionality | `reference/NEX_*` |
| **T3 — Parity Spec** | Classify legacy functions | `data/analytics/ERP_FUNCTIONAL_PARITY_MATRIX.md` |
| **T4 — KPI Spec** | Define KPI per division | `reference/KPI_REFERENCE.md` + `ssot/_SSOT_KPI_BENCHMARK.md` |
| **T5 — Auth Spec** | JWT + RBAC + MFA | `ssot/_SSOT_AUTH.md` |
| **T6 — Communication Spec** | Notes + transfer + tags | `ssot/_SSOT_COMMUNICATION.md` |
| **T7 — Decision Log** | Track all decisions | `process/_PROCESS_DECISIONS_LOG.md` |
| **T8 — Canonical contracts** | Current behavior by subject owner | `contracts/00-10` + `schema.prisma` |

---

## 📋 Workflow: Doc-First

**Untuk perubahan apa pun**:

1. Cek `ssot/_SSOT_*.md` untuk overview
2. Cek `process/_PROCESS_DECISIONS_LOG.md` untuk existing decisions
3. Update spec doc kalau ada gap
4. Tambah entry di decisions log (kalau keputusan baru)
5. **Implement** code
6. **Verify** against spec

**Code tanpa spec update = drift. Jangan.**

---

## ❓ Pending Decisions

Semua 4 keputusan bisnis terbuka telah diselesaikan pada 2026-09-17 melalui `DEC-2026-09-17-045`:
- OD-SM-01: **Resolved (Option A)** — `FormulationAdjustment` memiliki garis keturunan terpisah, tidak mengubah `rev_number` parent.
- OD-SM-02: **Resolved (Option A)** — Direct cancellation dilarang setelah `IN_PRODUCTION`.
- DECISION_REQUIRED-002: **Resolved (Option A)** — Moving weighted average via auditable cost ledger per legal entity dan item.
- DECISION_REQUIRED-003: **Resolved (Option B)** — Governed amendment via `AMENDMENT_REVIEW` hanya diizinkan sebelum `IN_PRODUCTION`.

Status antrean keputusan terbuka: **0 OPEN DECISIONS**.

---

## 🚀 Next Phase (setelah user approve)

Roadmap production penuh (bukan MVP) sekarang menjadi acuan eksekusi:

- `process/_FULL_ERP_PRODUCTION_READINESS_ROADMAP.md` — 23 fase berurutan sampai `READY FOR UAT`.
- `verification/_PRODUCTION_PHASE_GATES.yaml` — gate, parameter, dan test machine-readable per fase.
- `verification/_ARCHITECTURE_MAINTAINABILITY_STANDARD.md` — standar wajib agar backend, frontend, database, workflow, report, dan integrasi aman menerima 8–15 perubahan per bulan.
- `verification/_UI_DNA_COMPLIANCE_STANDARD.md` — aturan blocking agar setiap UI memakai public barrel `@/components/dna`, tanpa primitive atau visual token hardcoded.
- `verification/_BATCH_VERIFICATION_PLAN.md` — protokol shorthand `verifikasi fase X-Y`, audit maksimum 5 fase per batch, evidence, verdict, dan stop rule.
- `verification/_FULL_ERP_GAP_ASSESSMENT.md` — baseline gap dan metode persentase.
- `verification/_IMPLEMENTATION_READINESS_BASELINE.json` — hasil inventory/alignment yang dapat diregenerasi.

Tidak ada fase yang boleh dilompati karena deadline; kegagalan mengembalikan fase ke remediation dan retest.

Eksekusi dimulai dari **P00 — Stop-the-line containment**, bukan langsung menambah fitur. P00 harus menutup credential/environment/dependency blockers sebelum P01 dan seterusnya.

---

**Last updated**: 2026-09-17 — full production-readiness baseline and gated roadmap
**Maintainer**: NEX ERP team
