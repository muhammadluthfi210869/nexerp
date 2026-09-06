# Fase 1: Purchase Core — Design Spec

**Tanggal:** 2026-09-06
**Scope:** 17 item Purchase Core (dari total 91 perubahan ERP)
**Strategi:** Fase per Modul — fase ini adalah yang pertama
**Status:** Draft — menunggu user review

---

## 1. Tujuan & Non-Tujuan

### 1.1 Tujuan
Implementasi 17 item Purchase Core yang belum selesai, dengan fokus pada:
- **Diskon/Ongkir PO** (46, 47) — kalkulasi Rupiah, pembulatan packing
- **Sumber barang** (71) — PO Pembelian vs Stok Gudang
- **HPP link ke Purchase** (72) — auto-calc + allow override
- **SOP range harga** (69) — threshold + approval workflow
- **Conflict resolution** (68) — optimistic lock + versioning
- **Kondisi barang** (49, 50-56) — free, reject, bagus, Real Stok, jenis bahan
- **Purchase flow polish** (38, 39, 41, 63, 73) — notifikasi, history, search, validasi

### 1.2 Non-Tujuan (eksplisit)
- **Pajak & e-Faktur** (37) — di-skip dari scope, konfirmasi sudah benar
- **Format Kode Universal** (76) — fase terpisah (Fase 2), sudah ada helper `lib/numbering.ts`
- **Filter periode global** (29) — fase terpisah (Fase 5)
- **Input autocomplete global** (28) — fase terpisah (Fase 5)
- **Item Finance, Aset, Jurnal** (15, 16, 22, 26, 27, 30, 35, 36, 75) — fase terpisah (Fase 3)
- **Modul Design & BusDev** (82, 87, 88, 89, 90, 91) — fase terpisah (Fase 6-7)

### 1.3 Success Criteria
- Semua 17 item berstatus ✅ (implemented)
- Tidak ada regression di item yang sudah ✅
- Tests passing untuk flow baru
- Migration script aman untuk data existing
- Backward compatibility untuk API lama (jika ada consumer)

---

## 2. Design Decisions (confirmed)

### 2.1 Conflict Resolution (item 68) — Optimistic Lock + Versioning
- Tambah field `version: Int @default(1)` di tabel `PurchaseOrder` dan turunannya
- Backend: saat `update`, query by `(id, version)`, increment version. Row not found = conflict → 409
- Frontend: saat dapat 409, tampilkan modal "Data sudah diubah user lain, refresh dulu"
- Audit log: simpan `previousVersion` + `updatedBy` untuk forensik

### 2.2 HPP Link ke Purchase (item 72) — Auto-calc dari PO + Allow Override
- Field `hpp` di tabel `Product` menjadi: `autoCalculatedHpp` (derived) + `manualOverrideHpp` (nullable)
- `effectiveHpp = manualOverrideHpp ?? autoCalculatedHpp`
- `autoCalculatedHpp` dihitung dari rata-rata tertimbang PO: `sum(qtyDiterima * hargaSatuan) / sum(qtyDiterima)` per (product, supplier, last 90 days)
- Hanya `qtyBagus` (exclude reject & free) yang masuk hitungan
- Trigger: recalc setiap PO di-approve atau Penerimaan Barang di-confirm
- UI: di product master, tampilkan breakdown `autoCalculatedHpp` + form override

### 2.3 Sumber Barang (item 71) — Dropdown Pilihan + Default Smart
- PO line item tambah field `source: 'PO' | 'STOCK'`
- Default logic di frontend saat create PO:
  - Cek stok gudang tersedia untuk product
  - Jika `currentStock >= qtyNeeded` → default `'STOCK'`
  - Else → default `'PO'`
- Admin bisa override via dropdown
- Backend: validasi source matches — kalau `'STOCK'` tapi stok tidak cukup → reject
- Inventory mutation:
  - `'PO'` → tunggu Penerimaan Barang untuk tambah stok
  - `'STOCK'` → kurangi stok langsung saat PO approved (booking system)

### 2.4 SOP Range Harga (item 69) — Threshold + Approval Workflow
- Tabel `ProductPriceRange`: `productId`, `minPrice`, `maxPrice`, `lastPurchasePrice`, `currency`
- Default: `minPrice = lastPurchasePrice * 0.8`, `maxPrice = lastPurchasePrice * 1.3`
- Saat input PO, validasi:
  - Jika `hargaSatuan` di dalam range → OK
  - Jika di luar range → flag + require approval Head sebelum submit
- Approval flow: Head dari divisi pengaju, via `ApprovalRequest` table yang sudah ada
- Audit: log semua override + alasan

### 2.5 Diskon/Ongkir PO (item 46, 47) — 2 Field Diskon + Ongkir
- PO header tambah field:
  - `discountManual: Decimal` — admin input
  - `discountRounding: Decimal` — auto dari pembulatan packing
  - `shippingCost: Decimal` — ongkir
- Formula: `total = subtotal - discountManual - discountRounding + shippingCost`
- `discountRounding` dihitung otomatis saat save line items:
  - `rounding = sum(item.qtyOrdered) - sum(item.qtyOrderedRoundedUpToPacking)`
  - Konversi ke Rupiah: `roundingValue = rounding * hargaSatuan`
- UI: tampilkan 3 baris terpisah (subtotal, diskon manual, rounding adjustment, ongkir, total) di summary card

---

## 3. Item-by-Item Plan

### 3.1 Notifikasi & History (38, 39, 41)

**Item 38 — Badge notifikasi dinamis**
- Sidebar badge `purchase-approval?tab=pending` — ganti hardcoded `"9"` dengan API call
- Endpoint baru: `GET /api/scm/purchase-approval/pending-count` return `{ count: number }`
- Frontend: `useEffect` fetch count, refresh tiap 30 detik via `useInterval`

**Item 39 — History barang: kode → supplier**
- Tabel baru `ProductSupplierHistory`: `productId`, `supplierId`, `firstSeenAt`, `lastPurchaseAt`, `totalQtyPurchased`
- Trigger: update saat PO di-approve
- UI: di product master, tampilkan "Diambil dari supplier X sejak tanggal Y"

**Item 41 — Search detail di Buat Pembelian**
- Replace simple text search dengan multi-field: `kode`, `supplier`, `gudang`, `itemName`, `qty`, `price`, `dateRange`
- Backend: extend existing search query dengan OR across multiple fields
- UI: search input dengan placeholder dinamik yang berubah sesuai tab aktif

### 3.2 Validasi Status (63)
- Tambah helper `validateNextStatus(currentStatus, nextStatus, milestoneHistory)` di backend
- Rule: jika `currentStatus === 'DONE'` dan `nextStatus` di-revert ke proses → allowed (sesuai item 62)
- Tapi jika `nextStatus === 'DONE'` lagi, cek apakah ada milestone dependent yang belum done → jika ada, reject
- Error message jelas: "Tidak bisa set 'Packing Selesai' karena 'MoU' belum selesai"

### 3.3 Master Data Jenis Bahan (50)
- Tambah field `bahanType: 'BAKU' | 'PRIMER' | 'SEKUNDER' | 'PEMBANTU'` di tabel `Product` (enum)
- Filter di vendor list page: tambah tab filter `Berdasarkan Jenis Bahan`
- Backend: extend vendor search dengan filter `suppliesBahanType`

### 3.4 Wujud Fisik & Kondisi (51, 52)
- Tambah field di `Product`: `physicalForm: 'CAIR' | 'SERBUK' | 'BUTIRAN' | 'PADAT' | 'GAS' | 'LAINNYA'`
- Tambah field `conditionNotes: String` (text bebas untuk kondisi handling/storage)
- UI: tampilkan di product master card dengan icon sesuai physicalForm

### 3.5 Gudang Per Jenis Bahan (53)
- View `WarehouseStockByBahanType`: agregasi `qtyBagus` + `qtyReject` per (gudang, bahanType)
- Endpoint: `GET /api/warehouse/stock-summary?groupBy=bahanType`
- UI: di warehouse dashboard, card ringkasan per jenis bahan

### 3.6 Payment Filter — Only Bagus (54)
- Backend validation di `createPaymentForPO`: cek line items, hanya hitung qty yang payment-able (qtyBagus, bukan reject)
- Formula: `payableAmount = sum(item.qtyBagus * item.hargaSatuan) - discount + shipping`
- Reject items di-exclude dari total pembayaran
- UI: di faktur-pembelian, tampilkan breakdown "Amount payable: X (exclude reject: Y)"

### 3.7 Replace Kondisi Bagus/Cacat dengan Real Stok (55)
- Sederhanakan field di view: hapus label "Kondisi Bagus" & "Reject (Cacat)" yang terpisah
- Tampilkan hanya `RealStok = qtyBagus` sebagai angka utama
- Reject tetap ada sebagai info kedua (tidak di-highlight)
- View: `frontend/src/app/(dashboard)/warehouse/barang-masuk/pembelian-masuk/page.tsx:747-765`

### 3.8 Cleanup Unused Columns (73)
- Audit semua kolom di tabel-tabel Purchase, identifikasi yang:
  - Tidak ada yang baca di frontend (grep nama kolom di `.tsx`)
  - Tidak ada business logic yang pakai
- Buat list, konfirmasi dengan user sebelum drop
- Default: keep kolom tapi hide dari UI (safer daripada drop)

---

## 4. Data Model Changes

### 4.1 Schema Baru / Modifikasi

```prisma
// Tabel baru
model ProductSupplierHistory {
  id              String   @id @default(cuid())
  productId       String
  supplierId      String
  firstSeenAt     DateTime @default(now())
  lastPurchaseAt  DateTime?
  totalQtyPurchased Float @default(0)
  product         Product  @relation(fields: [productId], references: [id])
  supplier        Vendor   @relation(fields: [supplierId], references: [id])
  @@unique([productId, supplierId])
}

model ProductPriceRange {
  id                String  @id @default(cuid())
  productId         String  @unique
  minPrice          Float
  maxPrice          Float
  lastPurchasePrice Float
  currency          String  @default("IDR")
  product           Product @relation(fields: [productId], references: [id])
}

// Modifikasi Product
model Product {
  // ... existing fields
  bahanType          String?  // BAHAN_BAKU | PRIMER | SEKUNDER | PEMBANTU
  physicalForm       String?  // CAIR | SERBUK | BUTIRAN | PADAT | GAS | LAINNYA
  conditionNotes     String?
  autoCalculatedHpp  Float?   // computed from PO history
  manualOverrideHpp  Float?   // nullable, admin-set
  priceRange         ProductPriceRange?
  supplierHistory    ProductSupplierHistory[]
}

// Modifikasi PurchaseOrder (header)
model PurchaseOrder {
  // ... existing fields
  version            Int      @default(1)  // for optimistic lock
  discountManual     Float    @default(0)
  discountRounding   Float    @default(0)
  shippingCost       Float    @default(0)
}

// Modifikasi PurchaseOrderItem (line)
model PurchaseOrderItem {
  // ... existing fields
  source             String   @default("PO")  // PO | STOCK
  qtyRounded         Float?   // for rounding adjustment calc
}
```

### 4.2 Migration Strategy
- Semua field baru di-add sebagai nullable atau dengan default value → aman untuk existing rows
- `version @default(1)` → existing rows otomatis jadi version 1
- `discountManual/discountRounding/shippingCost @default(0)` → existing rows jadi 0
- Backfill script untuk `ProductSupplierHistory` dari data PO existing

---

## 5. Backend Changes

### 5.1 Module Structure
Tidak ada module baru. Semua extend di module existing:
- `backend/src/modules/scm/` — PO, approval, source selection, conflict resolution
- `backend/src/modules/master/` — Product price range, supplier history
- `backend/src/modules/warehouse/` — stock summary by bahanType
- `backend/src/modules/finance/` — payment filter (only qtyBagus)

### 5.2 New/Modified Endpoints
- `GET /api/scm/purchase-approval/pending-count` (new)
- `POST /api/scm/purchase-orders/:id/validate-price-range` (new) — cek SOP harga
- `POST /api/scm/purchase-orders` (modified) — support `source` per line item, conflict detection
- `PUT /api/scm/purchase-orders/:id` (modified) — optimistic lock check
- `GET /api/warehouse/stock-summary?groupBy=bahanType` (new)
- `POST /api/finance/payments` (modified) — exclude qtyReject from payable

### 5.3 Services to Update
- `PurchaseOrderService` — add `validatePriceRange()`, `checkVersion()`, `recalcRounding()`
- `ProductService` — add `recalcHpp()`, `getEffectiveHpp()`
- `PaymentService` — modify `calculatePayable()` to exclude reject
- `WarehouseService` — add `getStockSummaryByBahanType()`

---

## 6. Frontend Changes

### 6.1 Pages to Modify
- `frontend/src/app/(dashboard)/scm/purchase-approval/page.tsx` — badge dynamic, search detail
- `frontend/src/app/(dashboard)/scm/checklist-progress/` — status validation
- `frontend/src/app/(dashboard)/master/products/` — HPP display, price range, supplier history
- `frontend/src/app/(dashboard)/master/vendors/` — filter by bahanType
- `frontend/src/app/(dashboard)/warehouse/barang-masuk/pembelian-masuk/` — Real Stok simplify
- `frontend/src/app/(dashboard)/finance/faktur-pembelian/` — payment breakdown
- `frontend/src/app/(dashboard)/finance/payments/` — exclude reject from payable

### 6.2 New Components
- `<PriceRangeIndicator />` — visual indicator in PO form when harga di luar range
- `<ConflictModal />` — modal untuk handle 409 conflict response
- `<HppBreakdownCard />` — card di product master showing auto-calc + override
- `<StockBadge />` — badge showing qty tersedia vs qty needed (untuk default source)

### 6.3 Hooks
- `usePendingCount()` — fetch badge count with auto-refresh
- `useConflictResolver()` — handle 409 response with refresh + retry logic

---

## 7. Data Flow Examples

### 7.1 Flow: Create PO dengan Source Selection
```
1. Admin buka /scm/purchase-approval (create mode)
2. Pilih product → useStockBadge() cek currentStock
   - Jika stock >= qty → default source = STOCK
   - Else → default source = PO
3. Admin bisa override via dropdown
4. Submit → backend validate:
   - price range (item 69)
   - version conflict (item 68)
   - stock availability untuk source=STOCK (item 71)
5. If OK → create PO + (if STOCK) book inventory
```

### 7.2 Flow: HPP Auto-Recalc
```
1. PO di-approve → trigger POApprovalListener
2. Listener panggil ProductService.recalcHpp(productId)
3. Recalc: SELECT SUM(qtyBagus * hargaSatuan) / SUM(qtyBagus)
   FROM PurchaseOrderItem
   WHERE productId = X AND approvedAt > NOW() - 90 days
4. Update Product.autoCalculatedHpp
5. effectiveHpp = manualOverrideHpp ?? autoCalculatedHpp
```

### 7.3 Flow: Conflict Resolution
```
1. User A buka PO #123 (version=5)
2. User B buka PO #123 (version=5)
3. User A save → success, version jadi 6
4. User B save → backend return 409 (version=5, expected)
5. Frontend tampilkan <ConflictModal />:
   - "PO #123 sudah diubah oleh User A pada 14:30"
   - Tombol: [Refresh & Compare] [Force Override (Head only)]
6. User B refresh → dapat data version 6
7. User B re-apply changes → save → success
```

---

## 8. Error Handling

### 8.1 Backend Errors
| HTTP | Cause | Pesan | Action |
|------|-------|-------|--------|
| 409 | Optimistic lock conflict | "Data sudah diubah user lain" | Refresh & retry |
| 422 | Price out of range | "Harga X di luar range [min, max], butuh approval" | Trigger approval flow |
| 422 | Stock tidak cukup untuk source=STOCK | "Stok tidak cukup, tersedia X butuh Y" | Suggest switch to PO |
| 422 | Next status invalid | "Tidak bisa set status X karena Y belum selesai" | Show dependency chain |

### 8.2 Frontend Errors
- Toast notifications untuk error recoverable
- Modal untuk conflict (perlu user action)
- Inline validation untuk form errors
- Loading states untuk semua async operations

---

## 9. Testing Strategy

### 9.1 Unit Tests
- `PurchaseOrderService.validatePriceRange()` — 4 test cases (in range, below min, above max, exact boundary)
- `ProductService.recalcHpp()` — test with various PO histories
- `validateNextStatus()` — test all transition paths

### 9.2 Integration Tests
- End-to-end PO creation with conflict (simulate 2 concurrent saves)
- HPP recalc after PO approval
- Payment calculation with reject items

### 9.3 E2E Tests (Playwright)
- Create PO with source=STOCK, verify inventory booked
- Create PO with out-of-range price, verify approval flow
- Trigger conflict modal, verify recovery path

### 9.4 Regression
- Run full existing test suite — pastikan PO approval, faktur-pembelian, payment flow masih hijau

---

## 10. Rollout Plan

### 10.1 Phase 1: Schema & Backend
1. Schema migration (add fields)
2. Backend services updated
3. New endpoints implemented
4. Backend tests passing

### 10.2 Phase 2: Frontend
1. Components baru (modal, badges, indicators)
2. Pages di-update
3. Frontend tests passing

### 10.3 Phase 3: Integration & E2E
1. End-to-end tests
2. Manual QA di staging
3. Backward compatibility check

### 10.4 Phase 4: Deploy
1. Migration script run di production
2. Feature flag (optional) — gradual rollout
3. Monitor error rates

---

## 11. Open Items / Risks

### 11.1 Risks
- **Risk 1:** Backfill ProductSupplierHistory dari data PO lama bisa lambat untuk data besar → **Mitigation:** run as background job, monitor
- **Risk 2:** HPP auto-recalc bisa inconsistent jika ada PO yang status-nya unclear → **Mitigation:** hanya PO dengan status APPROVED yang masuk hitungan
- **Risk 3:** Optimistic lock bisa frustrate user jika banyak concurrent edit → **Mitigation:** UI jelaskan conflict + allow force override untuk Head
- **Risk 4:** Cleanup kolom (item 73) bisa break integrasi external → **Mitigation:** default behavior = hide dari UI, jangan drop column

### 11.2 Out of Scope (untuk fase lain)
- Format Kode Universal (76) → Fase 2
- Filter periode global (29) → Fase 5
- Input autocomplete global (28) → Fase 5
- Pengajuan Dana in-system (22) → Fase 3
- PPh 21/23 (15) → Fase 3
- Report Penjualan rename (16) → Fase 3
- Jurnal Umum G-SERP (26) → Fase 3
- Dimensi Finansial hapus (27) → Fase 3
- Aset Tetap riwayat (30) → Fase 3
- Swap HPP/Laba card (35) → Fase 3
- Format Laba Rugi G-SERP (36) → Fase 3
- Format invoice G-SERP (75) → Fase 3
- Master Vendor import Excel (1) → Fase 4
- Customer Legalitas card (2) → Fase 4
- Kategori COA (3) → Fase 4
- Hide 3-way match (8) → Fase 4
- Communication protocol Design (82) → Fase 6
- Design batch/expired/attachment (87) → Fase 6
- Foto kemasan (88) → Fase 6
- BusDev card persistence (89) → Fase 7
- BusDev month filter (90) → Fase 7
- BusDev auto-save (91) → Fase 7

---

## 12. Acceptance Checklist

- [ ] Schema migration berhasil tanpa error
- [ ] Semua backend tests passing
- [ ] Semua frontend tests passing
- [ ] E2E tests passing
- [ ] 17 item Purchase Core berstatus ✅
- [ ] No regression di item existing
- [ ] Documentation updated
- [ ] Code review passed
- [ ] User UAT signed off

---

**Spec ditulis oleh brainstorming process dengan konfirmasi:**
- Strategi scope: **Fase per Modul**
- Fase 1: **Purchase Core (17 item)**
- Conflict resolution: **Optimistic Lock + Versioning**
- HPP link: **Auto-calc dari PO + Allow Override**
- Sumber barang: **Dropdown + Default Smart**
- SOP harga: **Threshold + Approval Workflow**
- Diskon/Ongkir: **2 Field Diskon (Manual + Rounding) + Ongkir**