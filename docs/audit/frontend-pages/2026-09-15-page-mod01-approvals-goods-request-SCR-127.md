# Page Audit — SCR-127

- **Path**: `C:\GAWE\Web Dev\Porto Aureon\ERP FROM ZERO\frontend\src\app\(dashboard)\approvals\goods-request\page.tsx`
- **Route**: `/approvals/goods-request`
- **Spec Route**: `/master/goods-request`
- **Module**: Master Data (MOD-01)
- **Match Method**: route-suffix
- **Total Lines**: 366
- **DNA Components**: 2
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 1 (INITIAL_GOODS_REQUEST_DATA)
- **React Query Hooks**: 0
- **Hardcoded `Rp`**: 0
- **Hardcoded `toLocaleString`**: 0

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | # | - | ❌ missing |
| 2 | Kode | - | ❌ missing |
| 3 | Tanggal | yes | ✅ |
| 4 | Peminta | - | ❌ missing |
| 5 | Penyedia | - | ❌ missing |
| 6 | Pembuat | - | ❌ missing |
| 7 | Catatan | - | ❌ missing |
| 8 | Status | yes | ✅ |
| 9 | # | - | ❌ missing |

**Score**: 2/9 (22%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Search | yes | ✅ |
| 2 | GSTable1_length | - | ❌ missing |

**Score**: 1/2 (50%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | Riwayat | - | ❌ missing |
| 2 | Buat | yes | ✅ |
| 3 | Pending | yes | ✅ |
| 4 | Lihat | - | ❌ missing |
| 5 | Print | - | ❌ missing |
| 6 | Modal Tutup | - | ❌ missing |

**Score**: 2/6 (33%)

## 5. Detail Modal/Page
- Spec: `[Detail Permintaan Barang] • Field: Kode Permintaan, Status, Gudang Asal, Gudang Tujuan, Tanggal Permintaan, Catatan, Pembuat, Belum ada riwayat persetujuan • Tabel Detail: (#, Barang, Qty Diminta, Qty Disetujui, Qty Dikeluarkan, Qty Digunakan, Qty Dikembalikan, Qty Selisih, Catatan) • Aksi Modal: Tutup`
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
| Table Columns | 2/9 (22%) |
| Form Inputs | 1/2 (50%) |
| Cards | 0/0 (0%) |
| Actions | 2/6 (33%) |
| Detail | 0/1 (0%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **5/20 (25%)** |

**DNA Component Adoption**: 2 components
**Mock State**: ⚠️ YES (INITIAL_GOODS_REQUEST_DATA)
