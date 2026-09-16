# Page Audit — SCR-029

- **Path**: `frontend/src/app/(dashboard)/master/goods/page.tsx`
- **Route**: `/master/goods`
- **Spec Route**: `/master/goods-manage`
- **Module**: Master Data (MOD-01)
- **Match Method**: manual
- **Total Lines**: 1306
- **DNA Components**: 15
- **Raw UI Barrel Imports**: 0 (target: 0)
- **Mock Arrays**: 2 (INITIAL_CATEGORIES, INITIAL_BARANG)
- **React Query Hooks**: 5
- **Hardcoded `Rp`**: 2
- **Hardcoded `toLocaleString`**: 4

## 1. Table Columns
| # | Spec Column | FE Present | Status |
|---|---|---|---|
| 1 | # | - | ❌ missing |
| 2 | Kode Barang | yes | ✅ |
| 3 | Nama Barang | yes | ✅ |
| 4 | Supplier Asal | yes | ✅ |
| 5 | Wujud Fisik & Kondisi | yes | ✅ |
| 6 | Real Stok | yes | ✅ |
| 7 | Harga Beli | yes | ✅ |
| 8 | Kategori | yes | ✅ |
| 9 | Sub Kategori | yes | ✅ |
| 10 | Satuan | yes | ✅ |
| 11 | Aging Barang (Lama Berada di Gudang) | yes | ✅ |
| 12 | # | - | ❌ missing |

**Score**: 10/12 (83%)

## 2. Form Inputs
| # | Spec Field | FE Present | Status |
|---|---|---|---|
| 1 | Search/Autocomplete Detail | yes | ✅ |
| 2 | Filter Supplier | yes | ✅ |
| 3 | Filter Jenis Bahan | yes | ✅ |
| 4 | Filter Periode | yes | ✅ |

**Score**: 4/4 (100%)

## 3. Card Output
_No metric cards specified_

## 4. Actions
| # | Spec Action | FE Present | Status |
|---|---|---|---|
| 1 | Buat | - | ❌ missing |
| 2 | Lihat | yes | ✅ |
| 3 | Sunting | yes | ✅ |
| 4 | Hapus | yes | ✅ |
| 5 | Modal Hydro Marine Collagen | yes | ✅ |
| 6 | Modal Bahan Baku | yes | ✅ |
| 7 | Modal Active | yes | ✅ |
| 8 | Modal gr | yes | ✅ |
| 9 | Modal Akun Persediaan | yes | ✅ |
| 10 | Modal Akun Penjualan | yes | ✅ |
| 11 | Modal Akun Retur Penjualan | yes | ✅ |
| 12 | Modal Akun Diskon Penjualan | yes | ✅ |
| 13 | Modal Persediaan (Perjalanan) | yes | ✅ |
| 14 | Modal Akun COGS | yes | ✅ |
| 15 | Modal Akun Retur Pembelian | yes | ✅ |
| 16 | Modal Akun Barang Belum Faktur | yes | ✅ |
| 17 | Modal Tutup | yes | ✅ |

**Score**: 16/17 (94%)

## 5. Detail Modal/Page
- Spec: `[Detail Barang] • Field: Kode, Nama Barang, Kategori, Sub Kategori, Satuan, Harga Beli, Stok Terendah • Tabel Detail: (#, Jenis Akun, Kode CoA, Nama CoA) • Aksi Modal: Hydro Marine Collagen, Bahan Baku, Active, gr, Akun Persediaan, Akun Penjualan, Akun Retur Penjualan, Akun Diskon Penjualan, Persediaan (Perjalanan), Akun COGS, Akun Retur Pembelian, Akun Barang Belum Faktur, Tutup`
- [id]/page.tsx: ❌
- Inline Modal: ✅
- **Status**: ✅ present

## 6. Edit Route
- [id]/update or [id]/edit: ❌ missing (inline edit only)

## 7. Print Template
- [id]/print or print/page: ❌ MISSING (Poin 4.3 Live Audit)

## 8. Delete Flow
- Confirmation dialog: ✅
- Delete handler: ✅
- Audit log reference: ✅

## Conformance Score

| Dimension | Score |
|---|---|
| Table Columns | 10/12 (83%) |
| Form Inputs | 4/4 (100%) |
| Cards | 0/0 (0%) |
| Actions | 16/17 (94%) |
| Detail | 1/1 (100%) |
| Edit | 0/1 (0%) |
| Print | 0/1 (0%) |
| **TOTAL** | **31/36 (86%)** |

**DNA Component Adoption**: 15 components
**Mock State**: ⚠️ YES (INITIAL_CATEGORIES, INITIAL_BARANG)
