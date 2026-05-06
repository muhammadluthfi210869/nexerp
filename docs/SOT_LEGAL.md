# SOURCE OF TRUTH (SoT): LEGAL & COMPLIANCE DIVISION
**Version**: 3.0 — Sinkron dengan CANONICAL_GLOSSARY.md v3.0
**Owner**: APJ (Apoteker Penanggung Jawab) / Legal Manager
**Objective**: Regulatory compliance (BPOM/HKI/Halal), acting as the "Hard-Gate" for production.

---

## 1. BUSINESS PROCESS FLOW — REGULATORY PIPELINE

Setiap produk baru wajib melewati 5 tahap `RegStage`:

| Stage | Action | PIC | Estimated Duration |
|:---|:---|---:|---:|
| **1. DRAFT** | Inisiasi dari R&D (Formula → Legal) | Legal | — |
| **2. SUBMITTED** | Input data portal BPOM/DJKI + Pengajuan PNBP | Legal + Finance | 3 hari |
| **3. EVALUATION** | Verifikasi PNBP by Finance + Proses pemerintah | Finance + Government | 30-90 hari |
| **4. REVISION** | Perbaikan data jika ada catatan instansi | Legal + R&D | 7-14 hari |
| **5. PUBLISHED** | Nomor NA/HKI/Halal terbit → unlock produksi | System otomatis | — |

---

## 2. REGULATORY TYPES (RegType)

| Type | Description | Model | Government Agency |
|:---|---:|:---|---:|
| `BPOM` | Notifikasi Kosmetik | `BpomRecord` | BPOM RI |
| `HKI_BRAND` | Merek dagang | `HkiRecord` | DJKI |
| `HKI_LOGO` | Logo perusahaan | `HkiRecord` | DJKI |
| `HALAL` | Sertifikasi halal | `RegulatoryPipeline` | BPJPH/MUI |

---

## 3. BACKEND API ENDPOINTS

### Legal Module (`/legal`)

| Method | Endpoint | Service Method | Description |
|--------|----------|----------------|-------------|
| GET | `/legal/pipeline` | `getAll()` | Regulatory pipeline list |
| POST | `/legal/pipeline` | `create()` | Create new regulatory pipeline |
| PATCH | `/legal/pipeline/:id/submit` | `submitRegulation()` | Submit to BPOM/DJKI |
| PATCH | `/legal/pipeline/:id/publish` | `publish()` | Set PUBLISHED with registrationNo |
| POST | `/legal/pnbp/request` | `createPnbpRequest()` | Create PNBP payment request |
| GET | `/legal/master-inci` | `getMasterInci()` | Master INCI database |
| POST | `/legal/master-inci` | `createMasterInci()` | Add INCI record |
| POST | `/legal/artwork-review` | `createArtworkReview()` | Review artwork from Creative |
| PATCH | `/legal/artwork-review/:id` | `approveArtwork()` | Approve/reject artwork |
| POST | `/legal/internal-audit` | `createInternalAudit()` | Create CPKB audit |
| PATCH | `/legal/internal-audit/:id` | `closeAudit()` | Close audit findings |

---

## 4. OPERATIONAL HARD GATES (SMART LOCKS)

| Gate Name | Trigger Point | Logic | Effect on Other Divisions |
|:---|:---|---:|:---|
| **Formula Shield** | `LegalityService.validateFormula` | Cek bahan di `MasterInci` — prohibited/limit compliance | Blok R&D lock formula jika ada prohibited ingredient |
| **SCM Gate** | `ArtworkReview.isApproved` | Review klaim logo, komposisi, BPOM number | SCM tidak bisa PO kemasan tanpa ACC Legal |
| **Production Gate** | `RegulatoryPipeline.registrationNo` | Nomor NA harus terisi | Blok FILLING & PACKING jika NA belum terbit |
| **Finance Gate** | `PNBPRequest.isPaid` | PNBP harus lunas | Pipeline stuck di SUBMITTED sampai Finance konfirm bayar |

---

## 5. COMMUNICATION PROTOCOL (EVENT EMISSIONS)

| Event Name | Emitted In | Trigger |
|------------|------------|---------|
| `activity.logged` | All mutation endpoints | Generic audit trail |

---

## 6. PAGE SPECIFICATIONS

### 6.1. COMPLIANCE INBOX
- **Task Types**: `FORMULA_VALIDATION` (auto vs MasterInci), `ARTWORK_REVIEW` (visual + claims), `PNBP_FILING`
- **Logic**: Flag `isApproved` jadi prasyarat gate SCM & Produksi

### 6.2. MASTER INCI DATABASE
- **Model**: `MasterInci` — `inciName` (Unique), `casNumber`, `category`, `maxConcentration`, `prohibitedContext`, `warningText`
- **Constraint**: `MaterialItem.inciName` harus sesuai `MasterInci.inciName` untuk validasi otomatis

### 6.3. REGULATORY PIPELINE (Control Tower)
- **Visual**: Progress bar 5 tahap dengan indikator interlock (Finance: biru, Artwork: hijau, BPOM: emas)
- **Fields**: `leadId`, `sampleRequestId`, `type`, `currentStage`, `pnbpStatus`, `registrationNo`, `expiryDate`, `daysInStage`, `logHistory` (Json), `legalPicId`, `formulaId`, `materialItemId`

### 6.4. INTERNAL AUDIT WORKBENCH
- **Model**: `InternalAudit` — `area` (CPKB/CARA/GMP), `auditDate`, `parameterChecklist` (Json), `findings`, `remediationDeadline`, `status` (PENDING/DONE), `picId`

### 6.5. ARTWORK REVIEW PANEL
- **Model**: `ArtworkReview` — `pipelineId`, `designerPicId`, `artworkUrl`, `claimRisk` (LOW/MEDIUM/HIGH), `notes`, `isApproved`, `approvedAt`, `approvedById`
- **Logic**: Jika `claimRisk = HIGH` → wajib escalation ke Direktur

---

## 7. AUDIT INTEGRITY PROTOCOL

1. **Registration Validation**: Status `PUBLISHED` hanya aktif jika `registrationNo` ≥ 10 karakter
2. **Immutable Logs**: Setiap stage change wajib catat di `LegalTimelineLog`
3. **Halal Validation**: Sertifikat Halal bahan baku dari Supplier wajib validasi sebelum formula APPROVED
4. **CPKB Checklist**: `InternalAudit.parameterChecklist` must 100% terisi sebelum produksi pertama
5. **Expiry Monitoring**: `expiryDate` < 90 days → `AuditRiskLevel.CRITICAL` → notifikasi Direktur

> [!CAUTION]
> DILARANG KERAS bypass `checkProductionGate` tanpa approval tertulis Direktur Utama.

---

## 8. FILE REFERENCE

| File | Path |
|------|------|
| Prisma schema (legal/rnd) | `backend/prisma/schema/rnd.prisma` |
| Legal service | `backend/src/modules/legal/legal.service.ts` |
| Legal controller | `backend/src/modules/legal/legal.controller.ts` |
| Legal module | `backend/src/modules/legal/legal.module.ts` |
