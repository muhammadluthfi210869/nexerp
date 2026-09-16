# Page Audit — SCR-110

- **Path**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\src\app\(dashboard)\pembelian\purchase-requests\page.tsx`
- **Route**: `/pembelian/purchase-requests`
- **Spec Route**: `/scm/purchase/create`
- **Module**: SCM & Purchasing (MOD-04)
- **Match Method**: stem-match
- **Total Lines**: 884
- **DNA Components**: 8
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 1 (INITIAL_PR_DATA)
- **React Query Hooks**: 0
- **Hardcoded `Rp`**: 1
- **Hardcoded `toLocaleString`**: 0

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | # | - | ❌ missing |
| 2 | Barang (search-select) | yes | ✅ |
| 3 | Qty | yes | ✅ |
| 4 | Harga Satuan | yes | ✅ |
| 5 | Diskon (Rp) | - | ❌ missing |
| 6 | Total | yes | ✅ |
| 7 | Aksi | yes | ✅ |

**Score**: 5/7 (71%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Supplier* (search-select) | yes | ✅ |
| 2 | Gudang Tujuan* | yes | ✅ |
| 3 | Tanggal Input PO* (Read-only otomatis hari ini) | yes | ✅ |
| 4 | Deadline* (label baru pengganti jatuh tempo) | yes | ✅ |
| 5 | Catatan | yes | ✅ |
| 6 | Field Diskon* (dalam Rupiah | yes | ✅ |
| 7 | dikurangi dari ongkir) | yes | ✅ |
| 8 | Field Ongkir* (Rupiah) | yes | ✅ |
| 9 | Tanda Tangan Digital Penanggung Jawab* | - | ❌ missing |

**Score**: 8/9 (89%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | Tambah ke Keranjang | yes | ✅ |
| 2 | Batal | yes | ✅ |
| 3 | Simpan Pembelian | yes | ✅ |

**Score**: 3/3 (100%)

## 5. Detail Modal/Page
- Spec: `(not specified)`
- [id]/page.tsx: ❌
- Inline Modal: ✅
- **Status**: ✅ present

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
| Table Columns | 5/7 (71%) |
| Form Inputs | 8/9 (89%) |
| Cards | 0/0 (0%) |
| Actions | 3/3 (100%) |
| Detail | 1/1 (100%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **17/22 (77%)** |

**DNA Component Adoption**: 8 components
**Mock State**: ⚠️ YES (INITIAL_PR_DATA)
