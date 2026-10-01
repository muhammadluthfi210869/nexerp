# CRUD Maturity Audit — Batch B (Warehouse / SCM / Production / Fulfillment / Logistics)

Audit date: 2026-10-01 · Branch `feat/p08-contracts-subject-ownership`
Scope: `backend/src/modules/{warehouse,scm,production,production-planning,fulfillment,floor-execution,logistics}/**`,
`backend/prisma/schema/{warehouse,scm,production}.prisma`, dan page FE di bawah
`app/(dashboard)/` untuk purchase/warehouse/inventory/production/work-order/delivery/shipment.

Census yang dijalankan (bukan estimasi):
- 81 file `.ts` backend (non-spec, non-module) di 7 modul scope.
- 16 controller, **172 route** di scope; **59 tanpa `@Roles`**.
- 995 route seluruh backend (termasuk alias array `@Controller([...])`) vs **1008 call `api.*`** di FE.
- 1537 file `frontend/src`.
- Prisma: 24 model di 3 file schema.

> Catatan metode: dua hitungan awal saya salah dan saya perbaiki sebelum dipakai.
> (a) Pemindai dekorator pertama membaca `@Roles` ke arah atas, padahal dekoratornya
> di bawah `@Get` → sempat melaporkan 172 route "tanpa @Roles"; yang benar **59**.
> (b) Pencocokan FE↔BE pertama reading `@Controller` pertama per file dan mengabaikan
> alias array → sempat melaporkan 44 endpoint hilang; yang benar **4** (3 di scope).
> Angka di dokumen ini adalah hasil hitung ulang, bukan hasil pass pertama.

---

## 1. Ringkasan per entitas

Verdict: **WORKS** (lengkap end-to-end) · **PARTIAL** (ada, tapi cacat) · **MISSING** (tidak ada) · **UNVERIFIED**.

| # | Entitas | C | R | U | D |
|---|---------|---|---|---|---|
| 1 | PurchaseOrder | WORKS — DTO penuh + gate vendor blacklist, `idGenerator` | PARTIAL — filter status/search ada, tanpa pagination | PARTIAL — `PATCH :id/status` buta, tanpa validasi transisi | MISSING — tak ada endpoint |
| 2 | PurchaseOrderItem | WORKS — nested create, total dihitung server | WORKS — ikut `include` di `findOne` | MISSING — tak ada endpoint | MISSING — tak ada endpoint |
| 3 | GoodsReceipt (WarehouseInbound) | **PARTIAL (P0)** — endpoint stand-alone, precondition PO APPROVED tak dicek | WORKS — `include` items+po+material | PARTIAL — status transition hanya blur "sudah approved" | PARTIAL — `reject` → CANCELLED, tanpa undo |
| 4 | InboundItem | WORKS — nested create, `isQuarantine` default | WORKS — ikut di `findAll`/`findOne` | PARTIAL — hanya lewat `qc-validate` | MISSING |
| 5 | PurchaseInvoice (Bill) | **PARTIAL (P0)** — endpoint stand-alone, parent opsional | WORKS — status+search | MISSING — tak ada `PATCH` | MISSING |
| 6 | GoodsRequirement | WORKS — `CreateGoodsRequirementDto` | PARTIAL — tanpa filter/pagination | **PARTIAL** — `findUnique` lalu tulis `status` telanjang | MISSING |
| 7 | MaterialItem (master) | WORKS — DTO + validasi | PARTIAL — `findAll()` polos | WORKS — `PUT :id` (whole object) | WORKS — soft delete `deletedAt` |
| 8 | PurchaseRequest | WORKS — DTO | PARTIAL — filter+search, tanpa pagination | WORKS — approve/reject terpisah | MISSING |
| 9 | PurchaseReturn | WORKS — DTO | PARTIAL — `findAll()` polos | PARTIAL — side-effect stock saat COMPLETED | MISSING |
| 10 | PurchasePayment | WORKS — `idGenerator` | PARTIAL — filter vendor/search | WORKS — `reverse` menulis audit | MISSING |
| 11 | Shipment | PARTIAL — `soId` opsional di DTO, service memaksa ada | WORKS — include so+items | PARTIAL — `PATCH :id/status` tanpa cek transisi | MISSING |
| 12 | ShipmentItem | MISSING — `CreateShipmentDto` tak punya `items[]` | WORKS — ikut include | MISSING | MISSING |
| 13 | DeliveryOrder (logistics) | WORKS — `deliver/:workOrderId` | WORKS — `getDeliverableOrders` | MISSING | MISSING |
| 14 | MaterialInventory (batch stock) | PARTIAL — update via event, bukan endpoint CRUD | PARTIAL — `qcValidate` cari `findFirst` tanpa filter gudang | MISSING | MISSING |
| 15 | InventoryTransaction (ledger) | **PARTIAL (P0)** — `stockQty` di-`increment` langsung, ledger tak pernah ditulis di path ini | WORKS — `GET /warehouse/transactions` | MISSING | MISSING |
| 16 | StockOpname | PARTIAL — `@Body() data: any` | WORKS | PARTIAL — approve + approve-pin, tak ada reject | MISSING |
| 17 | TransferOrder | PARTIAL — `@Body() data: any` | WORKS | WORKS — execute | MISSING |
| 18 | StockAdjustment | PARTIAL — `@Body() data: any` | WORKS | WORKS — approve/reject | MISSING |
| 19 | MaterialRequisition | WORKS — DTO | WORKS — ada `GET /aggregated` | WORKS — `PATCH :id/issue` | MISSING |
| 20 | ProductionPlan | WORKS — DTO + `idGenerator` | PARTIAL — `findAll()` polos | **PARTIAL** — `PATCH :id/status` buta; efek `DONE` memicu yield lagi | MISSING |
| 21 | WorkOrder | **PARTIAL** — `@Body() dto: any`, tanpa DTO | WORKS | MISSING — tak ada `PATCH` | MISSING |
| 22 | ProductionSchedule | **PARTIAL** — `@Body() dto: any` | PARTIAL — filter `stage` saja | **PARTIAL** — `PATCH :id/status` ada tapi tanpa `@Roles` | MISSING |
| 23 | BatchRecord (bridge) | WORKS — endpoint ada, isi `soId` | WORKS | WORKS — `PATCH :id` | **WORKS** — hard delete, satu-satunya |
| 24 | ProductionStepLog | WORKS — DTO | WORKS | MISSING | MISSING |

**Ringkasan angka** (dihitung ulang dari tabel di atas, bukan dihitung manual; tiap kolom berjumlah 24):
C: **13** WORKS / 10 PARTIAL / 1 MISSING / 0 UNVERIFIED · R: **15** WORKS / 9 PARTIAL / 0 MISSING / 0 UNVERIFIED ·
U: **7** WORKS / 9 PARTIAL / 8 MISSING / 0 UNVERIFIED · D: **2** WORKS / 1 PARTIAL / 21 MISSING / 0 UNVERIFIED.

Kolom D yang kosong adalah inti audit ini: dari 24 entitas, hanya 2 punya delete yang benar-benar terminating —
`MaterialItem` (soft delete) dan `BatchRecord` (hard delete tanpa audit). Sisanya tidak punya endpoint delete sama sekali.

---

## 2. Temuan, dari yang palingseverity

### P0-1 · GoodsReceipt punya endpoint create stand-alone, melanggar DEC-016
`backend/src/modules/scm/controllers/inbounds.controller.ts:22` — `@Post()` dengan `@Roles`, jadi **RBAC ada**; yang hilang adalah *precondition bisnis*. `@Controller(['purchase/goods-receipts','scm/inbounds'])` (`:18`) membuka dua path, keduanya create.
Kontrak `docs/legacy-erp/contracts/02_DATA_OWNERSHIP.yaml:30-32` melarangnya: *"CHILD entities (per DEC-016: GoodsReceipt, PurchaseInvoice, SalesInvoice) have NO standalone create endpoint"*, dan `02_DATA_OWNERSHIP.yaml:1086-1094` mensyaratkan `condition: po.status == APPROVED AND user.action == 'create_gr'`.
Bukti kondisi itu tidak dijalankan: di `backend/src/modules/scm/services/inbounds.service.ts:21-79` (`create`), `POStatus` di-*import* (`:9`) tapi **tidak pernah dipakai** — pemindaian `POStatus\.(APPROVED|ORDERED|SENT)` atas 7 modul scope mengembalikan **0 file**. GR bisa dibuat terhadap PO berstatus `ORDERED` maupun `REJECTED`.
Sisi FE justru lebih buruk: tidak ada affordance "Buat GR" di halaman `pembelian/purchasing/` (pencarian `Buat GR|Create GR|Terima Barang` → nihil). GR dibuat dari 3 halaman terpisah: `pembelian/receiving/_components/ReceivingCreateCanvas.tsx:185`, `pembelian/receiving/_hooks/useReceivingOperations.ts:88`, `warehouse/inbound/_hooks/useInboundOperations.ts:406`.

### P0-2 · PurchaseInvoice bisa dibuat tanpa parent sama sekali
`backend/src/modules/scm/controllers/purchase-invoices.controller.ts:30` — `@Post()` + `@Roles` (RBAC ada), tapi `CreatePurchaseInvoiceDto` membuat **ketiga parent opsional**: `inboundId?` (`backend/src/modules/scm/dto/purchase-invoice.dto.ts:59-62`), `grId?` (`:64-67`), `poId?` (`:74-77`), `vendorId?` (`:79-82`).
Di `backend/src/modules/scm/services/purchase-invoices.service.ts:38-60`, `po` dan `inbound` tetap `null` bila tak ada parent; gate 4-leg (`:149`) di-skip seluruhnya karena `if (po && po.items)`. Jadi invoice dapat terbit tanpa GR maupun PO — persis skenario yang DEC-016 (`02_DATA_OWNERSHIP.yaml:462-473`) dan aturan `GR_COMPLETED_TRIGGERS_PURCHASE_INVOICE` (`:1096-1104`)_closed_ untuk mencegah.
FE mengirim `inboundId` **dan** `poId` bersamaan (`pembelian/faktur-pembelian/_hooks/useFakturPembelianOperations.ts:195-203`) — redudan parent context; server mengabaikan `poId` bila `inboundId` ada (`:38-48`).

### P0-3 · 4 dari 10 file yang mengubah stok tidak menulis ledger `InventoryTransaction`
`MaterialItem.stockQty` dideklarasikan `@note This field is a CACHE. Truth is derived from InventoryTransaction.` — `backend/prisma/schema/warehouse.prisma:58-59`. Jadi kebenaran stok seharusnya datang dari ledger.
Census 81 file scope: **10 file** menulis `stockQty: { increment|decrement }`, hanya **6** yang juga menulis `inventoryTransaction.create`. Empat file mengubah cache tanpa jejak ledger sama sekali:
- `backend/src/modules/scm/services/inbounds.service.ts:103` — `stockQty: { increment: qtyGood }` saat GR di-approve
- `backend/src/modules/scm/services/purchase-returns.service.ts:130` — `stockQty: { decrement: Number(item.quantity) }`
- `backend/src/modules/production-planning/services/production-plans.service.ts:192` — `stockQty: { decrement: req.qtyRequested }`
- `backend/src/modules/production-planning/services/requisitions.service.ts:48` — `stockQty: { decrement: requestedIssue }`

Yang benar (6 file) proving the pattern is known and copyable: `warehouse/services/warehouse-inbound.service.ts:114`+`:98`, `warehouse-opname.service.ts:117`+`:120`, `warehouse-release.service.ts` (5 pasangan), `warehouse-transfer.service.ts:228`+`:183`, `production-work-order.service.ts:126`+`:130`, `stock-ledger.service.ts:70`+`:39`.

Yang membuat ini P0 dan bukan P1: jalur FE yang paling banyak dipakai justru yang salah. Dua dari tiga titik pembuatan GR mengirim ke `/scm/inbounds` (`pembelian/receiving/_components/ReceivingCreateCanvas.tsx:185`, `pembelian/receiving/_hooks/useReceivingOperations.ts:88`) — path tanpa ledger — sedangkan hanya satu yang ke `/warehouse/inbounds` (`warehouse/inbound/_hooks/useInboundOperations.ts:406`), path yang menulis ledger. Melawan `GOODS_RECEIPT_TRIGGERS_STOCK_MOVEMENT` (`02_DATA_OWNERSHIP.yaml:1119-1127`) dan `02_DATA_OWNERSHIP.yaml:600-607` (*"Auto-generated from GoodsReceipt … NO manual UI entry"*).

**Inferensi (belum diuji runtime):** tanpa ledger, `MaterialInventory` per batch (`warehouse.prisma:386-413`) tidak punya sumber untuk rekonsiliasi, jadi divergensi `MaterialItem.stockQty` vs `sum(MaterialInventory.currentStock)` tidak akan pernah terdeteksi oleh data — hanya oleh pemeriksaan manual.

### P0-4 · FE memanggil 2 endpoint yang tidak ada di server
- `PATCH /purchase/invoices/${id}/reason` — `frontend/src/app/(dashboard)/pembelian/faktur-pembelian/_hooks/useFakturPembelianOperations.ts:252`. Controller `purchase-invoices.controller.ts` hanya punya 4 route (`POST /`, `POST import`, `GET /`, `GET :id`); pencarian `:id/reason` di seluruh `backend/src` → **0 hasil**. Aksi "alasan belum lunas" di UI pasti 404.
- `POST /production/requisitions` — `frontend/src/app/(dashboard)/production/material-requisition/_hooks/useProductionMaterialRequisitionOperations.ts:287`. Route yang ada: `GET requisitions` (`production.controller.ts:128`), `POST requisitions/:id/issue` (`:133`), `POST requisitions/:id/shortage` (`:138`). Tidak ada `POST requisitions` di `@Controller('production')`. Endpoint create yang ada berada di controller lain: `production-planning/controllers/requisitions.controller.ts:25` → `/material-requisitions`. Form requisisi produksi tidak punya backend.

### P0-5 · 59 dari 172 route scope tanpa `@Roles`; 53 di antaranya di `production.controller.ts`
`backend/src/modules/production/production.controller.ts` — hanya **3 dari 56** route punya `@Roles` (`:172`, `:316`, `:340`). Sisanya 53 route terbuka ke setiap user yang lolos `JwtAuthGuard`, termasuk yang mengubah state:
- `POST work-orders` (`:52`), `POST work-orders/from-so` (`:57`)
- `POST :workOrderId/submit-log` (`:89`) — controller ini bernama `@Controller('production')` sehingga path-nya `/production/:workOrderId/submit-log`
- `PATCH schedules/:id/status` (`:211`) dan `PATCH batch-records/:id` (`:331`)
- `POST qc/verify` (`:360`), `POST reconciliation/return` (`:365`), `POST finalize/:woNumber` (`:370`)
Klasifikasi role-level: `02_DATA_OWNERSHIP.yaml:506-509` menetapkan `BatchRecord.authoritative_writer.primary_role: ProductionAdmin`; 53 route tanpa `@Roles` membiarkan role apa pun menulis ke sana.
`backend/src/modules/logistics/logistics.controller.ts:10` justru **benar** — `@Roles` di level class.

### P1-6 · 20 `@Body()` tanpa DTO class — validasi nol
19 controller menerima body `any` atau literal inline. Representative (semua terverifikasi baris):
- `production/production.controller.ts:53` `createWO(@Body() dto: any)`, `:58` `createWOFromSO(@Body() dto: any)`, `:198/231/247/263` schedule create, `:317` `createBatchRecord(@Body() dto: any)`, `:361` `verifyQC`, `:366` `returnMaterial`
- `warehouse/warehouse.controller.ts:105` `validateHandover(@Body() data: any)`, `:151` `createTransfer`, `:192` `createOpname`, `:229` `createInbound`, `:245` `createAdjustment`
- `scm/controllers/scm.controller.ts:91` `createPurchaseRequest(@Body() body: any)`, `:114` `createHppRequest(@Body() dto: any)`
- `scm/controllers/purchase-requests.controller.ts:132` `@Body() body: {` (inline)

Yang dilaporkan awal sebagai `purchase-orders.controller.ts:38` **tidak akurat**: baris itu `@Post('from-requirement')`, dan body-nya `@Body() dto: { materialId: string; supplierId: string; qty: number; unitPrice: number }` (`:45`) memang inline — jadi temuan ini **benar** tapi nominal barisnya meleset ~7 baris. DTO yang sebenarnya sudah ada dan **tidak dipakai**: `backend/src/modules/scm/dto/create-po-from-requirement.dto.ts:10` `CreatePOFromRequirementDto` (lengkap dengan `@IsUUID`/`@Type(() => Number)`). DTO ada, controller menyalin strukturnya sendiri.

### P1-7 · 95 drawer/modal detail, 93 tidak fetch data sendiri
Grep `useQuery|api\.(get|post|patch|put)|axios\.|fetch\(` di dalam file bernama `*Drawer*.tsx`/`*Detail*.tsx`/`*Modal*.tsx` di seluruh `frontend/src`: **95 file, 2 dengan fetch, 93 props-only**.
Konsekuensi: detail mewarisi field milik list query. Contoh yang jelas — `frontend/src/app/(dashboard)/warehouse/inbound/_components/InboundDetailDrawer.tsx:89` menyusun label `code: \`${selectedGrn.vendorName} (${selectedGrn.vendorCode})\`` dari record list; `purchase/invoices` FE memetakan `b.purchaseOrder?.poNumber || b.poNumber || b.poId` dengan tiga fallback (`useFakturPembelianOperations.ts:33`) — tanda endpoint list tidak konsisten mengembalikan relasi.
Semua list scope memanggil `GET` tanpa `?id=`, jadi tidak ada jalur detail-per-record.

### P1-8 · 4 `PATCH :id/status` terbukti setter buta
Pola `findUnique` → `update({ data: { status } })` tanpa cek transisi:
- `backend/src/modules/scm/services/goods-requirement.service.ts:69-78` — `updateStatus` persis seperti yang dilaporkan: `findUnique({where:{id}})` lalu `update` dengan `{ status: dto.status }`. Tidak ada peta transisi.
- `backend/src/modules/scm/services/purchase-orders.service.ts:308-323` — `updateStatus(id, status: string, ...)`, `status as any` (`:317`): string bebas, tanpa enum. reachable dari `purchase-orders.controller.ts:104` dan `:94` (reject) dan `:78` (approve).
- `backend/src/modules/fulfillment/services/shipments.service.ts:100-128` — cek hanya `!shipment`; dari `PACKING` bisa langsung lompat ke `DELIVERED` dan memicu SO→`COMPLETED` (`:119-123`).
- `backend/src/modules/production-planning/services/production-plans.service.ts:106-117` — `update({ data: { status: dto.status } })` polos; efek `DONE` (upsert `FinishedGood`, `:131-138`) dipicu ulang tiap kali status ditulis `DONE` — `upsert` menulis ulang `update: { stockQty: totalYield }`, jadi idempoten hanya jika `logs` tidak berubah.
Yang **benar**: `backend/src/modules/warehouse/services/requisition.service.ts:78-90` punya `allowedTransitions` PENDING→[APPROVED,REJECTED]→[FULFILLED] dan menolak lain. Ini satu-satunya dari 7 yang punya peta transisi. Catatan: `UpdateGoodsRequirementStatusDto` tetap `status: string` (bukan enum) sehingga peta transisi di level service adalah lapisan kedua.

### P1-9 · Optimistic concurrency nol, padahal `version` sudah ada di schema
`backend/prisma/schema/warehouse.prisma:219` — `PurchaseOrder.version Int @default(1)`.
Pemindaian `If-Match|version\s*:|updateMany\s*\(` di 81 file scope: **0 OptimizeConcurrency, 0 If-Match, 0 `updateMany({where:{version}})`**. Satu-satunya `updateMany` adalah agregat counter (`warehouse/services/warehouse-inbound.service.ts:344`).
Artinya lost-update real: dua kasir menyetujui PO bersamaan, menimpa `status`. `version` tidak pernah di-increment juga, jadi kolomnya dekoratif.

### P1-10 · Hampir semua list tanpa pagination: 2 dari 58
`findAll`-family di service scope: 58 method, **2 dengan** `skip`/`take`/`page`, **56 tanpa** (semua `orderBy` penuh-scan). Contoh dalam scope: `scm/services/inbounds.service.ts:164`, `scm/services/goods-requirement.service.ts:55`, `scm/services/materials.service.ts:10`, `scm/services/purchase-returns.service.ts:176`, `fulfillment/services/shipments.service.ts:130`, `production-planning/services/production-plans.service.ts:89`, `production-planning/services/requisitions.service.ts:106`, `warehouse/services/requisition.service.ts:46`.
Yang punya filter: `purchase-orders.service.ts:215` (`status`/`search`), `purchase-requests.service.ts:105` (`status`/`search`).
Filter `PurchaseInvoice` dideklarasikan `@Query('status') status?: any` (`purchase-invoices.controller.ts:49`) — tipe `any`, tanpa enum, tanpa pagination.

### P1-11 · FE mengirim uuid all-zeros sebagai materialId fallback
`frontend/src/app/(dashboard)/warehouse/inbound/_hooks/useInboundOperations.ts:399` — `materialId: mat?.id || it.id || "00000000-0000-0000-0000-000000000000"`. Kalau lookup katalog gagal, item terkirim dengan FK yang pasti tidak ada. Karena `warehouse.controller.ts:229` `createInbound(@Body() data: any)` tanpa DTO, tidak ada validasi yang menangkapnya sebelum `warehouseInboundItem.create`.

### P1-12 · Validasi frontend nyaris tidak ada: 3 dari 1537 file import zod
`zod`: **3** file. `react-hook-form`: **4** file. `useState`: **412** file. Sisanya form frontend memakai `useState` + `if` ad-hoc. Konsekuensi langsung terlihat di `useInboundOperations.ts:388-390` — validasi manual `"Minimal harus ada 1 item material yang diterima."` ditulis tangan, sementara DTO server punya `@IsArray() @ValidateNested()` (`scm/dto/inbound.dto.ts:68-71`) yang tak pernah sepadan karena body-nya `any`.

### P1-13 · BatchNumber client-minted di 3 jalur inbound
`frontend/src/app/(dashboard)/warehouse/inbound/_hooks/useInboundOperations.ts:350`, `:368`, `:401` — `` `LOT-${Date.now().toString().slice(-4)}` ``. hanya 4 digit terakhir dari epoch ms: **dua batch pada detik yang sama bertabrakan**, dan `MaterialInventory.batchNumber` (`warehouse.prisma:390`) tidak punya `@unique` sehingga bentrok lolos ke DB. Bandingkan `InboundItem.qcStatus @default(QUARANTINE)` (`warehouse.prisma:336`) — default server ada tapi dikosongkan client.
Catatan: nomor dokumen *resmi* (GRN, PO, FP, REQ) tidak di-mint client — 14 service memanggil `idGenerator.generateId`. Yang client-mint adalah batch/tracking; lihat P2-14.

### P2-14 · Number-minting census (repo-wide, bukan 7 seperti dilaporkan)
Angka yang dilaporkan sebelumnya ("7 situs") salah: hitung ulang saya **23** (`Date.now()`/`Math.random()` pada baris bernomor), **51** template literal dokumen, **19** sekuens `.length + 1`. Ketiga himpunan beririsan; setelah de-duplikasi per lokasi unik, **44 lokasi client-mint**. Yang benar-benar mengirim angka ke server ada di 8:
`inventory/outbound/_hooks/useOutboundOperations.ts:87` `DO-${...Date.now().slice(-4)}` · `production/work-orders/_hooks/useWorkOrdersOperations.ts:165-166` `SPK-2026-${workOrders.length + 45}` + `BATCH-...${Date.now()}` · `warehouse/pindah-gudang/_hooks/usePindahGudangOperations.ts:388` `TRF-2026-${Math.floor(1000 + Math.random()*9000)}` (4 digit acak, birthday-paradox) · `warehouse/release/_hooks/useReleaseOperations.ts:351` `SJ-202609-${Math.floor(1000+Math.random()*9000)}` · `penjualan/delivery-orders/page.tsx:146` `DO-2026-${Date.now().slice(-4)}` · `pembelian/bayar-pembelian/_components/BayarPembelianCanvas.tsx:137` `REF-${Date.now().slice(-6)}` · `pembelian/purchase-requests/_hooks/usePurchaseRequestsOperations.ts:155` `materialCode: "RAW-MAT-00" + (cartItems.length + 1)` · `production/schedule-mixing/_hooks/useScheduleMixingOperations.ts:65` / `schedule-filling:65` / `schedule-packaging:65` `SCH-*-2026-${schedules.length + 1}`.
`workOrders.length + 45` (`:165`) khusus rapuh: nomor SPK bergantung pada panjang array respons, jadi nomor yang sama muncul lagi setelah hapus.

### P2-15 · `ShipmentItem` tidak pernah tercipta dari API
`Shipment` punya relasi `items ShipmentItem[]` (`production.prisma:256`) dan service `findAll` me-`include` items (`fulfillment/services/shipments.service.ts:140-144`), tapi `CreateShipmentDto` (`fulfillment/dto/shipment.dto.ts:9-26`) **tidak punya `items[]`**, dan `ShipmentsService.create` (`:56-65`) tidak pernah menulis `items`. Konsekuensinya: `ShipmentItem` hanya bisa diisi lewat path lain (di luar batch ini), dan list shipment mengambil `items` yang praktis kosong.

### P2-16 · `MaterialInventory` ditulis tanpa filter gudang
`backend/src/modules/scm/services/inbounds.service.ts:196-205` — `qcValidate` mencari `tx.materialInventory.findFirst({ where: { materialId }, orderBy: { lastRestock: 'desc' } })` **tanpa `warehouseId`**. Untuk material yang ada di >1 gudang, entri QC ditulis ke batch milik gudang lain. `MaterialInventory` punya `@@index([materialId])` dan `@@index([locationId])` (`warehouse.prisma:408-409`) tapi tidak ada composite uniqueness per (material, warehouse, batch).

### P2-17 · Entitas tanpa UI, dan halaman tanpa service
**Tanpa UI surface (backend ada, tak ada halaman)** — diverifikasi lewat silang `api path` yang dipakai FE: `InboundItem.qc-validate` (`inbounds.controller.ts:46`) dipanggil 0 kali dari FE; `POST /scm/inbounds/:id/reject` (`:55`) 0 kali; `POST /scm/inbounds/:id/post` (`:28`) 0 kali; `floor-execution` `GET production/step-logs/wo/:woId` (`step-logs.controller.ts:24`) 0 kali; `POST /material-requisitions/:id/issue` (`requisitions.controller.ts:31`) 0 kali; `POST /production-plans/:id/issue-materials` (`production-plans.controller.ts:39`) 0 kali; `GET /scm/goods-requirements/summary` (`:28`) 0 kali; `WarehouseInbound`-level `POST /warehouse/inbounds` (`warehouse.controller.ts:225`) 1×.
**Halaman tanpa backing service** — `frontend/src/app/(dashboard)/warehouse/transfers/page.tsx` (9 baris, redirect) dan `app/(dashboard)/scm/pembelian/create` (8 baris, redirect); keduanya wrapper, bukan defect.
**Tidak ada mock/hardcoded array** di halaman scope: pola `const *mock*|*dummy*|*sample*|*hardcoded*|*fake*|*demo*` dan `= [{ id:` → **0 temuan** di 351 file FE scope. Tidak ada halaman yang merender data yang tidak dihasilkan service.

### P2-18 · `qcValidate` & `reject` menerima `@Body()` inline, bukan DTO
`backend/src/modules/scm/controllers/inbounds.controller.ts:50` `@Body() dto: { items: { inboundItemId: string; qcStatus: string }[] }` dan `:57` `@Body() dto: { reason: string }` — keduanya tanpa `@IsArray/@IsEnum/@IsNotEmpty`, jadi `qcStatus` string bebas masuk ke enum `QCStatus` (`warehouse.prisma:336`).

### P2-19 · `BatchRecord` hard delete tanpa audit & tanpa confirm
`backend/src/modules/production/production-batch-record.service.ts:243-255` — satu-satunya `.delete({...})` di seluruh 81 file scope. Caller `production.controller.ts:340` menerima `@Request() req` tetapi **tidak** menulis `auditLog` sebelum menghapus. Melawan `02_DATA_OWNERSHIP.yaml:27` (*"Soft-delete + audit on all writes"*) dan `:512` (`deletable_by: [ProductionAdmin, SuperAdmin]` — endpoint ini tanpa `@Roles`, lihat P0-5). `ProductionPlan` punya `deletedAt` (`production.prisma:17`) yang tidak dipakai, dan `so` punya `onDelete: Cascade` (`production.prisma:19`) sehingga ikut hilang.
Hanya soft delete yang ada: `scm/services/materials.service.ts:82` `deletedAt: new Date()`. Persis seperti peringatan di brief — `update({isActive:false})` tidak muncul di census delete: satu-satunya adalah `production/production-execution.service.ts:202` `isActive: false` (untuk `Machine`, `production.prisma:134`).

### P2-20 · `Shipment.updateStatus` tidak mengirim `evidenceUrl`
`production.prisma:254` punya `evidenceUrl String?`; `shipments.service.ts:108-116` hanya menulis `status`/`deliveredAt`/`shippedAt`. Tidak ada endpoint untuk bukti pengiriman.

---

## 3. Yang TIDAK bisa diverifikasi

1. **Perilaku runtime.** Semua temuan berasal dari pembacaan kode. Tidak ada test yang dijalankan, tidak ada request ke API, tidak ada DB. Klaim "GR bisa dibuat terhadap PO REJECTED" (P0-1) adalah pembacaan jalur kode — `POStatus` memang tidak dipakai di `inbounds.service.ts`, tetapi mungkin dicek di guard lain yang tidak saya lihat. Perlu konfirmasi dengan `POST /scm/inbounds` terhadap PO `REJECTED`.
2. **Apakah 4-leg match benar-benar di-skip tanpa parent.** P0-2VIDA dari `if (po && po.items)` (`purchase-invoices.service.ts:149`); belum diuji apakah `tx.bill.create` menolak `poId: null` di level Prisma. `Invoice` tidak termasuk 3 file schema scope, jadi FK-nya tidak saya periksa.
3. ~~Apakah ada event listener yang menutup celah ledger pada P0-3.~~ **Sudah terjawab** — census seluruh 81 file scope: `inventoryTransaction.create` hanya muncul di 6 file, dan `inbounds.service.ts` bukan salah satunya. Tidak ada listener di dalam scope yang menutup celah ini. Yang belum saya periksa: listener di luar 7 modul scope, dan apakah `inbounds.service.ts` meng-*emit* event yang ditelan modul lain.
4. **Apanya `GET /master/suppliers${searchQuery...}` yang unmatched.** FE memanggil `/master/suppliers` (`master/suppliers/page.tsx:120`) yang **ada** di backend; ketidakcocokan datang dari template literal yang memuat `?search=`, bukan dari route hilang. Dihapus dari daftar temuan.
5. **`GET /bussdev/leads/group/production`** (`penjualan/client-manager/page.tsx:356`) — di luar scope batch ini (modul `bussdev`), tidak saya lacak.
6. **Mutual consistency nomor yang sudah terbit.** Apakah `LOT-`/`SCH-*`/`SPK-` yang sudah ada di DB sekarang pernah bertabrakan, perlu kueri DB.
7. **Konsumen di luar `frontend/src`** (mobile, report, integrasi) yang mungkin bergantung pada route yang di-PATCH/POST bergaya buta — tidak dalam scope.
