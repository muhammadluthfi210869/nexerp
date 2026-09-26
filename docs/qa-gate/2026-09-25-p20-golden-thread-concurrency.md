# QA Gate — Fase 4: End-to-End Golden Thread & Concurrency Stress Test (2026-09-25)

**Topik:** Eksekusi Fase 4 / P20 — Verifikasi End-to-End 13 Simpul Rantai Pasok & Finansial serta Pengujian Beban Konkurensi Tinggi (50–100 transaksi/user serentak: 0 deadlocks, 0 inventory variance).

**Branch:** `feat/p08-contracts-subject-ownership`  
**Basis Plan:** `~/.claude/plans/aku-butuh-bantuanmu-bagaimana-glowing-metcalfe.md` (Fase 4: P20)  
**Dokumen Referensi:** `docs/ROADMAP-6-FASE-GO-LIVE-ZERO-ERROR.md`  
**Laporan Sebelumnya:** `docs/qa-gate/2026-09-25-fase3b-auto-journal-balance.md`  

---

## Verdict

# BELUM SIAP KIRIM

**Fase 4 (P20 Golden Thread & Concurrency) terukur HIJAU dan TUNTAS di tingkat kode & test harness:**
- `scripts/test-golden-thread.sh` = **`EXIT=0`** (1/1 suite, 13 simpul rantai pasok terverifikasi tanpa putus)
- `scripts/stress-test.sh` = **`EXIT=0`** (1/1 suite, 3/3 test passed: 60 concurrent picks, 50 concurrent journals, 50 concurrent users)
- `npm run test:p20:golden-thread` = **`EXIT=0`**
- `npm run test:p20:concurrency` = **`EXIT=0`**

Verdict tetap **BELUM SIAP KIRIM** karena:
1. **Fase 5 (Migrasi & Disaster Recovery) belum dijalankan** (dry-run migrasi database staging/production, backup-restore snapshot rehearsal).
2. **Fase 6 (UAT Klien & Go-Live Cutover) belum dijalankan** (memerlukan 14 hari dual-run dan tanda tangan persetujuan resmi owner/klien).
3. **Deploy Drift Production Masih Terbuka** (Production live berjalan di commit `7a449e0a`, 102+ commit di belakang working tree, memori `production-deploy-drift-2026-09-25`).
4. **Data COA live belum diselaraskan menyeluruh** (25 kode COA legacy masih belum diseed ke database production, memori `coa-code-regimes-diverge`).

Sesuai aturan ketat `CLAUDE.md QA GATE`: selama masih ada fase dan gerbang kualitas yang belum diuji di staging/live, status resmi adalah **BELUM SIAP KIRIM**.

---

## 1. Bukti Eksekusi Simpul Rantai Pasok (13 Nodes)

Suite: `backend/test/p20/p20-golden-thread.e2e-spec.ts`  
Runner: `scripts/test-golden-thread.sh`  
Hasil: **`EXIT=0`** (Time: ~66s, 1 passed, 1 total)

Seluruh 13 simpul siklus hidup ERP berhasil dieksekusi secara terintegrasi langsung di atas engine PostgreSQL riil:

| Node | Simpul Proses | Entitas / Operasi | Bukti Verifikasi | Status |
|---|---|---|---|---|
| **1** | CRM Lead Intake | `SalesLead` | `status: NEW_LEAD -> CONTACTED -> NEGOTIATION` | ✅ PASS |
| **2** | R&D Sample & Formula | `SampleRequest`, `Formula` | `FormulaStatus: PRODUCTION_LOCKED`, Sample Approved | ✅ PASS |
| **3** | Quotation & Deal | `Quotation` | `status: ACCEPTED`, Deal Won | ✅ PASS |
| **4** | Sales Order | `SalesOrder`, `Customer` | `status: CONFIRMED`, linked line items | ✅ PASS |
| **5** | MRP Calculation | `GoodsRequirement` | BOM exploded, requirement items mapped | ✅ PASS |
| **6** | Purchase Order Supplier | `PurchaseOrder`, `Supplier` | PO Raw Material & Packaging, status `ORDERED` | ✅ PASS |
| **7** | Warehouse Inbound (GRN) | `WarehouseInbound`, `MaterialInventory` | Status `QUARANTINE`, initial available stock = 0 | ✅ PASS |
| **8** | SPK Produksi & BMR | `ProductionPlan`, `WorkOrder`, `ProductionStepLog` | BMR logged: Mixing (98L bulk) -> Packing (4950 pcs) | ✅ PASS |
| **9** | QC Lab & APJ Release | `QCAudit`, `FinishedGood` | QC GOOD (pH 5.5, visc 2900), APJ released: 4950 pcs | ✅ PASS |
| **10** | Delivery Order | `DeliveryOrder` | Tracking number linked, status `DELIVERED` | ✅ PASS |
| **11** | Sales Invoice & Journal | `Invoice`, `JournalEntry` | Balanced auto-journal posted: Dr AR, Cr Sales, Cr PPN | ✅ PASS |
| **12** | Pelunasan & Receipt | `Payment`, `Invoice` | Invoice status `PAID`, Dr Kas BCA, Cr Piutang | ✅ PASS |
| **13** | Tutup Buku Finansial | `FinanceService.getTrialBalance`, `getProfitLoss` | `isBalanced: true`, Debit = Credit (delta <= 0.01) | ✅ PASS |

---

## 2. Bukti Pengujian Beban Konkurensi & Integritas Data (Stress Test)

Suite: `backend/test/p20/p20-concurrency.e2e-spec.ts`  
Runner: `scripts/stress-test.sh`  
Hasil: **`EXIT=0`** (Time: ~25s, 3 passed, 3 total)

### 2.1 Skenario 1: 60 Transaksi Konkuren Rebutan Stok (Batch 50 Unit)
- **Kondisi Uji:** 60 request HTTP serentak (`Promise.allSettled`) via endpoint `/warehouse/picking/execute` dengan autentikasi WAREHOUSE bearer token dan idempotency key unik.
- **Hasil:**
  - Request berhasil (`HTTP 200/201`): **50 request** (alokasi tepat 50 unit)
  - Request ditolak bersih (`HTTP 400 Insufficient Stock`): **10 request**
  - Deadlock terdeteksi (`PostgreSQL 40P01` / `500 Server Error`): **0 deadlocks**
  - Stok akhir batch (`currentStock`): **0** (tidak pernah negatif)
  - Stok item material (`stockQty`): **0**
  - Total pergerakan ledger (`InventoryTransaction OUTBOUND`): **50 record, total = 50 unit**
  - **Inventory Variance:** **0.000** (Konservasi: Stok Awal (50) - (Stok Akhir (0) + Total Diambil (50)) = 0)

### 2.2 Skenario 2: 50 Jurnal Finansial Serentak (Double-Entry Balance)
- **Kondisi Uji:** 50 request tulis jurnal double-entry serentak (`Promise.allSettled`) pada akun Kas BCA (1110) dan Penjualan (4101).
- **Hasil:**
  - Jurnal berhasil dibuat: **50/50**
  - Gagal / Deadlock: **0**
  - Verifikasi Trial Balance:
    - `trialBalance.isBalanced`: **`true`**
    - `|totalDebit - totalCredit|`: **`0.00`** (Ekuilibrium presisi sempurna)

### 2.3 Skenario 3: 50 User Transaksi Serentak (Multi-Client Throughput)
- **Kondisi Uji:** 50 operasi pembuatan lead CRM dengan relasi PIC staff konkuren.
- **Hasil:**
  - Transaksi berhasil: **50/50**
  - Deadlock / Connection Pool starvation: **0**
  - Data integrity: **50 record distinct terverifikasi di PostgreSQL**

---

## 3. Perbaikan Teknis & Proteksi Race Condition yang Diterapkan

1. **Row-Level Lock pada `warehouse.service.ts:pickBatch`:**
   - Menambahkan `await tx.$executeRaw\`SELECT id FROM material_inventories WHERE id = \${data.batchId}::uuid FOR UPDATE\`;` di dalam transaksi Prisma.
   - Mengunci baris batch secara deterministik di PostgreSQL sehingga transaksi konkuren mengantre secara serial.
   - Mencegah race condition double-decrement dan menghilangkan peluang terjadinya stock negative atau inventory variance.
2. **Pembersihan Bersih Relasi Residual (`test/p20/p20-http-harness.ts`):**
   - Menambahkan penghapusan `inventoryTransaction` sebelum penghapusan `materialInventory` dan `materialItem` pada fungsi `cleanP20Residuals`.
   - Mengatur urutan eksekusi `cleanP20Residuals` sebelum pembuatan `adminUser` di `beforeAll` untuk mencegah foreign key constraint violation.
3. **Penyelarasan Tipe Data Prisma Decimal:**
   - Mengonversi pembacaan nilai `Decimal` (`qtyResult`, `stockQty`) ke `Number(...)` pada assertion assertion e2e spec.
4. **Runner Scripts Standar:**
   - `scripts/test-golden-thread.sh` (+x)
   - `scripts/stress-test.sh` (+x)
   - `package.json` scripts: `test:p20:golden-thread`, `test:p20:concurrency`, `test:p20`.

---

## 4. Rekapitulasi Rencana Go-Live (Sisa Langkah)

| Fase | Deskripsi | Status | Kebutuhan Lanjut |
|---|---|---|---|
| **Fase 1** | Build Stabilization & Typecheck | ✅ HIJAU | Selesai |
| **Fase 2** | Eliminasi Mock Plumbing | ✅ HIJAU | Selesai |
| **Fase 3a** | Multi-tenant Hard Lock | ✅ HIJAU | Selesai |
| **Fase 3b** | Auto-Journal Double-Entry Balance Guard | ✅ HIJAU | Selesai |
| **Fase 4** | E2E Golden Thread & Concurrency Stress Test | ✅ **HIJAU** | **Selesai hari ini (2026-09-25)** |
| **Fase 5** | Migrasi Skema Live & Disaster Recovery Rehearsal | ⏳ PENDING | Eksekusi script migrasi + snapshot rehearsal |
| **Fase 6** | UAT Klien & Dual-Run 14 Hari | ⏳ PENDING | Memerlukan runtime approval owner / stakeholder |
