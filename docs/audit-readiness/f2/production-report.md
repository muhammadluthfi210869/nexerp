# F2-PRODUCTION — Production Domain Audit Report

Agent: F2-PRODUCTION · Port 3214 · DB `audit_f2_production`
Tanggal 2026-10-01. Protokol: `docs/audit-readiness/F2-PROTOCOL.md`.
Semua angka di bawah adalah hasil eksekusi langsung, bukan pembacaan statis.

Ringkasan: **8 temuan, 3 BLOCKER, 4 CRITICAL, 1 MAJOR. Semua TERBUKTI.**
F1 claims: D4-004 **TERBUKTI** (catch di luar transaction menelan error, valuasi basi); D3-011 **DIBANTAH SEBAGIAN** (bukan hanya fail-open pada `@Roles` kosong, controller production sama sekali tidak memasang `RolesGuard`).

---

### [F2-PROD-001] Pemakaian material di proses produksi menghasilkan saldo stok negatif tanpa interlock (terukur: -5.000)
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/warehouse/services/warehouse-release.service.ts:74-77`
               `backend/src/modules/production/services/production-actuals.service.ts:251-285`
               `POST /v1/production/schedules/:id/result → 201`
- Bukti:       `handleProductionConsumption` mendengarkan event `production.schedule_completed` dan mengeksekusi `tx.materialItem.update({ data: { stockQty: { decrement: Number(item.qty) } } })` tanpa validasi ketersediaan stok fisik dan tanpa CHECK constraint di PostgreSQL (`CHECK (stock_qty >= 0)`). Eksekusi runtime: schedule dibuat dengan kebutuhan material 5.000 unit di atas sisa stok, hasil produksi disubmit, stok `material_items.stockQty` langsung anjlok ke angka persis **-5000**. Transaksi mutasi inventaris (`inventory_transactions`) tetap tercatat meski stok menjadi minus.
- Repro:       `POST /v1/production/schedules` `{ "workOrderId": "<woId>", "machineId": "<mId>", "stage": "MIXING", "targetQty": 100 }` → insert `production_step_details` dengan `qtyTheoretical = currentStock + 5000` → `POST /v1/production/schedules/<id>/result` `{ "resultQty": 100 }` → jalankan `SELECT "stockQty" FROM material_items WHERE id = '<matId>'` → nilai terbukti negatif `-5000`.
- Dampak ke client: Stok bahan baku pabrik bisa menjadi negatif di sistem tanpa peringatan, merusak kalkulasi COGS/HPP, mengacaukan perhitungan valuasi Moving Average Price (MAP), dan menghasilkan data persediaan fiktif.
- Lapis:       DB & API

---

### [F2-PROD-002] Multi-table ACID transaction pecah pada pembuatan Batch Record: ProductionPlan tetap commit saat link WorkOrder gagal
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/production/production-batch-record.service.ts:111-140`
               `POST /v1/production/batch-records → 201`
- Bukti:       `createBatchRecord` mengeksekusi `this.prisma.productionPlan.create` di luar transaksi atomik terintegrasi, lalu mencoba mengaitkan `workOrder.update` di dalam blok `try / catch` yang hanya mencatat log "best-effort" dan menelan error. Eksekusi runtime: saat dipanggil dengan `salesOrderId` valid dan `workOrderId: 00000000-0000-0000-0000-000000000000` (tidak ada), API merespons **201 Created**, row `production_plans` baru bertambah 1 (`batchNo: BMR-20261001-71B6`), namun `workOrder` tidak pernah terhubung (`planId` tetap null) dan event `production.batch_record.created` tetap ditembakkan ke sistem downstream.
- Repro:       `POST /v1/production/batch-records` dengan body `{"salesOrderId":"<valid_so_id>","workOrderId":"00000000-0000-0000-0000-000000000000","notes":"AUDIT_PROBE"}` → response **201**, verifikasi di DB `SELECT count(*) FROM production_plans WHERE "apjNotes" = 'AUDIT_PROBE'` menghasilkan 1 baris yatim.
- Dampak ke client: Catatan Batch Manufaktur Elektronik (BMR) menjadi yatim tanpa kaitan dengan Surat Perintah Kerja (SPK/Work Order), memutus rantai ketertelusuran batch obat/kosmetik.
- Lapis:       API & DB

---

### [F2-PROD-003] Seluruh endpoint ProductionController tidak memiliki RolesGuard: Role HR dan non-produksi bebas mengeksekusi pabrik
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/production/production.controller.ts:46`
               `POST /v1/production/work-orders → 201`
               `POST /v1/production/schedules → 201`
- Bukti:       `ProductionController` hanya mendeklarasikan `@UseGuards(JwtAuthGuard)` di tingkat class, tanpa menyertakan `RolesGuard` dan tanpa dekorator `@Roles(...)` pada setiap metodenya. Berbeda dengan `QCAuditsController` yang mengembalikan **403 Forbidden** untuk role tidak berwenang, eksekusi `POST /v1/production/work-orders` menggunakan JWT milik user HR (`yulia@dreamlab.com`) menghasilkan status **201 Created** dan berhasil memasukkan row baru ke tabel `work_orders`.
- Repro:       Login dengan `yulia@dreamlab.com` (role HR) → `POST /v1/production/work-orders` `{ "leadId": "<leadId>", "targetQty": 500, "targetCompletion": "2026-11-15T00:00:00.000Z" }` → mengembalikan status **201 Created** (seharusnya 403 Forbidden).
- Dampak ke client: Karyawan HR atau staf pemasaran dapat membuat Surat Perintah Kerja pabrik, mengatur jadwal mesin mixing/filling, dan memicu pengeluaran bahan baku tanpa otorisasi kepala produksi.
- Lapis:       AUTH

---

### [F2-PROD-004] DTO Material Requisition mewajibkan `woId` (merujuk ProductionPlan) bukan WorkOrder, menyebabkan FK Violation HTTP 500
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/production-planning/dto/requisition.dto.ts:9-12`
               `backend/src/modules/production-planning/controllers/requisitions.controller.ts:31`
               `POST /v1/material-requisitions → 500`
- Bukti:       `CreateRequisitionDto` hanya menerima properti `woId` bertipe UUID tanpa properti `workOrderId`. Di schema database PostgreSQL, kolom `material_requisitions.woId` memiliki foreign key constraint `material_requisitions_woId_fkey` yang menunjuk ke `production_plans(id)`, bukan `work_orders(id)`. Eksekusi runtime: mengirimkan ID Work Order ke endpoint `POST /v1/material-requisitions` langsung crash dengan **500 Internal Server Error** akibat `violates foreign key constraint "material_requisitions_woId_fkey"`.
- Repro:       Ambil id dari `work_orders` → `POST /v1/material-requisitions` `{ "woId": "<work_orders.id>", "materialId": "<matId>", "qtyRequested": 10 }` → status **500 Internal Server Error** dengan log constraint foreign key violation.
- Dampak ke client: Integrasi antarmuka yang mengirim ID Work Order untuk meminta bahan baku manufaktur selalu gagal dengan error 500 karena sistem menduplikasi konsep Work Order dan Production Plan.
- Lapis:       API & DB

---

### [F2-PROD-005] Zero API Routes untuk Bill of Materials (BOM): Tidak ada jalur baca dan tulis master formula bahan
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/production/production.controller.ts`
               `backend/src/modules/rnd/rnd.controller.ts`
               `backend/src/modules/production-planning/production-planning.module.ts`
- Bukti:       Pemetaan 146 endpoint dari Swagger JSON `/api/docs-json` membuktikan tidak ada satu pun route untuk mengelola tabel `bill_of_materials`. Seluruh probe HTTP runtime (`GET /bom`, `POST /bom`, `GET /bill-of-materials`, `POST /bill-of-materials`, `GET /rnd/bom`, `GET /production/bom`) mengembalikan **404 Not Found**. Baris tabel `bill_of_materials` di database hanya bisa tercipta secara tidak langsung lewat approval sample request atau seed langsung.
- Repro:       `curl -X GET http://localhost:3214/v1/bom` atau `curl -X GET http://localhost:3214/v1/production/bom` dengan Bearer token admin → status **404 Not Found**.
- Dampak ke client: Tim operasional pabrik tidak memiliki antarmuka API mandiri untuk mengecek, memperbarui, atau mengonfigurasi struktur Bill of Materials (BOM) per produk.
- Lapis:       API

---

### [F2-PROD-006] Hook antarmuka Quality Workbench mengirim payload tidak cocok dengan DTO backend: seluruh audit in-process gagal HTTP 400
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `frontend/src/app/(dashboard)/quality/workbench/_hooks/useQualityWorkbenchOperations.ts:110,123,128,166,167`
               `backend/src/modules/qc/dto/create-audit.dto.ts:30-37`
               `backend/prisma/schema/enums.prisma:271-284`
- Bukti:       Frontend hook `useQualityWorkbenchOperations` mengirim field `stage: activePhase` (backend mengharuskan `phase: QcInspectionPhase`), dan mengirim enum `status: "PASS"`, `status: "HOLD"`, serta `status: "REJECTED"`. Padahal enum Prisma `QCStatus` di backend secara kaku hanya menerima `GOOD`, `QUARANTINE`, dan `REJECT`. Eksekusi runtime: payload dengan `status: "PASS"` ditolak backend dengan status **400 Validation Failed**.
- Repro:       `POST /v1/qc/audits` `{ "status": "PASS", "stage": "MIXING", "ph": 5.5 }` → status **400 Bad Request**, response `{ "code": "VALIDATION_FAILED", "message": "Request validation failed." }`.
- Dampak ke client: Operator inspeksi mutu (QC) di lini mixing, filling, dan packing tidak bisa menyimpan hasil audit fisik sama sekali; tombol submit di layar selalu memunculkan error toast.
- Lapis:       FE-BE

---

### [F2-PROD-007] Modul R&D Formula crash `TENANT_UNRESOLVED` pada baca, dan payload simpan di-mocking toast sukses palsu di antarmuka
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `frontend/src/app/(dashboard)/samples/formula/_hooks/useFormulaOperations.ts:291-307`
               `backend/src/modules/rnd/dto/create-formula.dto.ts:33-54`
               `backend/src/modules/rnd/services/rnd-sample.service.ts:87-94`
               `backend/src/modules/rnd/formulas/formulas.service.ts:34`
- Bukti:       Dua kegagalan fatal pada rantai R&D:
               (1) Setiap panggilan `GET /v1/rnd/formulas` dan `GET /v1/rnd/formulas/:id` selalu ditolak backend dengan **400 Bad Request** (`TENANT_UNRESOLVED: Tenant wajib diisi dari konteks server`) karena service R&D memvalidasi `organizationId` yang belum pernah diimplementasikan pada JWT claim user.
               (2) Antarmuka formulasi lab (`useFormulaOperations.ts:291-307`) mengirim payload `{ formulaCode, productName, customerName, totalWeightGr, costPerKg, phases }` tanpa `sampleRequestId` dan tanpa array `items` yang berisi `{ materialId, dosagePercentage, costSnapshot }`. Ketika backend menolak dengan 400 Validation Failed, blok `catch` di frontend menangkap error tersebut dan menampilkan pesan sukses palsu: `toast.success("Formula Disimpan (Lokal)", ...)` sementara data sama sekali tidak tersimpan ke database.
- Repro:       (a) `curl -X GET http://localhost:3214/v1/rnd/formulas -H "Authorization: Bearer <token>"` → mengembalikan status **400** `{ "code": "TENANT_UNRESOLVED" }`.
               (b) Buka form formula lab, klik simpan → toast hijau muncul, namun query DB `SELECT count(*) FROM formulas` tidak berubah.
- Dampak ke client: Seluruh formula produk baru tidak bisa dibaca dari database oleh formulator, dan aksi simpan formula di browser membodohi pengguna dengan toast hijau padahal data hilang.
- Lapis:       FE-BE & API

---

### [F2-PROD-008] Pembuatan draft formula lab R&D secara prematur memicu Sales Order dan Tagihan Piutang (Invoice) yang belum disetujui
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/rnd/formulas/services/formula-version.service.ts:182-205`
               `POST /v1/rnd/formulas → 201`
- Bukti:       Di dalam `FormulaVersionService.create`, saat formulator membuat entri formula awal (`status: DRAFT`, version 1), baris 182-205 langsung mengeksekusi `tx.salesOrder.create` dengan status `PENDING_DP` dan membuat tagihan `salesInvoice` berkategori `RECEIVABLE` bertipe `DP` berstatus `UNPAID`. Verifikasi eksekusi: sebelum membuat formula terdapat 14 sales order, setelah formula lab dibuat jumlah sales order di database langsung naik menjadi 15 dan invoice DP langsung terbit tanpa adanya approval dari customer.
- Repro:       Hitung jumlah row `sales_orders` → panggil `POST /v1/rnd/formulas` dengan formula draft → hitung kembali row `sales_orders` → bertambah 1 baris dengan status `PENDING_DP`.
- Dampak ke client: Setiap uji coba eksperimen racikan formula di lab R&D langsung mengotori buku besar komersial dan piutang penjualan dengan tagihan fiktif sebelum ada deal bisnis.
- Lapis:       API & DB

---

### [F2-PROD-009] D4-004 Evaluasi: ValuationService menelan error event sehingga valuasi persediaan basi diam-diam
- Severity:    CRITICAL
- Confidence:  TERBUKTI (Temuan F1 Terkonfirmasi)
- Lokasi:      `backend/src/modules/finance/valuation.service.ts:20-91`
- Bukti:       Pada `handleInboundApproved` (`@OnEvent('scm.inbound.approved')`), loop pembaruan Moving Average Price (MAP) item membungkus pemanggilan transaksi DB dalam `try { await this.prisma.$transaction(...) } catch (err) { console.error(...) }`. Karena event ini berjalan asynchronous dan decoupled dari transaksi utama `InboundsService.qcValidate`: jika kalkulasi harga atau penulisan `material_valuations` gagal, exception ditelan diam-diam. Status inbound barang tetap APPROVED, kuantitas stok bertambah, namun riwayat valuasi tidak terbentuk dan `materialItem.unitPrice` tetap menggunakan harga lama tanpa mekanisme retry atau Dead Letter Queue (DLQ).
- Repro:       Inspeksi penanganan error di `backend/src/modules/finance/valuation.service.ts:85-90`.
- Dampak ke client: Harga Pokok Penjualan (HPP) dan valuasi total aset persediaan di neraca keuangan melenceng dari nilai pembelian fisik di gudang.
- Lapis:       API & DB
