# Review: `03_WORKFLOW_STATE_MACHINE.yaml`

> **Audit date**: 2026-09-16
> **File**: 2,791 lines, ~99KB
> **Status declared**: LOCKED
> **Verdict**: 🟢 **Comprehensive** — well-structured state machines, beberapa nit only

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 2,791 | wc -l |
| Major sections (##) | 16 | grep |
| Pipelines covered | 8: Sales, Purchase, Production, R&D, Checklist, Warehouse, Finance, HR | §2-9 |
| Common transitions | 7 | §1 |
| Changelog entries | 0 (empty §16) | ⚠️ |

---

## ✅ Strengths

### Business Analyst view
- **§1 Common Transitions** — reusable macros (draft→pending→approved→completed→cancelled→deleted) — DRY principle.
- **Per-pipeline structure** (§2 Sales, §3 Purchase, dst) — easy to find.
- **Forbidden transitions** (§11) — explicit illegal moves, throws `INVALID_STATE_TRANSITION`.
- **Preconditions** per transition — gates yang bisa di-test.
- **Side effects** per transition — audit, notifications, journal entries — traceable.

### Software Architect view
- **Format**: Tier-1 flat YAML untuk simple flows, Tier-2 rich YAML untuk compliance-critical — pragmatic.
- **Defense-in-depth**: TypeScript guards di NestJS + Prisma CHECK constraints.
- **Cross-cutting refs**: RBAC matrix, NFR, audit, communication, finance, lineage — well-integrated.
- **XState-inspired** semantics — industry standard reference.

### QA view
- Setiap transition: from, to, authorized, preconditions, side_effects — langsung jadi test cases.
- Forbidden transitions: easy negative test.
- SLA timers (§13) — time-based test scenarios.

---

## 🔴 Critical Findings

**None** untuk dokumen ini.

---

## 🟠 Major Findings

### MAJ-1: Authority order conflict
Line 8: `authority_order: _SSOT_FINAL.md > 00_MASTER_SPEC.md > 09_NON_FUNCTIONAL_CONTRACT.md > this file`
Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-4.

### MAJ-2: §16 CHANGELOG — declared tapi kosong
Dokumen punya section `# 16. CHANGELOG & DEC ENTRIES REQUIRED` (line 2752) tapi tidak ada entries.

**Issue**: Tidak ada audit trail. Siapa yang add transition baru, kapan, DEC ID mana?

**Fix**: Tambah entry pertama atau hapus section.

### MAJ-3: Reference ke `raw/ERP_INPUT_OUTPUT_LINEAGE.md` (line 28)
File ini referenced sebagai source-of-truth tapi tidak ada di folder `contracts/`. Apakah di folder `docs/legacy-erp/raw/`?

**Fix**: Verify location atau ganti reference ke dokumen yang accessible.

---

## 🟡 Minor Findings

### MIN-1: §9 HR Pipeline (Phase 2 — minimal scaffolding)
Line 2316. Apakah ini meaningful content atau placeholder? Untuk Phase 2 module, apakah sudah cukup atau perlu di-defer ke Phase 2 planning doc?

### MIN-2: §10 ORPHAN PREVENTIONS (line 2461)
Cross-entity orphan prevention rules — apakah ada test fixtures yang verify orphan prevention di code?

### MIN-3: §13 SLA TIMERS & OVERDUE BEHAVIOR
SLA values — apakah specific numbers ada? Mis. "PO overdue after 7 days" — angka-nya di mana?

### MIN-4: §14 NOTIFICATION CHANNELS & ROUTING
Channel mapping — apakah ada explicit mapping untuk each entity's transitions? Mis. `sales.order.approved` → email + in-app.

### MIN-5: §15 VALIDATION SUMMARY
Apakah summary table ini executable untuk verify semua transition punya from/to/authorized/preconditions/side_effects? Bisa di-CI.

---

## 🔵 Nit / Polish

### NIT-1: Section numbering melompat dari §14 ke §16 (tidak ada §15 eksplisit tapi ada). Verify consistency.

### NIT-2: Beberapa transition definisi mungkin lebih baik pakai XState JSON than YAML untuk compatibility dengan tooling XState visualizer.

### NIT-3: Tidak ada explicit "rollback" transition — apakah supported? Atau hanya "cancellation"?

---

## 📋 Rekomendasi per Section

| § | Issue | Priority |
|---|-------|----------|
| Header | Authority order → ref MASTER_SPEC §9.4 | P1 |
| 16 | Add changelog entry atau hapus | P1 |
| Line 28 | Verify `raw/ERP_INPUT_OUTPUT_LINEAGE.md` location | P2 |
| 13 | SLA values explicit | P2 |
| 14 | Channel mapping | P2 |
| 15 | CI validation | P2 |
| 9 | HR Phase 2 — defer atau expand | P3 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-4
- See `01_DOMAIN_MODEL_REVIEW.md`, `04_BUSINESS_RULES_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md`, `08_INTEGRATION_EVENT_CONTRACT_REVIEW.md`
