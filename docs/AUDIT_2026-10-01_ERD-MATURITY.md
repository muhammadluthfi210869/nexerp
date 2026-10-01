# Audit Kematangan ERP — Input, Detail, Action, Print

**Tanggal:** 2026-10-01
**Ruang lingkup:** 275 route frontend, 40 modul backend (113 controller, 186 service), 212 model Prisma
**Sumber kebenaran:** `docs/legacy-erp/contracts/` (state machine, data ownership, business rules, screen contract) + `docs/legacy-erp/data/analytics/raw/ERP_OLD_BUSINESS_FLOW.md` (baseline GsERP KIL)

---

## Ringkasan Eksekutif

Dirasakan benar: **overview/tabel sudah matang, input/detail/action/print belum.**

Akar masalahnya bukan kekurangan fitur, tapi **sistem yang benar sudah ada di backend lalu tidak dipakai frontend.** Backend punya generator nomor transaksional, pipeline PDF dengan 11 tipe dokumen, dan auto-generate dokumen via event. Frontend mengabaikannya dan mengarang nomor sendiri di browser.

| Dimensi | Status | Bukti |
|:---|:---|:---|
| Auto-number | ❌ Terputus | Generator ada & dipakai 40 file backend, tapi **0 controller mengeksposnya** — FE tidak punya jalur ke sana sama sekali |
| Double input | ❌ Sistemik | 16 defect teridentifikasi; akar: tidak ada jalur "create from parent" |
| Detail page | ❌ 25% | 9 dynamic route dari 275; **85 dari 86 drawer tidak fetch data-nya sendiri** |
| Action / status | ❌ 15% | 5 dari 40 modul punya guard; enforcement path **dead code** |
| Print | ⚠️ 67% | 12 dari 18 dokumen punya template; engine PDF server-side hampir tidak tersentuh FE |

---

## 1. Auto-Generate Nomor

### Yang sudah benar

`backend/src/modules/system/id-generator.service.ts:14` — `IdGeneratorService.generateId(prefix)` → `PREFIX-YYMM-SEQ`, atomic via `$transaction` + `upsert` increment, backing table `SystemSequence` (`system.prisma:72`, `@@unique([prefix, period])`). `@Global` module, injectable di mana saja. 40 file memakai, 28 prefix tercakup (`SO` 7x, `PO` 3x, `GRN` 2x, `SMP` 9x, `JRN` 4x, dst).

**Auto-generate dokumen via event juga sudah jalan** — `document-automation.service.ts` punya 5 `@OnEvent` listener (`sales_order.created`, `work_order.created`, `production.qc_final_passed`, `delivery_order.created`, `lead.status.changed`) yang membuat draft dokumen bernomor server-side untuk 11 `DocumentType`. Ini persis perilaku ERP lama.

### Yang rusak

**43 penomoran dokumen dikarang di browser — 29 file frontend.** Angka ini bergantung definisi, jadi berikut cara hitungnya (regex `PREFIX` huruf + sumber numerik, terhadap `frontend/src/**/*.tsx|ts`):

| Pola | situs | file |
|:---|--:|--:|
| `Date.now()` di dalam template | 77 | 61 |
| `padStart(...)` | 67 | 38 |
| `toISOString()` di dalam template | 26 | 25 |
| `.length + 1` | 20 | 17 |
| **irisan ketat (identifier-shaped)** | **43** | **29** |

Yang dihitung pada irisan ketat hanya template yang bentuknya `PREFIX-…${angka}` — inilah yang benar-benar mengarang nomor dokumen. Angka lain di tabel lebih longgar dan ikut menghitung string tanggal, bukan nomor.

**Akar masalahnya bukan "lupa makai generator" — FE tidak punya jalan ke generator sama sekali:**

| Fakta | Nilai |
|:---|--:|
| Backend file yang memakai `IdGeneratorService` | 40 |
| **Controller yang mengeksposnya** | **0** |
| **File FE yang memanggil endpoint nomor** | **0** |
| File FE yang menyebut `generateId` | 1 — dan itu `lib/error-tracker.ts:25`, fungsi `generateId()` **milik sendiri**, bukan service |

Artinya perbaikan ini bukan sekadar "pindahkan logika nomor ke backend". Perlu kontrak endpoint lebih dulu; setelah itu logika penomoran di FE masih harus dihapus. Tanpa itu, tidak ada cara FE untuk berhenti mengarang nomor — dan tidak ada satu pun nomor FE yang bisa dipercaya sekarang.

Nomor yang paling rusak — semuanya dokumen atau master data:

| File | Pola | Masalah |
|:---|:---|:---|
| `master/customers/_hooks/useCustomerOperations.ts:322` | `CUST-${String(customersList.length + 1).padStart(3,"0")}` | **Berbasis panjang array.** Hapus 1 customer, customer berikutnya menimpa nomor yang sudah dipakai. Muncul juga di `page.tsx:432`. |
| `master/warehouses/_hooks/useWarehouseOperations.ts` | `GDG-0${warehousesList.length + 1}` | Sama — berbasis panjang array, dan tanpa `padStart` |
| `master/goods/_hooks/useGoodsOperations.ts` | `BRG-${Date.now().slice(-4)}` | 10.000 nilai per siklus |
| `master/suppliers/_hooks/useSupplierOperations.ts` | `SUP-CAT-${Date.now().slice(-4)}` | 10.000 nilai per siklus |
| `finance/cash-in/_hooks/…`, `cash-out/…`, `bank-reconciliation/…` | `KM-${…slice(-6)}`, `KK-${…slice(-6)}`, `ADJ-RECON-${…slice(-6)}` | 4 modul keuangan mengarang scheme sendiri-sendiri |
| `production/schedule-{filling,mixing,packaging}` | `SCH-*-2026-${String(x.length + 1).padStart(4,"0")}` | 3 jadwal produksi, semuanya berbasis panjang array |

**Mitigasi yang sudah ada — tapi tidak merata.** `Customer.code` punya `@unique`, jadi tabrakan akan error P2002, bukan diam-diam menduplikasi. **`Supplier` tidak punya kolom `code` sama sekali.** `suppliers/page.tsx:405` mengarang `VND-BBK-001`, lalu `suppliers.service.ts:104-120` membuangnya — field `code` tidak ada di `data`. Nomor itu tidak pernah masuk database, jadi tidak ada yang bisa bentrok dan tidak ada yang bisa ditunjuk. Master data lain perlu dicek per-model; `Customer` dan `MaterialItem` punya kolom, `Supplier` tidak.

### Kontrak vs kode

`CreateProductionPlanDto.batchNo` di-`@IsNotEmpty()` (`production-planning/dto/production-plan.dto.ts:11`), sementara `production-plans.service.ts:23` punya fallback `dto.batchNo || generateId('BMR')` — **dead code**, tidak pernah bisa jalan. Generator sudah terpasang lalu dikunci oleh validasi.

---

## 2. Double Input

### Akar masalah: DEC-016 dilanggar

`02_DATA_OWNERSHIP.yaml` rule 6: *"CHILD entities (per DEC-016: GoodsReceipt, PurchaseInvoice, SalesInvoice) have NO standalone create endpoint — they are created from a parent detail page by a delegated action."*

Ketiga endpoint ada:

- `scm/controllers/inbounds.controller.ts:22` — `@Post()`
- `scm/controllers/purchase-invoices.controller.ts:30` — `@Post()`
- `finance/sales-invoices/sales-invoices.controller.ts:43` — `@Post()`

Standalone create berarti tidak ada konteks parent, sehingga client harus kirim ulang semua yang sudah diketahui parent. Tersifat persis di DTO:

| Alur | Field yang digandakan | Bukti | Sev |
|:---|:---|:---|:---:|
| PO → Faktur Pembelian | `poId` + `vendorId` + `inboundId` + `grId` (alias dari GR yang sama) | `scm/dto/purchase-invoice.dto.ts:60,65,68,74,79` | **P0** |
| SO → Faktur Penjualan | nomor invoice **diketik user** + `soId` + `amountDue` (total SO sudah ada) | `commercial/dto/create-invoice.dto.ts:16,20,30` | **P0** |
| Jurnal (client) | client mengarang nomor **dan** mengisi tanggal/deskripsi/akun — header seharusnya milik server | 4 hook FE | **P0** |
| PO → Pembelian Masuk | `poId` + `warehouseId` + `doNumber` (gudang sudah di PO, DO sudah di-generate) | `scm/dto/inbound.dto.ts:45,49,54` | P1 |
| Kebutuhan → PO | minta ulang `materialId`, `supplierId`, `qty`, `unitPrice`; **DTO-nya sendiri diabaikan** (inline `@Body() dto: {...}`) sehingga nol validasi | `scm/controllers/purchase-orders.controller.ts:38-56` | P1 |
| Lead → SO | `leadId` + `sampleId` + `brandName` — brand sudah ada di lead, sample sudah milik lead | `commercial/dto/create-sales-order.dto.ts:42,46,55-57`; disalin verbatim di `sales-orders.service.ts:70,74` | P1 |
| SO line item | `materialId` **dan** `productName` wajib per baris | `create-sales-order.dto.ts:15,20` | P1 |
| Outbound (FE) | form sudah resolve customer dari SO di baris 74, lalu meminta lagi di baris 99 | `inventory/outbound/_components/OutboundFormModal.tsx:74,99` | P1 |
| SO DTO | `totalAmount` diterima lalu diabaikan/dihitung ulang — field yang terlihat wajib tapi diam | `create-sales-order.dto.ts:66` vs `sales-orders.service.ts:59` | P2 |

### Signs of the pattern

**Zero `readOnly` / `disabled` di seluruh 275 halaman** (grep di `(dashboard)` = 0 hasil). Tidak satu pun field turunan dikunci. Di mana server sebenarnya sudah tahu nilainya, FE menghitung ulang lalu mengirim balik.

### Yang sudah diperbaiki

`ERP_INPUT_OUTPUT_LINEAGE.md` DUPLICATE INPUT 3 (5 pasang route keuangan paralel): 4 dari 5 sudah hilang — `general-journal`, `kas-bank-masuk`, `kas-bank-keluar`, `buku-besar` **ABSENT**. Tersisa `laba-rugi` vs `reports/` (dan `reports/` juga dipakai marketing — segment `/reports` bentrok dua domain).

---

## 3. Detail Page

**9 dynamic route dari 275 (3.3%).** Tidak ada satu pun URL per-record untuk Sales Order, Purchase Order, Invoice, Work Order, atau Journal Entry. Yang ada hanya `marketing/*`, `notifications/[id]`, `samples/formula/[id]`, `samples/project-control/[projectId]`, `master/kpi-*`.

Detail dilakukan lewat **drawer yang menerima object dari list page** — 86 komponen `*Drawer*` / `*Detail*`.

### Temuan struktural terbesar

**85 dari 86 drawer tidak mengambil datanya sendiri.** Census `useQuery|api.get|axios|fetch|useSWR` di seluruh `*Drawer*.tsx` / `*Detail*.tsx` = **1 dari 86**.

| Drawer | Bukti | Status |
|:---|:---|:---|
| `components/production/WoDetailDrawer.tsx` | `useQuery(` + `api.get(` | **1-satunya yang benar** |
| `samples/social-tracker/components/PostDrawer.tsx` | `api.post('/marketing/social/ai/generate')` | Bukan self-fetch — itu mutasi (perbaiki caption), subjeknya tetap datang sebagai prop `post: PostItem \| null` di baris 42 |

Prop-drilling ini disengaja secara desain, bukan bug: drawer dipanggil dengan data yang sudah ada di tangan. Masalahnya ada di ujungnya — **drawer hanya bisa menampilkan field yang sudah dibawa query list.** Baris item order, baris jurnal, baris invoice: kalau list query tidak membawanya, drawer itu kosong.

Yang terbukti akibatnya, dari Batch F: **0 dari 11 halaman approval memuat baris item dari request yang diputuskan.** Approver memutuskan tanpa melihat apa yang diputuskan. Ini bukan "drawer tidak bisa fetch" — ini "list query memang tidak mengambil detail", dan tidak ada lapisan yang mengambilnya.

**Ini gap tunggal terbesar di lapisan detail.**

### Kematangan per entitas

| Entitas | Detail | Print | Self-fetch |
|:---|:---|:---|:---:|
| SalesOrder | `OrderDetailDrawer.tsx` 263 L | `SalesOrderPrintModal.tsx` 167 L | ✗ |
| PurchaseOrder | `ScmDetailDrawer`, `PurchasingDetailDrawer` 186 L | inline `scm-pembelian/page.tsx:739` | ✗ |
| SalesInvoice | `InvoiceDetailDrawer` (hanya di faktur-pembelian); `finance/invoices` **tidak ada detail** | inline `faktur-penjualan/page.tsx:1311` | ✗ |
| WorkOrder / SPK | `SpkDetailDrawer` | `SpkPrintModal` 223 L | ✗ |
| GoodsReceipt | `InboundDetailDrawer` 204 L | `GrnPrintModal` 190 L | ✗ |
| JournalEntry | `JurnalUmumDetailDrawer` (kecil) | ✗ | ✗ |
| BatchRecord | ada | inline | ✗ |
| SampleRequest | 4 drawer | ✗ | ✗ |

**178 dari 273 leaf route (65%) tidak punya komponen detail sama sekali.** Seluruh `approvals/*` (9 route), `finance/{bills,ledger,piutang,budget,taxes,closing}`, `legality/*`, 5 `dashboard/*`.

### Kontrak

`06_SCREEN_CONTRACT.json` mendeklarasikan **17 screen bertipe `detail`**. Yang ada: 2 (`notifications/[id]`, `samples/formula/[id]`). 15 hilang, termasuk `/production/batch-records/{id}`, `/finance/journal-entries/{id}`, `/finance/coa/{id}`, `/audit/logs/{id}`.

---

## 4. Action Page & Pergantian Status

### Enforcement path-nya dead code

`StateTransitionService` (`system/state-transition.service.ts`, 374 L) punya `TRANSITION_MAP` hardcoded di baris 38 — **7 entity saja** (`SalesLead, SampleStage, SOStatus, FormulaStatus, LifecycleStatus, DesignState, RegStage`) terhadap 37 entity / 165 transisi di kontrak.

- `validateTransition` — **5 call site produksi**: `sales-orders.service.ts:148`, `production-execution.service.ts:342`, `rnd-sample.service.ts:446,516,673`
- `executeTransition` — **0 call site produksi**. Semua kemunculannya ada di `__tests__/state-transition.service.spec.ts`.

`executeTransition` adalah **satu-satunya** method yang melakukan gate enforcement (`GATE_BLOCKED` + `verifyOverridePin`), audit logging, dan event emission. Karena tidak pernah dipanggil, **`StateTransitionLog` kosong** dan notifikasi gate tidak pernah jalan.

### 5 dari 40 modul punya guard

`rnd`, `creative`, `commercial`, `production`, `system`. **35 modul tanpa guard**, termasuk `bussdev` — yang memiliki pipeline SalesLead + SalesSample (2 entitas terbesar di kontrak) dan menulis enum tanpa validasi: `SampleStage.WAITING_FINANCE` (`lead-stage.service.ts:301,563`), `SHIPPED` (`pipeline.service.ts:296`), `APPROVED` (`bussdev.service.ts:378`).

### 14 blind status setter

| Endpoint | Catatan |
|:---|:---|
| `scm/goods-requirement.controller.ts:72` | `PATCH :id/status` → service `goods-requirement.service.ts:69` = `findUnique` lalu `update({status: dto.status})`. **Nol guard.** |
| `fulfillment/shipments.controller.ts:31` | service `:100` tulis `status` / `deliveredAt` / `shippedAt` dari DTO, tanpa gate |
| `bussdev/bussdev.controller.ts:298` | `PATCH sales-order/:id/status` — semua role bisa set status apa pun termasuk CANCELLED |
| `scm/purchase-orders.controller.ts:104` | summary-nya literal "approve/reject" — ini gap endpoint semantik |
| `production/production-planning/warehouse/todo` | 4 endpoint **tanpa `@Roles`** — user terautentikasi bisa set status apa pun |
| + 8 lainnya | `purchase-returns`, `inbounds`, `legality`x2, `marketing`x2, `todo` |

Bukti kebocorannya sampai ke UI: `approvals/goods-request/page.tsx:84-87` — tombol **Approve** memanggil `PATCH /scm/goods-requirements/:id/status` dengan `{status:"APPROVED"}`. **UI harus mengarang enum karena endpoint approve tidak ada.**

Sebaliknya ada 73 endpoint aksi semantik (`approve`, `reject`, `post`, `reverse`, `reconcile`, `allocate`, `reopen`, `qc-validate`, `delivery-gate`, `post-journal`, dst) — 40 `@Post(':id/<verb>')` unik. Jadi polanya **terbalik**: sebagian besar sudah benar, sisanya bocor.

### Precondition

| Aturan | Status | Bukti |
|:---|:---|:---|
| **BUS-RULE-107** — sample fee diverifikasi orang bernama sebelum R&D mulai | ✅ **benar** | `rnd-sample.service.ts:72-83` `assertSampleFeeVerified`; dipanggil `:355` (create formula) dan `:668`; kolom `paymentApprovedAt` / `paymentApprovedById` ada (`rnd.prisma:45`); `@Roles(FINANCE)` di `rnd.controller.ts:77,96` |
| — jalur kedua | ❌ **bypass** | `finance/services/finance-invoice.service.ts:480-486` tulis `paymentApprovedAt` + `stage:'QUEUE'` dari stage mana pun, tanpa cek `WAITING_FINANCE` |
| SO `DRAFT→DP_PAID` butuh DP 50% | ❌ tidak ada | cek hanya "DP invoice ada dan PAID" untuk `ACTIVE` — itu aturan berbeda (`sales-orders.service.ts:154`) |
| PurchaseRequest `DRAFT→APPROVED` forbidden | ⚠️ parsial | blokir `DRAFT` + `REJECTED`, tapi tanpa allow-list — `CANCELLED` lolos (`purchase-requests.service.ts:157`) |
| Journal post butuh balance | ⚠️ parsial | ada `assertPeriodOpen`, tidak ada cek debit = kredit (`sales-invoices.service.ts:124`) |

### Frontend

- **32 dari 275 page** punya aksi status sama sekali — 88% UI tanpa permukaan aksi
- 59 file mendeklarasikan `onApprove` / `onReject`; **21 tanpa guard status** — tombol approve/reject render di status apa pun
- Pola benar sudah ada: `approvals/finance-approvals/_components/FinanceApprovalsTable.tsx:142,152,161` gate per `req.status`; `components/dna/approval/ApprovalPageShell.tsx:564,612` gate `isPending`
- Pola salah: `quality/workbench/_components/QualityWorkbenchActionButtons.tsx:22-46` — Reject/HOLD/PASS hanya disabled saat network pending
- **Hanya 6 halaman** pakai konfirmasi sebelum mutasi; approve umumnya tidak
- Otorisasi level controller, **tidak pernah per-edge**. Kontrak minta `authorized_actor` per transisi; implementasi cukup menempelkan satu daftar role ke seluruh controller.

---

## 5. Print

### Yang sudah matang

`components/dna/DnaPrintDocument.tsx` (541 L) adalah **engine dokumen generik yang benar** — props `documentType`, `documentNumber`, `metaFields[]`, `columns[]`, `items[]`, `summaryRows[]`, `terbilangRupiah()` (terbilang), `signatures[]`, `qrVerificationCode`, `paperMode`. Print via portal ke `body`.

`app/globals.css:571` — blok `@media print` sungguhan: `@page { size: A4 portrait; margin: 8mm 10mm }`, `print-color-adjust: exact`, hide `aside/nav/button/input/.no-print`.

**Backend punya pipeline PDF yang lebih matang dari pemakaian frontend** — `document-automation/services/pdf-engine.service.ts:509-516` pakai `html-pdf-node` (puppeteer) lalu mengembalikan Buffer, dengan generator untuk 11 `DocumentType` termasuk `SURAT_JALAN`, `INVOICE_DP`, `INVOICE_FINAL`, `JOURNAL_ENTRY`, `QUOTATION`. Controller expose `GET drafts/:id/pdf` dan `POST pdf`.

**Hanya 7 file FE yang menyentuh API ini** — sisanya 16 file mengarang `DO-` / `INV-` / `BATCH-` sendiri di browser.

### Coverage: 12 dari 18 dokumen

| Ada | Tidak ada |
|:---|:---|
| Sales Order, Purchase Order, Faktur Penjualan, Invoice DP, Kwitansi DP, Surat Jalan (`warehouse/release`), LPB/GRN, Surat Pindah Gudang, Bukti Kas Masuk/Keluar, Salary Slip, SPK, CoA, Batch Record | **Faktur Pembelian**, **Journal voucher** (hanya `window.print()` di list), **Surat Terima Barang**, **barcode/label produksi** |

`delivery-orders` (Surat Jalan) — dokumen inti ERP lama dengan rangkap pengemudi — **tidak punya print sama sekali** (0 kemunculan `print` di 393 baris), dan tidak ada dukungan rangkap di backend.

### `window.print()` bukan sinyal kematangan

24 call site, tapi hanya **3 dokumen bisnis**. Sisanya 21 tombol cetak atas tabel laporan (AP aging, AR aging, trial balance, cash flow, laba-rugi, ledger, mutasi stok, KPI, tickets, guest-book x2, brand workspace x2). Template dokumen asli justru lewat `DnaPrintDocument`, bukan `window.print()`.

`components/dna/dna-interactive/result-print.tsx` **bukan** renderer dokumen — itu dialog sukses setelah simpan dengan 4 tombol callback. Tidak boleh dihitung sebagai lapisan print.

---

## 6. Mengapa "overview terlihat cukup"

Ini penjelasan langsung untuk impressi yang kamu laporkan:

1. **ROUTE_MAP.md hanya mendokumentasikan 59 dari 275 page (21%).** 216 undocumented. Kalau audit lewat ROUTE_MAP, yang terlihat memang sudah rapi.
2. **Kontrak dan aplikasi tidak nyambung:** 184 screen di kontrak, hanya **13 route yang cocok persis**; setelah dinormalkan entitas, 79. 58 form screen di kontrak, hampir tak ada yang jadi route — semuanya jadi modal.
3. **56 page adalah stub <30 baris** — sebagian besar cuma `redirect()` ke route lain.
4. **56% page (152) tidak punya satu pun form control** — read-only list/report. Overview memang selesai; input-nya tidak.
5. **1 dari 60 form modal pakai validasi schema** (`zodResolver` / `useForm` di tepat 1). 59 sisanya validasi `useState` + `if` manual, duplikasi per modal, tanpa kontrak bersama.
6. **Route layer dilewati sepenuhnya.** 275 route, tapi hanya 3 berjalur `/create` (`scm-pembelian/create` 600 baris = satu-satunya form create sungguhan), 0 `/edit`, 0 `/print`, 12 dynamic. Pola `?action=create` pada stub redirect adalah pengakuan aplikasi sendiri bahwa form hidup di modal.
7. **181 dari 275 page melanggar batas CLAUDE.md sendiri** (>150 baris; standar: <120, hard limit 150).

---

## 7. Prioritas

### P0 — Etika integritas

1. **Tutup 3 endpoint create yang melanggar DEC-016** (`inbounds`, `purchase-invoices`, `sales-invoices`) — ganti dengan `POST /purchase-orders/:id/receipt` dan sejenisnya. Ini satu-satunya akar double input; menutupnya menghapus banyak defect sekaligus.
2. **Hidupkan `executeTransition`** — 5 call site `validateTransition` sebaiknya naik ke `executeTransition`. Langsung mengisi `StateTransitionLog` + gate + event yang sudah tertulis. (Terkonfirmasi 3× oleh Batch A dan Batch F: definisi + spec, nol produksi.)
3. **Audit interceptor harus atomik dengan mutasinya** — `audit.interceptor.ts:181` memanggil `writeDirectAudit` di luar transaksi, padahal BUS-RULE-113 minta satu transaksi. Akibatnya `AuditLog` bisa kosong padahal mutasi sudah commit. Selain itu, memakai `tap()` berarti request yang gagal tidak meninggalkan jejak audit sama sekali.
4. **`DEFER` diam-diam jadi `REJECTED`** — approver yang memilih "tunda" justru menolak permanen (`decision.controller.ts:26-28`).
5. **`rationale` wajib diisi FE tapi server tidak pernah membacanya** — kolomnya juga tidak ada di tabel `Approval`. Alasan penolakan hilang (`decision.controller.ts:30-35`).
6. **Bongkar 14 blind status setter**, terutama 2 yang tanpa guard (`goods-requirement.service.ts:69`, `shipments.service.ts:100`) dan 2 tanpa `@Roles`.
7. **Tutup bypass BUS-RULE-107** di `finance-invoice.service.ts:480` — dan perbaiki juga `paymentApprovedAt` tanpa `paymentApprovedById` di `:483` (Batch A): gate dua kolom jadi setengah terpenuhi.
8. **Verifikasi webhook WhatsApp bisa dilewati** — `wa-webhook.service.ts:67` memakai `if (process.env.WA_APP_SECRET)`; env kosong berarti verifikasi dilewati, dan `:17`/`:51` punya secret hardcoded. `wa-gateway.controller.ts:14` juga `@Body() body: any` tanpa guard.
9. **`POST /sync` yang selalu sukses** — `marketing-command.controller.ts:201-209` return `{success:true}` tanpa menyentuh service atau Prisma; FE invalidate query lalu menampilkan toast sukses.

### P1

10. **Bikin kontrak nomor dulu, baru pindahkan FE.** 0 controller mengekspos `IdGeneratorService`, jadi selama ini belum ada jalur FE ke generator. Setelah endpoint ada, hapus 43 penomoran browser; **`CUST-${length+1}` di `useCustomerOperations.ts:322`, `GDG-0${length+1}` di `useWarehouseOperations.ts`, dan `SCH-*` di 3 jadwal produksi lebih dulu** — semuanya berbasis panjang array, jadi nomor yang sama dipakai ulang begitu satu baris terhapus.
11. **Muat baris item di halaman approval** — 0 dari 11. Approver tidak bisa memutuskan tanpa melihat isinya.
12. Guard status di 21 action component yang unconditional.
13. Pasang `@Roles` di 31 endpoint yang sekarang JWT tanpa cek role (`communication`, `entity-communication`, `wa-self-qr`).
14. Hentikan `GET ?action=pick` dari menulis `RoundRobinState` (`landing-tracker.service.ts:110`) — endpoint read yang menulis, tanpa guard, di 8 endpoint controller itu.
15. Sambungkan `pdf-engine.service.ts` ke 4 template yang hilang (Faktur Pembelian, Journal voucher, Surat Terima Barang, label produksi). Engine-nya sudah ada; ini kerja wiring, bukan kerja cetak.

### P2

16. Sinkronkan ROUTE_MAP (216 page undocumented) + hapus 14 page yang hilang dari working tree.
17. Pecah 181 page yang >150 baris.
18. 56 stub page — hapus atau isi.
19. Tentukan status delete untuk 6 dokumen inti yang punya kolom `deletedAt` tapi tidak pernah ditulis (`SalesOrder`, `Invoice`, `Payment`, `ProductionPlan`, `WorkOrder`, `PurchaseOrder`) — lihat `CRUD-MATRIX-DELETE-VERIFIED.md`. Sekarang tidak bisa dihapus, dan tidak ada satu pun tempat di kode yang menyatakan itu memang disengaja.
