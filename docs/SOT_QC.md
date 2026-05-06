# SOURCE OF TRUTH (SoT): QUALITY CONTROL (QC) DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: The Ultimate Gatekeeper — ensuring all materials and finished goods meet physical, chemical, and legal standards.

---

## 1. QUALITY ASSURANCE PIPELINE

| Phase | QC Stage | Key Action / Event | Output |
|:---|:---|:---|:---|
| **QC-1: Inbound** | Material dari Supplier | Validasi COA + integrity packing + labeling | `QCAudit.status: GOOD/REJECT` |
| | | Update `MaterialInventory.qcStatus` | QUARANTINE → AVAILABLE |
| **QC-2: Bulk (Mixing)** | Hasil masakan dari tangki | Uji pH, viskositas, organoleptik | `QCAudit.status: RELEASED/HOLD` |
| **QC-3: Filling** | Botol/pouch setelah diisi | Sampling volume, sealing check, kebocoran | QC Pass → lanjut Packing |
| **QC-4: Final (Packing)** | Kardus jadi siap gudang | Sampling berat, inkjet check, barcode scan | `QCAudit.status: GOOD/REJECT` |
| **QC-5: Retention** | Sampel pertinggal | Simpan sampel batch untuk audit BPOM | "RETAINED" dengan lokasi rak |

---

## 2. COMPLIANCE PROTOCOLS (THE QUALITY GATES)

### [GATE 1] — Inventory Bridge Interlock
- **Aturan**: Material baru (inbound/finished) otomatis `QUARANTINE`
- **System Action**: Material tidak bisa digunakan dalam `WorkOrder` jika `qcStatus ≠ GOOD`
- **Endpoint**: `POST /warehouse/batches/:id/status` — set ke GOOD untuk release
- **Impact**: Mencegah bahan baku tidak teruji / produk gagal ke konsumen

### [GATE 2] — Lab-Grade Precision Lock
- **Aturan**: QC Bulk wajib uji parameter: pH, viskositas, organoleptik
- **Threshold**: Parameter di luar toleransi `QCParameter` → tombol "Submit" terkunci
- **Exception**: Supervisor Bypass untuk "Out-of-Spec but Acceptable" — butuh PIN

### [GATE 3] — Final Packing Validation (COA Ready)
- **Aturan**: Sampling berat (±1% tolerance), sealing check, inkjet coding, barcode
- **Logic**: Jika deviasi > 1% pada > 3 sampel → batch auto `REJECT`
- **Impact**: Menghindari keluhan isi kurang / kemasan bocor

---

## 3. BACKEND API ENDPOINTS

### 3.1. QC Module (`/qc`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/qc/audits` | `findAll(status?, type?)` | List QC audits with `?status=` and `?type=inbound` filters |
| POST | `/qc/audits` | `create()` | Create QC audit |
| POST | `/qc` | `create()` (alias) | Accepts snake_case `step_log_id` + PASS/FAIL status mapping |
| GET | `/qc/:id` | `findOne()` | Single audit detail |

**POST /qc response shape:**
```typescript
// Menerima:
{ step_log_id: string; status: 'PASS' | 'FAIL' | 'GOOD' | 'REJECT' | 'REJECTED'; notes?: string }
// Mapping: PASS → GOOD, FAIL → REJECT, REJECTED → REJECT
```

### 3.2. Production QC Stats

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/production/qc/stats` | `getQCStats()` | Enriched: FTY, COPQ, leakage, holdAnomaly, anomalies[], complianceScore |

### 3.3. SCM Inbound QC

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/scm/inbounds/:id/qc-validate` | `qcValidate()` | QC validate inbound goods |

### 3.4. Warehouse Batch QC

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| POST | `/warehouse/batches/:id/status` | `updateBatchStatus()` | Change `MaterialInventory.qcStatus` (GOOD/QUARANTINE/REJECT) |

---

## 4. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger | Payload |
|------------|------------|---------|---------|
| `qc.audit.created` | QCAuditsService.create() | New audit created | `{ auditId, status, stepLogId }` |
| `production.qc_verified` | ProductionService.verifyStageQC() | Stage QC verified | `{ scheduleId, stage, status }` |
| `scm.inbound.qc_validated` | InboundsService.qcValidate() | Inbound QC validated | `{ inboundId, qcStatus }` |
| `production.qc_interlock_triggered` | ProductionService.updateScheduleResult() | QC gate blocked | `{ scheduleId, workOrderId, stage }` |
| `production.qc_gate_blocked` | ProductionService.submitStepActuals() | Material QC blocked | `{ scheduleId, materialId, inventoryId, qcStatus, batchNumber }` |
| `warehouse.batch.status_changed` | WarehouseService.updateBatchStatus() | Batch QC status changed | `{ inventoryId, batchNumber, newStatus, materialId }` |
| `qc.notification` | EventsController SSE | QC notification stream | `{ type: 'qc_notification', data }` |
| `activity.logged` | All QC-related mutations | Generic audit trail | `{ senderDivision: 'QC' | 'PRODUCTION', notes, loggedBy }` |

---

## 5. QC AUDIT FORM — DETAIL FIELDS

Model: `QCAudit`

| Field | Type | Description |
|-------|------|-------------|
| `stepLogId` | UUID (FK → ProductionLog) | Reference ke batch record |
| `qcId` | UUID (FK → User) | QC officer |
| `status` | QCStatus enum | GOOD / QUARANTINE / REJECT |
| `phValue` | Decimal? | Hasil pH meter |
| `viscosityValue` | Int? | Hasil viscometer |
| `organoleptic` | Boolean? | Bau/warna/tekstur OK? |
| `samplingVolume` | Decimal? | Volume sampling |
| `inkjetCheck` | Boolean? | Batch & expired date tercetak? |
| `sealingCheck` | Boolean? | Sealing rapat? |
| `notes` | Text? | Catatan inspektur |

---

## 6. FRONTEND PAGES

| Page | File | Data Source | Status |
|------|------|-------------|--------|
| **QC Dashboard** | `qc/dashboard/page.tsx` | `GET /production/qc/stats` | ✅ Enriched stats |
| **QC Inspections** | `qc/inspections/page.tsx` | `GET /qc/audits?status=PENDING` | ✅ Filtered |
| **QC Stability** | `qc/stability/page.tsx` | `GET /rnd/lab-test-results?type=stability` | ✅ Fixed 404 |
| **QC COA** | `qc/coa/page.tsx` | `GET /qc/audits?type=inbound` | ✅ Reshaped response |
| **QC Workbench** | `qc/workbench/page.tsx` | `POST /qc/audits`, `POST /qc` | ✅ Status alias |
| **Dashboard QC** | `dashboard/qc/page.tsx` | `GET /production-plans` + `POST /qc` | ✅ batch_no alias |

---

## 7. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **WAREHOUSE**: `WarehouseInbound` — data goods receipt untuk QC Inbound
2. **PRODUCTION**: `ProductionLog` — batch record untuk QC Bulk & Final
3. **R&D**: `QCParameter` — target range pH, viskositas, berat standar
4. **SCM**: Inbound records — untuk QC inbound gate

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **PRODUCTION**: `QCAudit.status = RELEASED` → izin mesin ke tahap berikutnya (via `production.qc_verified`)
2. **WAREHOUSE**: `QCAudit.status = GOOD` → pindah stok dari QUARANTINE ke AVAILABLE (via `warehouse.batch.status_changed`)
3. **FINANCE**: `RejectExecution.qty` + `COPQRecord` — kalkulasi kerugian
4. **MANAGEMENT**: FTY rate, defect rate, COPQ value

---

## 8. QUALITY METRICS (KPIs)

| KPI | Formula | Target |
|:---|---:|---:|
| FTY (First Time Yield) | % batch PASS pada percobaan pertama | > 90% |
| Rework Rate | % produk perlu perbaikan after QC | < 5% |
| QC Lead Time | Jam dari sampling → release | < 4 jam |
| COPQ (Cost of Poor Quality) | Reject qty × unit cost + downtime cost | < 1% revenue |
| Inbound Reject Rate | % batch material ditolak | < 3% |
| Compliance Score | Composite dari FTY + COPQ + anomaly count | > 85 |

---

## 9. AUDIT TRAIL & TRACEABILITY
- **Digital Signature**: Setiap audit catat `qcId`, `timestamp`, `ipAddress` (immutable)
- **Retention Samples**: System track lokasi rak sample pertinggal untuk audit BPOM
- **Root Cause Analysis**: Setiap kegagalan fatal → trigger `AuditEscalation` + notifikasi Direktur
- **CAPA (Phase 2)**: Corrective & Preventive Action — form digital untuk RCA formal

---

## 10. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (QC) | `backend/prisma/schema/qc.prisma` |
| QCAudits service | `backend/src/modules/qc/services/qc-audits.service.ts` |
| QCAudits controller | `backend/src/modules/qc/controllers/qc-audits.controller.ts` |
| QC alias controller | `backend/src/modules/qc/controllers/qc.controller.ts` |
| QC module | `backend/src/modules/qc/qc.module.ts` |
| Events controller (SSE) | `backend/src/modules/events/events.controller.ts` |
| Production QC stats | `backend/src/modules/production/production.service.ts` |
| SCM Inbounds service | `backend/src/modules/scm/services/inbounds.service.ts` |
| Frontend Dashboard | `frontend/src/app/(dashboard)/qc/dashboard/page.tsx` |
| Frontend Inspections | `frontend/src/app/(dashboard)/qc/inspections/page.tsx` |
| Frontend Stability | `frontend/src/app/(dashboard)/qc/stability/page.tsx` |
| Frontend COA | `frontend/src/app/(dashboard)/qc/coa/page.tsx` |
| Frontend Workbench | `frontend/src/app/(dashboard)/qc/workbench/page.tsx` |
| Frontend Dashboard QC | `frontend/src/app/(dashboard)/dashboard/qc/page.tsx` |
