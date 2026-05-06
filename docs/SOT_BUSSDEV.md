# SOURCE OF TRUTH (SoT): BUSINESS DEVELOPMENT (BD) DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: Front-line Orchestrator — Commercial Commitment Hub and Client Lifecycle Manager.

---

## 1. BUSINESS PROCESS FLOW (THE MASTER STATE MACHINE)

Seluruh pergerakan status klien mengikuti alur linear. Lonjakan status dilarang kecuali `Emergency Override`.

| Phase | System Status (`WorkflowStatus`) | Key Action | Trigger |
|:---|:---|:---|:---|
| **P-1: Acquisition** | `NEW_LEAD` | Data masuk (DigiMar/Guest/Manual) | `createLead` |
| | `CONTACTED` | Follow-up pertama | `logActivity(FOLLOW_UP)` |
| | `FOLLOW_UP_1/2/3` | Follow-up lanjutan | `logActivity` |
| | `NEGOTIATION` | Upload quotation + nego spesifikasi | `logActivity(QUOTATION)` |
| **P-2: Development** | `SAMPLE_REQUESTED` | Buat SampleRequest | `createSampleRequest` |
| | `WAITING_FINANCE_APPROVAL` | Tunggu G1 | — (waiting Finance) |
| | `SAMPLE_SENT` | Sampel dikirim ke klien | R&D: `shipSample` |
| | `SAMPLE_APPROVED` | Klien setuju formula | BD: `approveSample` |
| **P-3: Commitment** | `SPK_SIGNED` | Buat SO + upload SPK | `createSalesOrder` |
| | `WAITING_FINANCE_APPROVAL` | DP belum diverifikasi | — |
| | `DP_PAID` | DP ≥ 50% verified (G2) | Finance: `verifyPayment` |
| **P-4: Execution** | `PRODUCTION_PLAN` | Produksi berjalan | Prod: `createWorkOrder` |
| | `READY_TO_SHIP` | FG ready, tunggu pelunasan | QC: `releaseProduct` |
| **P-5: Termination** | `WON_DEAL` | Lunas + barang terkirim (G3) | Finance + WH |
| | `LOST` / `ABORTED` | Prospek gagal | BD: `logActivity(LOST)` |

---

## 2. COMMERCIAL PROTOCOLS (THE 3 FINANCIAL GATES)

### [GATE 1] — Sample Gating
- **Status**: `WAITING_FINANCE` → `SAMPLE_SENT` (after R&D done)
- **Syarat**: Upload bukti bayar sampel → Finance verify
- **Impact**: Data tidak muncul di dashboard R&D sampai verified

### [GATE 2] — Production Gating (The DP Interlock)
- **Status**: `SPK_SIGNED` → `DP_PAID` (via `LOCKED_ACTIVE`)
- **Syarat**: DP ≥ 50% masuk rekening
- **Impact**: SCM, Legal, Creative, Warehouse tidak aktif sampai G2 terbuka

### [GATE 3] — Delivery Gating
- **Status**: `READY_TO_SHIP` → `WON_DEAL`
- **Syarat**: Pelunasan 100%
- **Impact**: Warehouse tidak bisa cetak DO/DeliveryOrder

---

## 3. BACKEND API ENDPOINTS

### BussDev Module (`/bussdev`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/bussdev` | `getAll()` | All leads with pipeline data |
| POST | `/bussdev/lead` | `createLead()` | Create new lead |
| GET | `/bussdev/lead/:id` | `findOne()` | Single lead detail |
| PUT | `/bussdev/lead/:id` | `updateLead()` | Update lead |
| DELETE | `/bussdev/lead/:id` | `removeLead()` | Delete lead |
| POST | `/bussdev/lead/:id/activity` | `logActivity()` | Log activity on lead |
| GET | `/bussdev/lead/:id/activities` | `getActivities()` | Get activity timeline |
| POST | `/bussdev/sample-request` | `createSampleRequest()` | Create sample request |
| PATCH | `/bussdev/sample-request/:id` | `updateSampleRequest()` | Update sample request |
| POST | `/bussdev/sales-order` | `createSalesOrder()` | Create sales order |
| PATCH | `/bussdev/sales-order/:id` | `updateSalesOrder()` | Update sales order |
| GET | `/bussdev/sales-orders` | `getSalesOrders()` | List sales orders |
| POST | `/bussdev/approve-sample` | `approveSample()` | Approve sample |

---

## 4. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger |
|------------|------------|---------|
| `activity.logged` | logActivity, createSampleRequest, createSalesOrder, approveSample | All mutations logged |

---

## 5. PAGE SPECIFICATIONS

### 5.1. PAGE: LEAD INTAKE
- **Inputs**: `clientName`, `brandName`, `contactChannel`, `city`, `productInterest`, `estimatedMoq`, `launchingPlan`, `targetMarket`
- **Inbound**: Dari DigiMar via `DailyAdsMetric.leadsGenerated`
- **Outbound**: Submit → notifikasi BD team

### 5.2. PAGE: SALES PIPELINE (Granular Tracker)
- **Inputs**: `packagingSuggestion`, `designSuggestion`, `valueSuggestion`, `logoRevision`, `hkiProgress`
- **Inbound**: Progress dari Legal (HKI) + Creative (Design)
- **Outbound**: Suggestions → dashboard R&D + Creative

### 5.3. PAGE: SALES ORDER CENTRAL
- **Inputs**: `taxId` (ref `TaxRate`), `currencyId` (ref `Currency`), `totalAmount`, Items: materialId, productName, qty, unitPrice, netto
- **Inbound**: Data `SAMPLE_APPROVED` dari R&D
- **Outbound**: SO → auto-create `Invoice` draft di Finance

### 5.4. PAGE: RETURNS
- **Inputs**: `soId`, `qtyReturn`, `returnStatus` (POTONG_TAGIHAN/TUKAR_BARANG), `warehouseId`
- **Outbound**: Update stok WH + adjust piutang Finance

### 5.5. PAGE: RETENTION ENGINE
- **Status**: `WAITING` → `NOTIFIED` → `REORDERED` → `CHURNED`
- **Logic**: `estDepletionDate` = qty delivered / estimated monthly consumption
- **Trigger**: H-14 → notifikasi BD

---

## 6. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming):
1. **DIGIMAR**: Lead data — tanpa ini BD tidak bisa mulai
2. **FINANCE**: Payment verification — stuck tanpa G1/G2/G3
3. **R&D**: Sample approval + BOM costing
4. **LEGAL**: BPOM number — untuk janji pengiriman
5. **CREATIVE**: Design approval

### B. OTHERS DEPEND ON US (Outgoing):
1. **R&D**: NPF + Sample payment → trigger formulasi
2. **SCM**: `SalesOrder` (LOCKED) → trigger procurement
3. **PRODUCTION**: Deal confirmation + approved design
4. **FINANCE**: Sales Order + payment proof → revenue recording

---

## 7. DASHBOARD KPIs

| Widget | Source |
|:---|---:|
| Funnel Overview | Count `SalesLead` group by status |
| Revenue Pipeline | Sum `estimatedValue` (Leads) + Sum `totalAmount` (Active SO) |
| Activity Performance | Count `ActivityStream` per BD per hari |
| Critical Alerts | Leads with `lastStageAt` > 7 hari (stuck) |
| BD Performance | Target vs Actual Revenue (from `WON_DEAL`) |
| Lost & Churn | `LostReason` from `SalesLead` |

---

## 8. FILE REFERENCE

| File | Path |
|------|------|
| BussDev service | `backend/src/modules/bussdev/bussdev.service.ts` |
| BussDev controller | `backend/src/modules/bussdev/bussdev.controller.ts` |
| BussDev module | `backend/src/modules/bussdev/bussdev.module.ts` |
| Granular Pipeline service | `backend/src/modules/bussdev/granular.gantry.service.ts` |
| Granular Pipeline controller | `backend/src/modules/bussdev/granular.gantry.controller.ts` |
