# Page Audit — SCR-023

- **Path**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\src\app\(dashboard)\master\page.tsx`
- **Route**: `/master`
- **Spec Route**: `/master/cost-allocation-setup`
- **Module**: Master Data (MOD-01)
- **Match Method**: stem-match
- **Total Lines**: 253
- **DNA Components**: 4
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 0 
- **React Query Hooks**: 0
- **Hardcoded `Rp`**: 0
- **Hardcoded `toLocaleString`**: 0

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | Overhead Pool (misal Listrik Pabrik | yes | ✅ |
| 2 | QC Lab | yes | ✅ |
| 3 | Maintenance Mesin) | - | ❌ missing |
| 4 | Allocation Base (Machine Hours / Volume Produksi / Headcount) | yes | ✅ |
| 5 | Formula | yes | ✅ |
| 6 | Active | - | ❌ missing |
| 7 | # | - | ❌ missing |

**Score**: 4/7 (57%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Nama Pool* | - | ❌ missing |
| 2 | Akun Biaya* | yes | ✅ |
| 3 | Dasar Alokasi* | - | ❌ missing |
| 4 | Bobot Alokasi* | - | ❌ missing |

**Score**: 1/4 (25%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | + Buat Allocation Rule | - | ❌ missing |
| 2 | Edit | - | ❌ missing |
| 3 | Run Allocation Test | - | ❌ missing |
| 4 | Simpan | yes | ✅ |

**Score**: 1/4 (25%)

## 5. Detail Modal/Page
- Spec: `Simulasi distribusi pembebanan overhead ke batch mixing dan packaging`
- [id]/page.tsx: ❌
- Inline Modal: ❌
- **Status**: ❌ missing

## 6. Edit Route
- [id]/update or [id]/edit: ❌ missing (inline edit only)

## 7. Print Template
- [id]/print or print/page: ❌ MISSING (Poin 4.3 Live Audit)

## 8. Delete Flow
- Confirmation dialog: ⚠️
- Delete handler: ❌
- Audit log reference: ✅

## Conformance Score

| Dimension | Score |
|---|---|
| Table Columns | 4/7 (57%) |
| Form Inputs | 1/4 (25%) |
| Cards | 0/0 (0%) |
| Actions | 1/4 (25%) |
| Detail | 0/1 (0%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **6/18 (33%)** |

**DNA Component Adoption**: 4 components
**Mock State**: ✅ NO (none)
