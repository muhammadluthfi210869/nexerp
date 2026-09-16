# Page Audit — SCR-031

- **Path**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\src\app\(dashboard)\quality\coa\page.tsx`
- **Route**: `/quality/coa`
- **Spec Route**: `/master/coa-auto-manage`
- **Module**: Master Data (MOD-01)
- **Match Method**: stem-match
- **Total Lines**: 370
- **DNA Components**: 2
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 0 
- **React Query Hooks**: 2
- **Hardcoded `Rp`**: 0
- **Hardcoded `toLocaleString`**: 0

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | Rule Name | yes | ✅ |
| 2 | Document Type | yes | ✅ |
| 3 | Condition (Contract Type | yes | ✅ |
| 4 | Item Type) | yes | ✅ |
| 5 | Debit Account | - | ❌ missing |
| 6 | Credit Account | - | ❌ missing |
| 7 | Active | yes | ✅ |
| 8 | # | - | ❌ missing |

**Score**: 5/8 (63%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Document Type* (Faktur Pembelian | yes | ✅ |
| 2 | Faktur Penjualan | - | ❌ missing |
| 3 | DP | - | ❌ missing |
| 4 | Pembayaran | - | ❌ missing |
| 5 | Konsumsi BOM | - | ❌ missing |
| 6 | dll) | - | ❌ missing |
| 7 | Condition (opsional: Jasa Maklon / Jual Putus) | - | ❌ missing |
| 8 | Debit Account* (search-select COA) | yes | ✅ |
| 9 | Credit Account* (search-select COA) | yes | ✅ |

**Score**: 3/9 (33%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | Kembali | - | ❌ missing |
| 2 | Simpan | - | ❌ missing |
| 3 | Tambah Rule | - | ❌ missing |
| 4 | Edit Rule | - | ❌ missing |
| 5 | Toggle Active | yes | ✅ |

**Score**: 1/5 (20%)

## 5. Detail Modal/Page
- Spec: `(not specified)`
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
| Table Columns | 5/8 (63%) |
| Form Inputs | 3/9 (33%) |
| Cards | 0/0 (0%) |
| Actions | 1/5 (20%) |
| Detail | 0/1 (0%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **9/25 (36%)** |

**DNA Component Adoption**: 2 components
**Mock State**: ✅ NO (none)
