# SOURCE OF TRUTH (SoT): WAREHOUSE & INVENTORY DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: Custodian of Assets — Physical-Digital Sync, Logistics Gatekeeper, Valuation Integrity.

---

## 1. BUSINESS PROCESS FLOW (THE INVENTORY STATE MACHINE)

Setiap pergerakan stok WAJIB tercatat di `InventoryTransaction` dengan `ReferenceNo` yang valid.

| Phase | System Status | Key Action / Event | Mandatory Trigger Action | Transaction Type |
|:---|:---|:---|:---|---:|
| **P-1: Receiving** | `PENDING_INBOUND` | Barang datang dari Supplier | SCM: `createInbound` | — |
| | `QUARANTINE` | Barang masuk gudang (belum QC) | `receiveBatch` | INBOUND |
| | `AVAILABLE` | Lulus QC → pindah ke rak | QC: `updateStatus(GOOD)` | — |
| **P-2: Internal** | `TRANSFER_PENDING` | Rencana pindah lokasi/gudang | `createTransferOrder` | — |
| | `MOVED` | Barang diterima di tujuan | `executeTransfer` | OUT + IN |
| **P-3: Issuing** | `REQUISITION_OPEN` | Permintaan dari Produksi | Prod: `createMaterialRequisition` | — |
| | `PICKING` | Pengambilan barang (FEFO) | `releaseMaterial` | OUTBOUND |
| | `CONSUMED` | Digunakan dalam produksi | Prod: `completeRequisition` | — |
| **P-4: Delivery** | `PACKING` | Persiapan kirim ke klien | — | — |
| | `SHIPPED` | Barang keluar + cetak SJ | `createShipment` | OUTBOUND |
| **P-5: Audit** | `OPNAME_DRAFT` | Hitung fisik periodik | `createStockOpname` | — |
| | `ADJUSTED` | Selisih approved manager | `approveOpnameWithPin` | ADJUSTMENT |
| **P-6: Return** | — | Retur pembelian (ke supplier) | `createPurchaseReturn` | RETURN |

---

## 2. STORAGE ZONES (LocationType)

| Type | Description | Contoh |
|:---|---:|---:|
| `AMBIENT` | Suhu ruang normal | Rak bahan baku kering |
| `COOL_ROOM` | Suhu dingin (15-25°C) | Bahan mudah rusak |
| `FLAMMABLE` | Tahan api | Bahan alkohol/ solvent |
| `QUARANTINE` | Karantina (menunggu QC) | Barang baru datang |

---

## 3. OPERATIONAL PROTOCOLS (THE SMART GATES)

### [GATE 1] — The Quarantine Interlock
- **Aturan**: System hard-block material `QUARANTINE` atau `REJECTED` tidak bisa dikeluarkan
- **Kecuali**: Return ke Supplier dengan status `REJECTED`
- **Impact**: Material tidak muncul di "Suggest Batch" logistics portal
- **Endpoint**: `POST /warehouse/validate-handover` — cek qcStatus sebelum release

### [GATE 2] — The FEFO Protocol (Anti-Spoilage)
- **Aturan**: Pengambilan wajib urut batch tertua (First Expired First Out)
- **System Action**: UI Workstation tampilkan "Suggested Batch" mencolok
- **Override**: Pilih batch beda → `FEFO_Violation` di audit trail
- **Endpoint**: `GET /warehouse/suggest-batch/:materialId`

### [GATE 3] — Financial Adjustment Threshold (PIN Gate)
- **Aturan**: Selisih Stock Opname > Rp 0 → Manager PIN via `approveOpnameWithPin`
- **Escalation**: Selisih besar → butuh `EscalationType`
- **Impact**: Tanpa PIN, stok tidak berubah & jurnal tidak terbit

### [GATE 4] — Capacity Readiness Interlock
- **Aturan**: Utility > 90% → `CRITICAL_ALERT` pada modul Sales saat order baru
- **Impact**: Mencegah penumpukan barang tidak tertampung
- **Endpoint**: `GET /warehouse/check-thresholds`

### [GATE 5] — Stock Sufficiency Gate (NEW — di releaseMaterial)
- **Aturan**: `releaseMaterial` cek `scmService.checkMaterialReadiness()` — blokir jika SHORTAGE atau NO_APPROVED_SAMPLE
- **Endpoint**: `POST /warehouse/release/:workOrderId`

---

## 4. BACKEND API ENDPOINTS

### 4.1. Dashboard & Audit

| Method | Endpoint | Roles | Service Method | Description |
|--------|----------|-------|----------------|-------------|
| GET | `/warehouse/stats` | SUPER_ADMIN, WAREHOUSE, DIRECTOR | `getDashboardStats()` | Aggregates capacity, valuation, turnover, risk |
| GET | `/warehouse/audit` | SUPER_ADMIN, WAREHOUSE | `getAuditGranular()` | Jalur A/B/C, sensitive materials, packaging, SO fulfillment |
| GET | `/warehouse/check-thresholds` | All (authenticated) | `checkHoldThresholds()` | Hold SLA anomalies per batch |

### 4.2. Catalog & History

| Method | Endpoint | Roles | Service Method | Description |
|--------|----------|-------|----------------|-------------|
| GET | `/warehouse/catalog` | SUPER_ADMIN, WAREHOUSE, PURCHASING, PRODUCTION | `getCatalog()` | All materials with category, inventories, valuations |
| GET | `/warehouse/history/:materialId` | SUPER_ADMIN, WAREHOUSE | `getTransactionHistory()` | Latest 50 InventoryTransaction records |
| GET | `/warehouse/locations` | All (authenticated) | `getLocations()` | All warehouse locations sorted by name |

### 4.3. Batch & FEFO

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/warehouse/suggest-batch/:materialId` | `getSuggestedBatch()` | Best batch by FEFO/FIFO, excludes non-GOOD |
| POST | `/warehouse/batches/:id/status` | `updateBatchStatus()` | Change batch QC status |

### 4.4. Inbound (Goods Receiving)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/warehouse/inbounds` | `getInbounds()` | List all WarehouseInbound records |
| POST | `/warehouse/inbounds` | `createInbound()` | Create GRN + receive goods + InventoryTransaction |

**POST body:**
```typescript
{
  poId?: string;
  receivedAt: string;       // ISO date
  items: Array<{
    materialId: string;
    quantity: number;
    batchNumber: string;
    expiryDate?: string;    // ISO date
  }>;
}
```

### 4.5. Transfer Orders

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/warehouse/transfers` | `getTransferOrders()` | List all transfer orders |
| POST | `/warehouse/transfers` | `createTransferOrder()` | Create transfer order |
| POST | `/warehouse/transfers/:id/execute` | `executeTransferOrder()` | Execute transfer — decrement source, increment dest |

### 4.6. Stock Opname

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/warehouse/opname` | `getOpnames()` | List all opname sessions |
| POST | `/warehouse/opname` | `createOpname()` | Create new opname session |
| POST | `/warehouse/opname/:id/approve` | `approveOpname()` | Approve opname (direct) |
| POST | `/warehouse/opname/:id/approve-pin` | `approveOpnameWithPin()` | Approve opname with PIN verification |

### 4.7. Stock Adjustments

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/warehouse/adjustments` | `getAdjustments()` | List all adjustments |
| POST | `/warehouse/adjustments` | `createAdjustment()` | Create adjustment (WRITE_OFF/CORRECTION/DISPOSAL) |
| POST | `/warehouse/adjustments/:id/approve` | `approveAdjustment()` | Approve/reject adjustment → update stock |

### 4.8. Release & Fulfillment

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/warehouse/release/:workOrderId` | `releaseMaterial()` | Full ACID release: stock deduction + ProductionLog + finance journal |
| GET | `/warehouse/release-requests` | `getReleaseRequests()` | Pending MaterialRequisitions grouped by work order |
| POST | `/warehouse/validate-handover` | `validateHandover()` | Validate batch before handover (QC gate + FEFO) |

---

## 5. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Payload |
|------------|------------|---------|
| `activity.logged` | approveOpname(), releaseMaterial(), updateBatchStatus(), createTransferOrder(), executeTransferOrder(), createOpname(), createInbound(), createAdjustment(), approveAdjustment(), handleProductionMaterialReturn() | `{ action, entityType, entityId, detail, senderDivision: 'WAREHOUSE' }` |
| `warehouse.opname.approved` | approveOpname() | `{ opnameId, opnameNumber, totalLossValue }` |
| `warehouse.material.released` | releaseMaterial() | `{ workOrderId, woNumber, itemsCount, totalValue }` |
| `warehouse.batch.status_changed` | updateBatchStatus() | `{ inventoryId, batchNumber, newStatus, materialId }` |
| `warehouse.transfer.created` | createTransferOrder() | `{ transferId, transferNumber, itemsCount }` |
| `warehouse.transfer.executed` | executeTransferOrder() | `{ transferId, transferNumber }` |
| `warehouse.opname.created` | createOpname() | `{ opnameId, opnameNumber, warehouseId }` |
| `warehouse.inbound.received` | createInbound() | `{ inboundId, inboundNumber, poId, itemsCount }` |
| `warehouse.stock.adjusted` | approveAdjustment() | `{ adjustmentId, type, itemsCount, performedBy }` |
| `warehouse.adjustment.created` | createAdjustment() | `{ adjustmentId, type, qty, materialId }` |
| `warehouse.adjustment.approved` | approveAdjustment() | `{ adjustmentId, type, performedBy }` |

---

## 6. CORE SERVICE: StockLedgerService

**File**: `backend/src/modules/warehouse/services/stock-ledger.service.ts`

The **Golden Thread** for inventory integrity. Setiap pergerakan stok WAJIB melalui `recordMovement()`:

```typescript
async recordMovement(tx: PrismaTx, data: {
  materialId: string;
  type: TransactionType;    // INBOUND | OUTBOUND | ADJUSTMENT | RETURN | DISPOSAL | INTERNAL_MOVE
  quantity: number;
  referenceNo?: string;
  notes?: string;
  inventoryId?: string;     // Optional — untuk update batch-level stock
  warehouseId?: string;
  unitValue?: number;       // HPP snapshot
  performedBy?: string;
}): Promise<InventoryTransaction>
```

**Aksi dalam 1 transaksi:**
1. Create `InventoryTransaction` record
2. Update `MaterialInventory.currentStock` (jika `inventoryId` ada)
3. Update `MaterialItem.stockQty` (global stock cache)

---

## 7. FRONTEND PAGES

| Page | File | Data Source | API Connected? |
|------|------|-------------|----------------|
| **Dashboard** | `warehouse/page.tsx` + `WarehouseDashboardClient.tsx` | Server-fetched `/warehouse/stats`, `/warehouse/audit` | ✅ (hardcoded fallback) |
| **Hub** | `warehouse/hub/page.tsx` | `GET /warehouse/stats`, `/warehouse/catalog`, `/warehouse/history/:id` | ✅ |
| **Adjustment** | `warehouse/adjustment/AdjustmentClient.tsx` | `GET /warehouse/adjustments`, `POST /warehouse/adjustments`, `POST /warehouse/adjustments/:id/approve` | ✅ (sejak v3.0) |
| **Release** | `warehouse/release/ReleaseClient.tsx` | `GET /warehouse/release-requests`, `POST /warehouse/release/:woNumber` | ✅ |
| **Inbound** | `warehouse/inbound/page.tsx` | `GET /warehouse/inbounds`, `POST /warehouse/inbounds` | ✅ |
| **Opname** | `warehouse/opname/page.tsx` | `GET /warehouse/opname`, `POST /warehouse/opname`, `POST /warehouse/opname/:id/approve-pin` | ✅ |
| **Transfers** | `warehouse/transfers/page.tsx` | `GET /warehouse/transfers`, `POST /warehouse/transfers`, `POST /warehouse/transfers/:id/execute` | ✅ |
| **Map** | `warehouse/map/page.tsx` | `GET /warehouse/locations` | ✅ (fallback zones) |
| **Workstation** | `warehouse/workstation/page.tsx` | 7 queries + 4 mutations | ✅ |
| **Dashboard/Warehouse** | `(dashboard)/dashboard/warehouse/page.tsx` | `GET /scm/materials`, `GET /production-plans`, `PATCH issue-materials` | ✅ |
| **Production/Warehouse** | `(dashboard)/production/warehouse/page.tsx` | `GET /production/requisitions` (poll 10s), `POST issue/shortage` | ✅ |

---

## 8. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **SCM**: `PurchaseOrder` + inbound schedule
2. **QC**: `QCAudit.status` — izin pindah dari QUARANTINE via `updateBatchStatus`
3. **PRODUCTION**: `MaterialRequisition` — izin keluarkan barang
4. **FINANCE**: Manager PIN + payment status (G3)
5. **PRODUCTION**: `production.schedule_completed` event — stock deduction trigger (Phase 4: currently commented)

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **FINANCE**: Stock valuation (HPP) — P&L & Balance Sheet via `JournalEntry` from opname/adjustment
2. **SCM**: Safety stock alerts — reorder trigger
3. **PRODUCTION**: Physical material release via `releaseMaterial` + `production.material.issued` event
4. **BD/LOGISTICS**: Shipment status — tracking kiriman

---

## 9. DASHBOARD KPIs

| KPI | Formula | Target |
|:---|---:|---:|
| Inventory Value | Sum(movingAvgPrice × currentStock) | — |
| Storage Utility | Used capacity / Total capacity | < 85% |
| Critical SKU | Count of stock < safetyStock | 0 |
| Turnover Ratio | COGS / Average Inventory Value | > 6x/year |
| FEFO Compliance | % FEFO-compliant picks | > 95% |
| QC Backlog | Batch di QUARANTINE > 48 jam | 0 |
| FIFO Score | System-generated from batch rotation | > 9.0 |

---

## 10. AUDIT & RECOVERY
- **Data Mismatch**: Jika saldo ≠ fisik → wajib `Partial Opname` segera
- **Transaction Ghosting**: Mutasi tanpa `ReferenceNo` → `ANOMALY_LOG` → Audit Internal
- **System Failure**: Hard-Copy Ledger → backdated input setelah sistem pulih
- **Batch Tracking**: Setiap material punya batch number → traceable dari supplier ke konsumen
- **Hold SLA Breach**: `checkHoldThresholds()` flags WARNING (>72h) / CRITICAL (>96h) anomalies

---

## 11. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (warehouse) | `backend/prisma/schema/warehouse.prisma` |
| Prisma schema (production — requisitions) | `backend/prisma/schema/production.prisma` |
| Prisma schema (finance — adjustments) | `backend/prisma/schema/finance.prisma` |
| Service | `backend/src/modules/warehouse/warehouse.service.ts` |
| Controller | `backend/src/modules/warehouse/warehouse.controller.ts` |
| Module | `backend/src/modules/warehouse/warehouse.module.ts` |
| StockLedgerService | `backend/src/modules/warehouse/services/stock-ledger.service.ts` |
| Frontend Dashboard | `frontend/src/app/(dashboard)/warehouse/WarehouseDashboardClient.tsx` |
| Frontend Hub | `frontend/src/app/(dashboard)/warehouse/hub/page.tsx` |
| Frontend Adjustment | `frontend/src/app/(dashboard)/warehouse/adjustment/AdjustmentClient.tsx` |
| Frontend Release | `frontend/src/app/(dashboard)/warehouse/release/ReleaseClient.tsx` |
| Frontend Inbound | `frontend/src/app/(dashboard)/warehouse/inbound/page.tsx` |
| Frontend Opname | `frontend/src/app/(dashboard)/warehouse/opname/page.tsx` |
| Frontend Transfers | `frontend/src/app/(dashboard)/warehouse/transfers/page.tsx` |
| Frontend Map | `frontend/src/app/(dashboard)/warehouse/map/page.tsx` |
| Frontend Workstation | `frontend/src/app/(dashboard)/warehouse/workstation/page.tsx` |
