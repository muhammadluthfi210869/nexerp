# Review: `07_RBAC_MATRIX.yaml`

> **Audit date**: 2026-09-16
> **File**: 2,343 lines, ~86KB
> **Status declared**: LOCKED
> **Verdict**: 🔴 **CRITICAL — Duplicate role ID** — RBAC matrix punya ID duplikat yang akan cause runtime bug

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 2,343 | wc -l |
| Total roles defined | **43** | actual count |
| Header claim | "16 legacy + 14 new = 30 total" | ❌ STALE |
| Unique role IDs | 42 (1 duplicate!) | ⚠️ |
| Duplicate ID | `role-nex-production-packaging` (line 508 AND 1208) | 🔴 |
| Legacy roles (legacy_id != null) | 16 (one is ORPHAN per DEC-023) | per spec |
| Actions defined | 7 | read, create, update, delete, approve, export, import |
| Data scopes | all, own_only, division_only, warehouse_only, created_by_only | 5 scopes |

---

## 🔴 Critical Findings

### CRIT-1: Duplicate Role ID `role-nex-production-packaging`

**Locations**:
- **Line 508**: First definition (legacy role section)
  ```yaml
  - id: role-nex-production-packaging
    legacy_id: 11
    name: Production Packaging
    description: Legacy production packaging role (2 legacy users)
    is_system: true
    category: legacy_combo
    division: production
    inherits_from: []
    permissions: [...]
  ```
- **Line 1208**: Second definition (NEX role section)
  ```yaml
  - id: role-nex-production-packaging
    legacy_id: null
    name: Production Packaging Operator
    description: NEX production packaging operator
    is_system: false
    category: division_role
    division: production
    inherits_from: []
    permissions: [...]
  ```

**Dampak (CRITICAL)**:
1. **YAML parser behavior**: Most YAML parsers akan throw error pada duplicate keys. Atau jika silent, akan keep entry terakhir (line 1208) dan ignore line 508.
2. **Backend guard resolution**: `@Roles('role-nex-production-packaging')` akan resolve ke entry kedua (NEX role) — bukan legacy. Ini akan **drop permissions dari legacy role**.
3. **Migration script**: legacy_id=11 users akan di-map ke role ini via DEC-025 legacy_id preservation. Tapi permissions yang di-inherit akan salah.
4. **Audit trail**: Production Operator (Packaging) dengan 2 legacy users akan kehilangan permissions mereka setelah migration.

**Fix**:
```yaml
# Line 508: Rename ID
- id: role-nex-production-packaging-legacy
  legacy_id: 11
  # ... keep all content

# Line 1208: Keep canonical
- id: role-nex-production-packaging
  legacy_id: null  # NEX-native role
  # ... keep all content
```

Then update all `nex_role: role-nex-production-packaging` references (line 2278 found) — verify they point to the correct one (likely NEX-native, line 1208).

**Verification needed**:
- Search all `nex_role:` and `inherits_from:` references to `role-nex-production-packaging`.
- Decide: keep NEX-native as canonical, rename legacy.
- Add unit test: parse YAML, assert no duplicate keys.

---

## 🟠 Major Findings

### MAJ-1: Role count mismatch (43 actual vs 30 header claim)
**Header line ~30**: "16 legacy + 14 new = 30 total"
**Actual**: 43 roles

**Possible breakdown**:
- 16 legacy (legacy_id 1-16)
- 14 + extra NEX roles (admin/staff/manager per division)
- 2 legacy combos (BusDev+HRD, BusDev+Purchasing)
- 1 Viewer (NEX)
- 2 cross-cutting (Executive, Auditor)
- Plus various split roles (HR Staff, Purchasing Staff, Warehouse Staff, dll)

**Total**: 43 ✓ (justified)

**Fix**: Update header comment dengan count yang benar.

### MAJ-2: Authority order non-standard
Line ~10: `Authority order: _SSOT_AUTH.md §4 > 09_NFR §8 > this file`

Berbeda dari MASTER_SPEC §9.4 (5 tiers). Apakah RBAC punya sub-authority karena specialize di auth?

**Fix**: Reference MASTER_SPEC §9.4 sebagai canonical dan tambahkan: "Sub-authority: this file > `_SSOT_AUTH.md` untuk auth-specific details".

### MAJ-3: ORPHAN role (DEC-023) masih ada di matrix
Line 14: `role-nex-orphan-production-mixing-filling` dengan `legacy_id: null`.

DEC-023: "Role 10 (Production Mixing & Filling, 0 users) is **ORPHAN** and is **NOT migrated**"

Tapi RBAC matrix masih define role ini dengan ID eksplisit. Apakah untuk historical reference atau memang di-migrate?

**Fix**: 
- Option A: Hapus dari matrix (sesuai DEC-023 "not migrated").
- Option B: Tandai `is_legacy_migration: true, is_active: false` agar jelas.

### MAJ-4: 77 legacy permission slugs preserved — verification
Migration source header: "**77 permissions preserved as canonical slugs**"

RBAC matrix harus punya 77 entries untuk Permission. Verify dengan grep.

---

## 🟡 Minor Findings

### MIN-1: Tidak ada explicit `inherits_from` chain visualization
Tree di MASTER_SPEC §3.2 harus match actual `inherits_from` di YAML.

**Fix**: Generate tree visual dari YAML, compare dengan MASTER_SPEC §3.2.

### MIN-2: `category` enum eksplisit tapi ada beberapa role yang mungkin overlap kategori
Categories: `super_admin | admin | division_role | cross_cutting | legacy_combo`

Apakah role seperti `Executive` (cross_cutting + read-only) perlu sub-category `cross_cutting_readonly`?

### MIN-3: Data scope values — apakah enforced di backend atau hanya docs?
5 scopes: `all | own_only | division_only | warehouse_only | created_by_only`
Bagaimana backend enforce ini? Prisma middleware? Custom guard?

### MIN-4: Tidak ada `permission_slug` validation di YAML
Apakah slug format enforced? Mis. `sales.order.create` vs `sales_order_create`?

### MIN-5: Beberapa role punya `is_system: true` (Super Admin, Administrator) — apakah ini enforceable?
Backend harus treat `is_system=true` roles sebagai immutable.

---

## 🔵 Nit / Polish

### NIT-1: Naming convention — `role-nex-*` pakai dash semua. Consistent ✓.

### NIT-2: Beberapa role ID panjang (`role-nex-busdev-plus-hrd`) — readability OK.

### NIT-3: Tidak ada `description` lengkap untuk semua role — beberapa mungkin generic.

### NIT-4: Tidak ada version history atau DEC entry reference per role.

---

## 📋 Rekomendasi per Section

| Line | Issue | Priority |
|------|-------|----------|
| 508 / 1208 | Duplicate role ID | **P0 — CRITICAL** |
| ~30 | Update header count (30 → 43) | P0 |
| 14 | Handle ORPHAN role per DEC-023 | P0 |
| ~10 | Authority order sync | P1 |
| Tree | Visualize inherits_from chain | P2 |
| Data scope | Backend enforcement spec | P2 |
| Permission slugs | Verify 77 slugs | P2 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md` CRIT-01
- See `_CROSS_DOC_INCONSISTENCIES.md` X-2, X-4, X-8
- See `00_MASTER_SPEC_REVIEW.md`, `01_DOMAIN_MODEL_REVIEW.md`, `09_NON_FUNCTIONAL_CONTRACT_REVIEW.md`
