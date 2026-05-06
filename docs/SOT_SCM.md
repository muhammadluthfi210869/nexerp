# SOURCE OF TRUTH (SoT): SUPPLY CHAIN MANAGEMENT (SCM)
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: The Resource Engine — Procurement, Inventory Guardian, and Logistics Backbone.

---

## 1. BUSINESS PROCESS FLOW (THE MATERIAL CYCLE)

| Phase | System Status | Key Action / Event | Mandatory Output |
|:---|:---|:---|:---|
| **P-1: Requirement** | `REQUESTED` | Sistem auto-create PR dari BOM shortage (G2 trigger) | `PurchaseRequest` (PR) |
| **P-2: Procurement** | `ORDERED` | Pilih supplier, negosiasi harga, buat PO | `PurchaseOrder` (PO) |
| **P-3: Receiving** | `RECEIVED` | Barang datang → Warehouse inbound | `WarehouseInbound` (GRN) |
| **P-4: QC Inspection** | `QUARANTINE` | QC Inbound → GOOD / REJECT | `QCAudit.status` |
| **P-5: Allocation** | `AVAILABLE` | Stok siap pakai untuk produksi | `MaterialInventory.qcStatus = GOOD` |
| **P-6: Fulfillment** | `SHIPPED` | Barang dikirim ke klien | `Shipment` / `DeliveryOrder` |

---

## 2. BACKEND API ENDPOINTS

### 2.1. Purchase Orders (`/scm/purchase-orders`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/scm/purchase-orders` | `findAll()` | List all POs with supplier, inbounds, SCM info |
| GET | `/scm/purchase-orders/:id` | `findOne()` | Single PO detail |
| POST | `/scm/purchase-orders` | `create()` | Create PO |
| POST | `/scm/purchase-orders/:id/down-payment` | `completeDownPayment()` | Record PO down payment |

### 2.2. Materials (`/scm/materials`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/scm/materials` | `findAll()` | All materials with category, accounts |
| GET | `/scm/materials/:id` | `findOne()` | Single material with inventories (batches) |
| POST | `/scm/materials` | `create()` | Create material |
| PUT | `/scm/materials/:id` | `update()` | Update material |
| DELETE | `/scm/materials/:id` | `remove()` | Soft-delete material |

### 2.3. Inbounds / QC (`/scm/inbounds`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/scm/inbounds/:id/qc-validate` | `qcValidate()` | Validate inbound QC (event: `scm.inbound.qc_validated`) |

### 2.4. Route Aliases (`/master/*`) — via RouteAliasController

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/materials` | Alias to material list for frontend compatibility |
| GET | `/master/warehouses` | Alias to warehouse list |
| POST | `/master/materials` | Create material via master route |
| PATCH | `/master/materials/:id` | Update material via master route |
| DELETE | `/master/materials/:id` | Delete material via master route |

---

## 3. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger | Payload |
|------------|------------|---------|---------|
| `scm.inbound.qc_validated` | InboundsService.qcValidate() | Inbound QC validated | `{ inboundId, qcStatus }` |
| `activity.logged` | InboundsService.qcValidate() | Generic audit trail | `{ senderDivision: 'SCM', notes, loggedBy }` |

> **Note**: SCM module currently has minimal event emissions. Future phases should add:
> - `scm.po.created` — when PurchaseOrder created
> - `scm.po.updated` — when PO status changes
> - `scm.material.shortage` — when material hits reorder point

---

## 4. PRISMA MODELS

### 4.1. MaterialItem (materials)
| Field | Type | Notes |
|-------|------|-------|
| `id`, `name`, `code`, `type` | String / MaterialType enum | RAW_MATERIAL, PACKAGING, LABEL, BOX |
| `unit`, `unitPrice` | String, Decimal | |
| `minLevel`, `maxLevel`, `reorderPoint` | Decimal | Stock thresholds |
| `stockQty` | Decimal | CACHE — truth dari InventoryTransaction |
| `outMethod` | OutboundMethod | FIFO / FEFO |
| `inciName`, `halalCertNo` | String? | For INCI + halal validation |
| `inventoryAccountId`, `salesAccountId` | UUID? | Finance COA links |

### 4.2. Supplier
| Field | Type | Notes |
|-------|------|-------|
| `id`, `name`, `contact`, `paymentTerms` | String | |
| `isBlacklisted` | Boolean | |
| `performanceScore` | Decimal? | Auto-calculated |

### 4.3. PurchaseRequest + PurchaseRequestItem
- PR with items, linked to `Warehouse` and `Supplier`

### 4.4. PurchaseOrder + PurchaseOrderItem
- PO with `POStatus` enum (ORDERED / SHIPPED / RECEIVED / CANCELLED)
- Links to `Supplier`, `WarehouseInbound[]`, `Invoice[]`, `JournalEntry[]`

### 4.5. WarehouseInbound + InboundItem
- GRN record with `InboundStatus` (PENDING / APPROVED / CANCELLED)
- Items default `isQuarantine: true`

---

## 5. OPERATIONAL PROTOCOLS

### [GATE 1] — Fulfillment Gate (No Pay, No Ship)
- Warehouse dilarang DO jika SO belum `VERIFIED_PAID` (G3)

### [GATE 2] — Stock Reservation Gate (Production Protection)
- Material sudah dialokasikan ke WO tidak boleh dipakai pesanan lain

### [GATE 3] — Procurement Audit Gate
- PO harus merujuk PR atau WO yang valid

### [GATE 4] — Material Readiness Gate (NEW)
- `releaseMaterial()` di warehouse memanggil `scmService.checkMaterialReadiness()`:
  - Mengecek `MaterialRequisition.status` untuk setiap material di BOM
  - Blokir jika ada `SHORTAGE` atau bahan belum punya `APPROVED_SAMPLE`
  - Gate ini mencegah produksi dimulai tanpa bahan baku siap

---

## 6. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **R&D**: `BillOfMaterials` (BOM) — untuk tahu apa yang harus dibeli
2. **BD**: `SalesOrder` (LOCKED_ACTIVE) — untuk tahu apa yang harus dikirim
3. **PRODUCTION**: `MaterialRequisition` — kebutuhan stok lantai produksi
4. **FINANCE**: Payment verification — PO mana yang bisa diproses

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **PRODUCTION**: Material readiness — untuk mulai batching
2. **BD**: Delivery status — untuk laporan ke klien
3. **FINANCE**: `PurchaseOrder` + `WarehouseInbound` — proses bayar supplier
4. **MANAGEMENT**: Stock value — laporan neraca aset
5. **WAREHOUSE**: PO data — untuk inbound receiving

---

## 7. DASHBOARD KPIs

| KPI | Formula | Target |
|:---|---:|---:|
| Stock Value | Sum(qty × avg price) | — |
| Ready to Produce % | % WO dengan semua BOM tersedia | > 90% |
| On-Time Purchase | % PO datang sesuai estimasi | > 85% |
| Shortage Count | Material dengan stok < Min Stock | 0 critical |
| Dead Stock Value | Material tidak bergerak > 90 hari | < 2% total value |
| Supplier OTD Rate | Rata-rata on-time delivery supplier | > 90% |

---

## 8. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (warehouse — all SCM models) | `backend/prisma/schema/warehouse.prisma` |
| Prisma enums | `backend/prisma/schema/enums.prisma` |
| Materials service | `backend/src/modules/scm/services/materials.service.ts` |
| Materials controller | `backend/src/modules/scm/controllers/materials.controller.ts` |
| Purchase orders service | `backend/src/modules/scm/services/purchase-orders.service.ts` |
| Purchase orders controller | `backend/src/modules/scm/controllers/purchase-orders.controller.ts` |
| Inbounds service | `backend/src/modules/scm/services/inbounds.service.ts` |
| Inbounds controller | `backend/src/modules/scm/controllers/inbounds.controller.ts` |
| Route alias controller | `backend/src/modules/scm/controllers/route-alias.controller.ts` |
| SCM module | `backend/src/modules/scm/scm.module.ts` |
