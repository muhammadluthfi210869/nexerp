# SOURCE OF TRUTH (SoT): PRODUCTION DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: Transformation of raw materials into finished goods with total traceability, physical compliance, and operational safety.

---

## 1. BUSINESS PROCESS FLOW (THE PRODUCTION PIPELINE)

Proses produksi bersifat **Atomic** (berurutan) — tidak bisa dilompati.

| Phase | System Status (`LifecycleStatus`) | Key Action / Event | Mandatory Trigger |
|:---|:---|:---|:---|
| **P-1: Planning** | `PLANNING` | PPIC buat ProductionPlan + WorkOrder | SO must be `READY_TO_PRODUCE` |
| | `WAITING_MATERIAL` | Tunggu material dari Warehouse | — |
| | `READY_TO_PRODUCE` | Semua bahan siap | MaterialRequisition fulfilled |
| **P-2: Batching** | `MIXING` | Timbang bahan + mixing | **Gate: Atomic Phase** |
| | `PENDING_QC` | QC Bulk | QC: `verifyStageQC` |
| | `QC_HOLD` | Jika QC Bulk FAIL | Rework loop |
| **P-3: Filling** | `FILLING` | Isi ke kemasan primer | QC Bulk must be `RELEASED` |
| **P-4: Packing** | `PACKING` | Kemas ke kardus + label + inkjet | Design must be `LOCKED` + NA must exist |
| **P-5: Finalize** | `FINISHED_GOODS` | FG masuk gudang karantina | QC Final must be `GOOD` |
| | `DONE` | Batch selesai | — |
| | `DELIVERED` | Barang dikirim | WH: `createShipment` |
| | `CLOSED` | Semua selesai | Finance: HPP posted |

---

## 2. MODELS & CORE STRUCTURES

### 2.1. ProductionPlan (Batch)
- `batchNo` (unique), `soId`, `adminId`, `status` (LifecycleStatus)
- `apjStatus`, `apjSignatureUrl` — APJ release
- `isFirstPass` — untuk FTY tracking
- Relations: `FinishedGood`, `MaterialRequisition`, `ProductionLog`, `ProductionStepLog`, `RejectExecution`, `COPQRecord`, `WorkOrder`

### 2.2. WorkOrder
- `woNumber`, `leadId`, `planId`, `targetQty`, `targetCompletion`, `actualCompletion`
- `actualCogs`, `targetHpp` — cost tracking
- Relations: `ProductionSchedule`, `DeliveryOrder`, `MaterialRequisition`

### 2.3. ProductionSchedule
- `scheduleNumber`, `workOrderId`, `machineId`, `stage` (ProdStage), `startTime`, `endTime`
- `upscalePercent`, `upscaleResult` — untuk batch upscaling
- Relations: `ProductionStepDetail` (materials per stage)

### 2.4. ProductionLog
- `logNumber`, `workOrderId`, `planId`, `stage`
- `inputQty`, `goodQty`, `quarantineQty`, `rejectQty`, `shrinkageQty`
- `downtimeMinutes`, `machineId`, `operatorId`
- `laborCost`, `overheadCost`, `actualLaborRate`, `actualMachineRate`
- `unitValueAtTransaction` — snapshot biaya material

### 2.5. ProductionStepDetail
- `scheduleId`, `materialId`, `materialCode`, `formulaQty`, `qtyTheoretical`, `qtyActual`
- `category` (MAIN / SUB), `inventoryId` (FEFO batch link)
- Sequence enforcement via `id` ordering

### 2.6. MaterialRequisition
- `reqNumber`, `workOrderId`, `materialId`, `qtyRequested`, `qtyIssued`
- `status`: PENDING → ISSUED / SHORTAGE / PARTIAL
- Relations: `RequisitionFulfillment[]` (batch-level fulfillment)

---

## 3. OPERATIONAL PROTOCOLS (THE INDUSTRIAL GATES)

### [GATE 1] — The Atomic Phase Interlock (Anti-Skip)
- **Aturan**: Tahap B tidak bisa mulai sebelum tahap A selesai
- **System**: Backend error `ATOMIC_SEQUENCE_VIOLATION` jika urutan scan salah
- **Endpoint**: Setiap `submitStepActuals()` memeriksa `previousUnfilled.length > 0`

### [GATE 2] — The QC Bulk Gate (Safety Lockout)
- **Aturan**: Filling tidak aktif jika QC Bulk belum `RELEASED`
- **System**: Terminal filling merah "AKSES DITOLAK"
- **Endpoint**: `updateScheduleResult()` memeriksa `stepLogs[stage='MIXING'].qcAudits[0].status`
- **Event**: `production.qc_interlock_triggered` saat gate blocked

### [GATE 3] — Physical Law Validation (Anti-Underfill)
- **Aturan**: Output filling ≤ input bulk
- **Logic**: `(Good Output × Unit Weight) ≤ Actual Bulk Consumed`
- **Impact**: Deteksi bocor mesin atau manipulasi hasil

### [GATE 4] — Artwork Interlock (Legal Compliance)
- **Aturan**: Packing dilarang jika desain belum `LOCKED` oleh Creative + Legal
- **Impact**: Mencegah produk keluar dengan label salah

### [GATE 5] — Weight Tolerance PIN (The Manager Gate)
- **Aturan**: Deviasi timbangan > 0.5% dari BOM → Supervisor PIN
- **System**: `submitStepActuals()` throws error jika deviasi > 0.5% tanpa PIN
- **Impact**: Mencegah penyimpangan kualitas

### [GATE 6] — Material QC Gate (Batch Integrity)
- **Aturan**: Setiap material yang di-scan di terminal harus `qcStatus === 'GOOD'`
- **System**: `submitStepActuals()` cek `inventory.qcStatus` — blokir jika bukan GOOD
- **Event**: `production.qc_gate_blocked` + `activity.logged`

---

## 4. BACKEND API ENDPOINTS

### 4.1. Production Module (`/production`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/production/dashboard` | `getDashboardStats()` | OEE, yield, COPQ, lead time, downtime |
| GET | `/production/analytics` | `getAnalytics()` | Charts: oeeTrend, yieldDaily, rejectPareto, qcHold, laborCost |
| GET | `/production/terminal` | `getTerminalData()` | Workshops: MIXING, FILLING, PACKING + schedule counts |
| GET | `/production/qc/stats` | `getQCStats()` | FTY, COPQ, leakage, holdAnomaly, complianceScore |
| GET | `/production/plans` | `getProductionPlans()` | Batch records with logs |
| GET | `/production/plans/:id` | `getPlanById()` | Single plan detail |
| GET | `/production/schedules` | `getAllSchedules()` | Production schedules |
| POST | `/production/schedules` | `createSchedule()` | Create schedule from plan |
| PATCH | `/production/schedules/:id/result` | `updateScheduleResult()` | Submit stage result (with QC interlock check) |
| PATCH | `/production/schedules/:id/actuals` | `submitStepActuals()` | Submit step actuals (atomic phase + FEFO + QC gates) |
| GET | `/production/requisitions` | `getAllRequisitions()` | List material requisitions |
| POST | `/production/requisitions/:id/issue` | `issueMaterial()` | Issue material (decrement stock + InventoryTransaction) |
| POST | `/production/requisitions/:id/shortage` | `flagShortage()` | Flag shortage + escalate WO to WAITING_PROCUREMENT |
| GET | `/production/step-logs` | `getStepLogs()` | ProductionStepLog records |
| GET | `/production/step-logs/wo/:woId` | `getStepLogsByWorkOrder()` | Step logs filtered by WO |

### 4.2. Production-Planning Module (`/production-plans`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/production-plans` | `findAll()` | All plans with `batch_no` + `stepLogs` aliases |
| POST | `/production-plans` | `create()` | Create new production plan |
| PATCH | `/production-plans/:id/status` | `updateStatus()` | Update plan status |
| PATCH | `/production-plans/:id/issue-materials` | `issueMaterials()` | Issue materials (stock validation + decrement) |
| POST | `/production-plans/log-step` | `logStep()` | Log production step |

### 4.3. Material Requisitions (alternate route)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/material-requisitions` | `findAll()` | Full CRUD with stock deduction |
| GET | `/material-requisitions/aggregated` | `getAggregated()` | Grouped by work order |
| PATCH | `/material-requisitions/:id/issue` | `issueRequisition()` | Issue with qtyIssued + stock decrement |

---

## 5. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger | Payload |
|------------|------------|---------|---------|
| `production.schedule_completed` | `updateScheduleResult()` | Stage completed with duration | `{ scheduleId, workOrderId, materialsConsumed[] }` |
| `production.qc_verified` | `verifyStageQC()` | QC audit created | `{ scheduleId, stage, status }` |
| `production.material.issued` | `issueMaterial()` | Material issued to production | `{ requisitionId, workOrderId, qtyIssued }` |
| `production.material.shortage` | `flagShortage()` | Shortage flagged | `{ requisitionId, workOrderId }` |
| `production.material.returned` | (event handler) | Production returns material | `{ materialId, qtyReturned, workOrderId }` |
| `production.qc_interlock_triggered` | `updateScheduleResult()` | FILLING blocked without QC | `{ scheduleId, workOrderId, stage }` |
| `production.qc_gate_blocked` | `submitStepActuals()` | Material qcStatus ≠ GOOD | `{ scheduleId, materialId, inventoryId, qcStatus, batchNumber }` |
| `warehouse.material.issued` | `issueMaterial()` | Cross-module stock sync | `{ requisitionId, workOrderId, qtyIssued }` |
| `activity.logged` | All mutations | Generic audit trail | `{ senderDivision: 'PRODUCTION', notes, loggedBy }` |

---

## 6. FRONTEND PAGES

| Page | File | Data Source | Status |
|------|------|-------------|--------|
| **Dashboard** | `production/dashboard/page.tsx` | `useQuery(['prodDashboard'])` → `GET /production/dashboard` | ✅ Dynamic |
| **Analytics** | `production/analytics/page.tsx` | `useQuery(['oeeStats'])` → `GET /production/analytics` | ✅ Dynamic |
| **Terminal** | `production/terminal/page.tsx` | `useQuery(['terminalData'])` → `GET /production/terminal` | ✅ Dynamic |
| **QC Stats** | (QC page) | `GET /production/qc/stats` | ✅ Enriched |
| **Work Orders** | (via production-planning) | `GET /production-plans` | ✅ |
| **Warehouse Command** | `production/warehouse/page.tsx` | `GET /production/requisitions` (poll 10s) | ✅ |

---

## 7. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming):
1. **R&D**: Formula + BOM — standar penimbangan
2. **WAREHOUSE**: Material Issue — stok di lokasi produksi via `releaseMaterial`
3. **QC**: Bulk Release Status — syarat filling
4. **LEGAL**: Artwork Approval — syarat packing
5. **CREATIVE**: Design `LOCKED` — syarat packing

### B. OTHERS DEPEND ON US (Outgoing):
1. **FINANCE**: Actual COGS (HPP) — konsumsi bahan riil + labor + overhead
2. **WAREHOUSE**: FG Inbound + Material Return (sisa/scrap) + `production.schedule_completed` event
3. **BD**: Order Fulfillment Status — update pengiriman
4. **QC**: ProductionLog + schedule data — untuk QC inspection

---

## 8. DASHBOARD KPIs

| KPI | Formula | Target |
|:---|---:|---:|
| OEE | Availability × Performance × Quality | > 85% |
| Yield Recovery | Good FG / Input Raw Material | > 95% |
| COPQ | Reject qty × unit cost | < 1% revenue |
| Production Lead Time | Mixing → FG入库 | < 7 hari |
| Downtime Frequency | Total downtime / Total scheduled time | < 5% |
| FTY (First Time Yield) | Batch PASS first try / Total batch | > 90% |

---

## 9. AUDIT & RECOVERY
- **Physical Mismatch**: Timbangan fisik ≠ input terminal → `Force Reconciliation` (Supervisor)
- **System Downtime**: Logbook Manual → backdated entry setelah sistem pulih
- **Interlock Bypass**: Paksa interlock via `SystemOverrideLog` + notifikasi Direksi
- **Reject Tracking**: Setiap reject → `RejectExecution` + `COPQRecord` + notifikasi Finance

---

## 10. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (production) | `backend/prisma/schema/production.prisma` |
| Production service | `backend/src/modules/production/production.service.ts` |
| Production controller | `backend/src/modules/production/production.controller.ts` |
| Production module | `backend/src/modules/production/production.module.ts` |
| Production-planning service | `backend/src/modules/production-planning/services/production-plans.service.ts` |
| Production-planning controller | `backend/src/modules/production-planning/controllers/production-plans.controller.ts` |
| Requisitions controller (alt) | `backend/src/modules/production-planning/controllers/requisitions.controller.ts` |
| Frontend Dashboard | `frontend/src/app/(dashboard)/production/dashboard/page.tsx` |
| Frontend Analytics | `frontend/src/app/(dashboard)/production/analytics/page.tsx` |
| Frontend Terminal | `frontend/src/app/(dashboard)/production/terminal/page.tsx` |
| Frontend Warehouse Command | `frontend/src/app/(dashboard)/production/warehouse/page.tsx` |
