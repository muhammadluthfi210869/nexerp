# Review: `06_SCREEN_CONTRACT.json`

> **Audit date**: 2026-09-16
> **File**: 14,077 lines, ~350KB
> **Status declared**: LOCKED
> **Verdict**: 🟠 **Modules mismatch** — comprehensive screen definitions tapi count & structure drift dari MASTER_SPEC

---

## 📊 Metrics Snapshot

| Metric | Value | Note |
|--------|-------|------|
| Lines | 14,077 | wc -l |
| Total screens | **178** | matches `total_screens` field ✓ |
| Module keys (top-level) | 15 | auth, users, master, sales, purchase, production, warehouse, rnd, finance, checklist, reports, dashboards, system, communication, audit |
| Screen types | auth: 4, form: 58, list: 72, detail: 16, report: 15, dashboard: 13 | by type |
| Routes unique | 178/178 (no duplicates) ✓ | good |
| Screens with no forms | 116 (65%) | expected for list/detail/auth |
| Screens with no columns | 90 (51%) | needs spot-check |
| cross_cutting keys | 10 | default settings |

---

## ✅ Strengths

### Business Analyst view
- **Screen-level definition** per entity operation — clear UX scope.
- **Type tagging** (auth/form/list/detail/report/dashboard) — clear role per screen.
- **Cross-cutting defaults** (pagination, currency, locale, soft-delete, audit, autocomplete, tab filter, period filter, i18n) — consistent UX patterns.
- **Total 178 screens** documented (verified ✓).

### Software Architect view
- **JSON structure** machine-readable — bisa di-generate Next.js routes.
- **Sample structure**: `screen_id, module, title, route, type, data_source, columns, forms` — clear schema.
- **Module key sebagai object** (bukan array) — additional metadata possible per module.

### QA view
- **178 screens** = 178 testable UI components.
- **Routes unique** = 178 routes to verify.
- **Type categorization** = 4 auth screens = 4 login flows, 58 forms = 58 form validation suites.

---

## 🔴 Critical Findings

### CRIT-1: Screen count 178 vs MASTER_SPEC 176
- **MASTER_SPEC §1.4, §9.1**: "**176 screens**"
- **SCREEN_CONTRACT**: **178 screens** (actual)

**Fix**: Update MASTER_SPEC ke 178 atau remove 2 screens. Lihat `_CROSS_DOC_INCONSISTENCIES.md` X-3.

---

## 🟠 Major Findings

### MAJ-1: Modules structure mismatch with MASTER_SPEC
- **MASTER_SPEC** claims various module counts (9/10/12)
- **SCREEN_CONTRACT** has **15 module keys**: `auth, users, master, sales, purchase, production, warehouse, rnd, finance, checklist, reports, dashboards, system, communication, audit`
- Tidak ada `hr`, `marketing`, `legalitas` (3 dari MASTER_SPEC §1.1 "9 ERP domains")
- Ada `users, reports, system, communication, audit` (4 ekstra dari MASTER_SPEC)

**Implication**: 
- HR, Marketing, Legalitas = Phase 2 atau sengaja tidak di-screen? Jika di-defer, harus ditandai di screen contract.
- 4 module ekstra (users, reports, system, communication, audit) — apakah ini cross-cutting yang dipisah jadi module?

**Fix**: Tabelkan mapping module screen contract vs MASTER_SPEC. Decide mana canonical.

### MAJ-2: 90 screens tanpa columns (51%)
- 178 screens, 90 tanpa columns
- Untuk **list screens**, columns adalah wajib (kecuali empty state)
- Untuk **detail/report/dashboard screens**, columns bisa optional

**Spot-check needed**:
- Berapa dari 72 list screens yang punya columns? (72 - 90 = impossible, jadi pasti banyak list tanpa columns)
- Apakah columns-nya implicit atau memang missing?

**Fix**: Audit list screens tanpa columns, tambah definisi.

### MAJ-3: ID pattern inconsistency
- 150 screens: `SCR-XXX` (numeric, 1-150)
- 13 dashboards: `SCR-DASH-001..013`
- 15 system: `SCR-SYS-001..015`

Total 178 ✓. Tapi 2 namespace (`SCR-DASH-*`, `SCR-SYS-*`) breaking the numeric sequence.

**Rekomendasi**:
- Option A: Continuous numbering `SCR-001..178`.
- Option B: Namespace per module: `SCR-AUTH-001`, `SCR-USER-001`, `SCR-DASH-001`, dst.

### MAJ-4: No cross-reference to API endpoints per screen
Setiap screen harusnya reference ke API endpoint(s) yang dipakai. Mis. `SCR-025 (Sales Order list)` → `GET /sales/orders`.

**Verify**: Apakah ada field `data_source` atau `api_endpoints` per screen?

Sample (line 1-50) screen pertama:
```json
{
  "screen_id": "SCR-001",
  "module": "auth",
  "title": "Login",
  "route": "/login",
  "type": "auth",
  "data_source": null,
  "columns": [],
  "forms": [...]
}
```

`data_source: null` untuk login. Tapi apakah `data_source` dipakai untuk non-auth screens?

**Fix**: Audit `data_source` per screen, ensure non-null untuk screens yang butuh API.

---

## 🟡 Minor Findings

### MIN-1: 116 screens tanpa forms (65%)
- Login (4), list (72), detail (16), report (15), dashboard (13) = 120 screens yang naturally no-forms.
- Actual no-forms: 116. Difference: -4 — apakah beberapa list/detail punya form (search/filter)?

**OK**: proporsi masuk akal untuk ERP screens.

### MIN-2: cross_cutting object — 10 keys (default_pagination, default_currency_format, default_date_format, default_locale, soft_delete_field, audit_field_required, autocomplete_default, tab_filter_required, period_filter_required, i18n_required)
Apakah setiap screen override defaults atau inherit?

**Fix**: Tambah explicit `inherit_cross_cutting: true` per screen atau dokumentasikan behavior.

### MIN-3: Routes — apakah semua pakai `kebab-case` atau mix?
Sample: `/login` (singular, kebab) — konsisten ✓.

### MIN-4: Module key `rnd` (lowercase) tapi MASTER_SPEC pakai "R&D" atau "R&D / Formulation"
Naming convention drift. Pilih satu (suggest: `rnd` untuk machine, `R&D / Formulation` untuk display).

### MIN-5: Tidak ada explicit `module_label` atau `module_description` per module
Hanya key. Untuk UI generation perlu label manusiawi.

### MIN-6: Tidak ada version history per screen
Jika screen definition berubah, bagaimana audit trail?

---

## 🔵 Nit / Polish

### NIT-1: Sample screen punya `note` field di form (`note` truncated in sample). Apakah `note` standard field atau ad-hoc?

### NIT-2: Tidak ada `i18n_key` per label/field — bagaimana untuk ID/EN translation?

### NIT-3: Tidak ada explicit `permission_slug` per screen untuk RBAC.
Lihat `07_RBAC_MATRIX.yaml` apakah ada cross-reference.

---

## 📋 Rekomendasi per Section

| Section | Issue | Priority |
|---------|-------|----------|
| Total | Update MASTER_SPEC ke 178 | P0 |
| modules | Map dengan MASTER_SPEC domains | P1 |
| List screens | Columns audit | P1 |
| IDs | Namespace consistency | P2 |
| data_source | Per-screen API reference | P2 |
| cross_cutting | Inherit vs override behavior | P2 |
| i18n | Translation keys | P2 |

---

## 🔗 Cross-References

- See `_EXECUTIVE_SUMMARY.md`
- See `_CROSS_DOC_INCONSISTENCIES.md` X-3, X-6, X-12
- See `00_MASTER_SPEC_REVIEW.md`, `05_API_CONTRACT_REVIEW.md`, `07_RBAC_MATRIX_REVIEW.md`
