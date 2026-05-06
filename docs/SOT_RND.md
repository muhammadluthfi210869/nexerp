# SOURCE OF TRUTH (SoT): RESEARCH & DEVELOPMENT (R&D) DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Role**: The Innovation Engine — Formula Architect, Lab Testing, and Technical Quality Guardian.

---

## 1. BUSINESS PROCESS FLOW (THE FORMULATION LIFECYCLE)

| Phase | System Status (`SampleStage`) | Key Action / Event | Mandatory Output |
|:---|:---|:---|:---|
| **P-1: Queue** | `QUEUE` | Terima task setelah Gate 1 (Finance verified) | `picAssignment` (RndStaff) |
| **P-2: Lab Work** | `FORMULATING` | Racik formula + phases + ingredients | `Formula` (v1) |
| **P-3: Testing** | `LAB_TEST` | Uji stabilitas & fisik-kimia | `LabTestResult` (pH, visco, 40°C/RT/4°C) |
| **P-4: Ready Ship** | `READY_TO_SHIP` | Sampel siap dikirim | `trackingNumber` + `courierName` |
| **P-5: Shipped** | `SHIPPED` | Sample dalam perjalanan | auto status via tracking |
| **P-6: Client Review** | `CLIENT_REVIEW` | Klien review sampel | — |
| **P-7: Revision** | (loop) | Feedback dari BD → revisi formula | `SampleRevision` (v2, v3...) |
| **P-8: Approval** | `APPROVED` | Formula disetujui klien | `Formula.status = SAMPLE_LOCKED` |
| **P-9: Rejected** | `REJECTED` | Klien tolak sampel final | Lead back to NEGOTIATION |
| **P-10: Cancelled** | `CANCELLED` | Proyek dibatalkan | — |

---

## 2. BACKEND API ENDPOINTS

### RND Module (`/rnd`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/rnd` | Dashboard | R&D overview |
| GET | `/rnd/samples` | `getAllSampleRequests()` | All sample requests |
| GET | `/rnd/samples/:id` | `getSampleRequest()` | Single sample request detail |
| POST | `/rnd/samples/:id/accept` | `acceptSampleTask()` | Accept task (set PIC) |
| POST | `/rnd/samples/:id/formula` | `createFormula()` | Create formula version |
| GET | `/rnd/formulas/:id` | `getFormula()` | Formula detail with phases + items |
| PATCH | `/rnd/formulas/:id/lock` | `lockFormula()` | Lock formula → SAMPLE_LOCKED |
| POST | `/rnd/lab-test` | `createLabTestResult()` | Input lab test results |
| GET | `/rnd/lab-test-results` | `getAllLabTestResults(type?)` | All lab tests, optional `?type=stability` filter |
| GET | `/rnd/lab-test-results/:formulaId` | `getLabTestResults()` | Lab tests for specific formula |
| POST | `/rnd/samples/:id/ship` | `shipSample()` | Input courier + tracking number |
| PATCH | `/rnd/samples/:id/revision` | `createRevision()` | Create revision from feedback |
| POST | `/rnd/qc-parameters/:formulaId` | `setQcParameters()` | Set QC target parameters |

---

## 3. TECHNICAL PROTOCOLS & QUALITY GATES

### [GATE 1] — Integrity Gate (The Brief Interlock)
- R&D berhak tolak brief jika NPF tidak lengkap / target HPP tidak masuk akal
- Tombol "Accept" hanya aktif jika `paymentApprovedAt` sudah terisi (Gate 1)

### [GATE 2] — Stability Gate (The Safety Interlock)
- Formula tidak boleh `READY_TO_SHIP` sebelum data uji lab dasar diinput
- System cek `lab_test_results` — harus ada record sebelum shipping
- Parameters: pH, aroma, warna, tekstur, stabilitas 40°C/RT/4°C

### [GATE 3] — Commercial Gate (The HPP Interlock)
- Setiap formula hitung real-time HPP snapshot dari harga material SCM
- Jika `FormulaItem.costSnapshot` × dosage > `SampleRequest.targetHpp` → High Cost Alert

### [GATE 4] — Formula Lock Gate
- Formula tidak bisa dipakai produksi sebelum status = `PRODUCTION_LOCKED`
- State Machine: DRAFT → WAITING_APPROVAL → SAMPLE_LOCKED → (opsional) BPOM_REGISTRATION_PROCESS → PRODUCTION_LOCKED
- Constraint: `FormulaItem.dosagePercentage` total harus 100% untuk setiap `FormulaPhase`

---

## 4. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger |
|------------|------------|---------|
| `activity.logged` | All mutation endpoints | Generic audit trail |

---

## 5. PAGE SPECIFICATIONS

### 5.1. PAGE: SAMPLE INBOX
- **Inputs**: `picId` (formulator), `difficultyLevel` (1-5), `targetDeadline`
- **Inbound**: Data NPF + SampleRequest dari BD
- **Outbound**: Klik "Accept" → auto-create `Formula v1` + notifikasi ke BD

### 5.2. PAGE: FORMULA LAB (The Workbench)
- **Phases**: Urutan proses (Fase A, B, C...) → `FormulaPhase`
- **Ingredients**: `materialId`, `dosagePercentage` (per phase total = 100%), `instructions`
- **QC Parameters**: `targetPh`, `targetViscosity`, `targetColor`, `targetAroma`, `appearance`
- **Outbound**: Klik "Lock Formula" → freeze version → `Formula.status = SAMPLE_LOCKED`

### 5.3. PAGE: LAB TEST CENTER
- **Physical**: `actualPh`, `actualViscosity`, `actualDensity`, `colorResult`, `aromaResult`, `textureResult`
- **Stability**: `stability40C` (48°C oven), `stabilityRT` (room temp), `stability4C` (refrigerator)
- **Outbound**: Data lab test → Legal untuk BPOM submission

### 5.4. PAGE: REVISION TRACKER
- `revisionNumber` auto increment, `feedback` dari BD, `materialItemId` jika revisi material spesifik
- Jika `revisionCount > 3` → trigger notifikasi "Stuck Sample" ke Direktur

---

## 6. DATA LINEAGE & CONTRACT

### A. WE DEPEND ON (Incoming Data):
1. **BD**: `SampleRequest` (NPF) + `targetHpp` — tanpa ini R&D tidak punya arah
2. **SCM**: `MaterialItem` + latest price (`MaterialValuation`) — untuk HPP kalkulasi
3. **FINANCE**: `paymentApprovedAt` — Gate 1, R&D dilarang kerja sebelum verified

### B. OTHERS DEPEND ON US (Outgoing Data):
1. **SCM**: `BillOfMaterial` — untuk hitung kebutuhan belanja bahan baku
2. **PRODUCTION**: `Formula` + `FormulaPhase.instructions` — work instruction mixing
3. **LEGAL/BPOM**: `LabTestResult` + `Formula` — untuk pendaftaran notifikasi kosmetik
4. **BD**: `SampleStage` + `revisionCount` — untuk update progress ke klien
5. **QC**: `QCParameter` — target pH, viskositas untuk acuan inspeksi

---

## 7. DASHBOARD KPIs

| KPI | Formula | Target |
|:---|---:|---:|
| On-Time Sample Rate | % sample selesai sebelum `targetDeadline` | > 85% |
| Avg Cycle Time | Rata-rata hari dari QUEUE → APPROVED | < 10 hari |
| First-Time Approval | % sample approved V1 tanpa revisi | > 40% |
| Avg Revision | Rata-rata revisi per project | < 3 |
| Utilization Rate | Project aktif / `maxWeeklyCapacity` per staff | 70-85% |

---

## 8. AUDIT PROTOCOL
1. **Ingredient Audit**: Jika total `dosagePercentage` per phase ≠ 100% → tolak Lock Formula
2. **Revision Audit**: Jika `revisionCount > 3` → notifikasi "Stuck Sample" ke Direktur
3. **Cost Audit**: Jika HPP realisasi > HPP target → formulator wajib justifikasi biaya
4. **Stability Audit**: Jika `LabTestResult` menunjukkan instabilitas → formula wajib reformulasi

---

## 9. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (rnd) | `backend/prisma/schema/rnd.prisma` |
| RND service | `backend/src/modules/rnd/rnd.service.ts` |
| RND controller | `backend/src/modules/rnd/rnd.controller.ts` |
| RND module | `backend/src/modules/rnd/rnd.module.ts` |
