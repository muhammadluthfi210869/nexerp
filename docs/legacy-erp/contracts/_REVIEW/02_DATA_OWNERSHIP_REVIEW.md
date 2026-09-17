# Review: `02_DATA_OWNERSHIP.yaml`

> **Audit date**: 2026-09-16
> **File**: 1,416 lines, ~50KB
> **Status declared**: LOCKED
> **Verdict**: 🟢 **Solid** — definisi ownership jelas, hanya butuh minor cleanup

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 1,416 | wc -l |
| Top-level keys | 7 (version, effective_date, status, authority_order, companion_docs, overview, master_data) | sample |
| Authority order lines | 5 | matches MASTER_SPEC §9.4 spirit |

---

## ✅ Strengths

### Business Analyst view
- **Rule #1**: "Each entity has ONE authoritative writer module" — clear ownership boundary, reduces ambiguity.
- **Rule #6**: "CHILD entities have NO standalone create endpoint — created from parent detail page" — bagus untuk UX consistency (DEC-016 aligned).
- **Rule #7**: "BRIDGE entities carry parent FK forward and are created from parent SO via delegation" (DEC-017) — well-defined bridge pattern.

### Software Architect view
- **Rules 1-7** di overview adalah policy yang enforceable di code (Prisma middleware + NestJS guards).
- **Cross_module_writes + delegations** — explicit escape hatch untuk legitimate cases (sebaiknya FORBIDDEN by default).
- **data_scope enumeration**: `all | own_only | division_only | warehouse_only | created_by_only` — good RBAC granularity.

### QA view
- Setiap entity ownership punya 1 writer → 1 happy path → mudah di-test (negative test: coba write dari non-owner → expect 403).
- Rule #4: "Soft-delete + audit on all writes" — consistent dengan principle.

---

## 🔴 Critical Findings

**None** untuk dokumen ini.

---

## 🟠 Major Findings

### MAJ-1: Comment "78 entity catalog" outdated
Line 8 (companion_docs):
```
- 01_DOMAIN_MODEL.md          # 78 entity catalog
```
Actual: 89 entities di schema.prisma.

**Fix**: Update ke "**89 entity catalog**" atau hapus comment angka.

### MAJ-2: Authority order conflict
Dokumen ini definisikan:
```
authority_order: _SSOT_FINAL.md > 00_MASTER_SPEC.md > 09_NON_FUNCTIONAL_CONTRACT.md > 01_DOMAIN_MODEL.md > this document
```

Tapi MASTER_SPEC §9.4 punya order berbeda (5 tiers, REQUIREMENT.md di top).

Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-4 untuk analisis lengkap.

**Fix**: Reference ke MASTER_SPEC §9.4 sebagai canonical.

---

## 🟡 Minor Findings

### MIN-1: `delegations` section belum dicek apakah lengkap
Bagaimana jika ada cross-module write yang legitimate tapi belum listed di delegations? Apakah developer bisa add via PR atau perlu DEC?

**Fix**: Tambah explicit policy: "Adding new delegation requires DEC entry OR PR ke data-architect reviewer."

### MIN-2: `data_scope` tidak eksplisit untuk setiap entity reader entry
Apakah setiap reader entry punya data_scope? Verify dengan grep `data_scope`.

### MIN-3: Tidak ada explicit reference ke `07_RBAC_MATRIX.yaml` per entity
Ownership rules reference "per 07_RBAC_MATRIX.yaml" di rule #1 dan #5, tapi tidak ada link langsung per-entity.

**Fix**: Tambah `rbac_matrix_ref:` per entity untuk deep-link ke relevant role entries.

### MIN-4: Special readers dengan `data_scope` filter — apakah ini enforced di backend atau hanya UI hint?
Rule #5: "data_scope on each reader follows 07_RBAC_MATRIX.yaml data_scopes" — tapi bagaimana enforced? Prisma middleware?

**Rekomendasi**: Tambah enforcement mechanism reference.

### MIN-5: Tidak ada test scenario per entity
Bagaimana QA test "BusDev Staff cannot write Customer"? Apakah ada test fixtures di repo?

---

## 🔵 Nit / Polish

### NIT-1: Overview YAML multi-line — readable tapi bisa di-extract ke markdown untuk better rendering.

### NIT-2: Format key naming — `master_data` (snake_case) vs `effective_date` (snake_case) — consistent ✓.

### NIT-3: Tidak ada version history / changelog section.

---

## 📋 Rekomendasi per Section

| Section | Issue | Priority |
|---------|-------|----------|
| Line 8 | Update "78 → 89" | P0 |
| Top | Authority order → ref MASTER_SPEC §9.4 | P1 |
| delegations | Policy for additions | P2 |
| Per entity | rbac_matrix_ref link | P3 |
| Overview | Extract ke markdown | P3 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-1, X-4
- See `01_DOMAIN_MODEL_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md`, `08_INTEGRATION_EVENT_CONTRACT_REVIEW.md`
