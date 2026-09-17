# Master Business Process Blueprint: ERP Dreamlab
**Version**: 3.0 — Dokumen ini adalah **referensi tunggal** untuk alur kerja ideal, endpoint API, event bus, dan gate interlock. Lihat `CANONICAL_GLOSSARY.md` untuk detail status & terminologi. Lihat masing-masing SOT untuk endpoint lengkap.

---

## FASE 0: AKUISISI & PIPELINE

| Step | Actor | Action | System Trigger | Endpoint | Gate | Exception |
|:---|:---|:---|:---|:---|:---:|:---|
| 0.1 | DigiMar | Input DailyAdsMetric → lead masuk | `createLead` | `POST /marketing/daily-ads` | — | Data ads tidak valid → hold |
| 0.2 | BD | Follow up & kualifikasi prospek | `logActivity` | `POST /bussdev/lead/:id/activity` | — | Lost prospect → `LOST` |
| 0.3 | BD | Buat NPF (NewProductForm) | `createNpf` | `POST /bussdev/lead` | — | Data kurang → reject brief |

**Event**: `activity.logged` (BD), `marketing.ads.created` (DigiMar)

**Output**: `SalesLead.status = NEGOTIATION` + `NPF`

---

## FASE 1: PRA-KUALIFIKASI & SAMPEL

| Step | Actor | Action | System Trigger | Endpoint | Gate | Exception |
|:---|:---|:---|:---|:---|:---:|:---|
| 1.1 | BD | Buat SampleRequest → otomatis `WAITING_FINANCE` | `createSampleRequest` | `POST /bussdev/sample-request` | — | — |
| 1.2 | BD | Upload bukti bayar biaya sampel | `uploadPaymentProof` | `PATCH /bussdev/sample-request/:id` | — | Client tidak bayar → stuck |
| 1.3 | Finance | Verifikasi pembayaran → stage jadi `QUEUE` | **G1: SAMPLE GATE** | `POST /finance/payment/verify` | `paymentApprovedAt` terisi | Bukti palsu → reject |
| 1.4 | R&D | Accept task → stage `FORMULATING` | `assignPic` + `createFormulaV1` | `POST /rnd/samples/:id/accept` | WAITING_FINANCE harus sudah verified | Bahan tidak tersedia → notify SCM |
| 1.5 | R&D | Racik formula + uji lab (LabTestResult) | `uploadFormula` + `createLabTest` | `POST /rnd/samples/:id/formula`, `POST /rnd/lab-test` | — | Formula gagal uji → reformulate |
| 1.6 | R&D | Set `READY_TO_SHIP` + input resi | `shipSample` | `POST /rnd/samples/:id/ship` | QC Parameter harus terisi | — |
| 1.7 | Client | Terima sampel → `RECEIVED` → `CLIENT_REVIEW` | auto (tracking number) | — | — | Klien tidak merespon > 14d → alert |
| 1.8 | BD | Input feedback klien | `createRevision` | `PATCH /rnd/samples/:id/revision` | — | Revisi > 3x → notifikasi Direktur |
| 1.9 | R&D | Revisi formula → loop ke 1.5 | — | — | — | — |
| 1.10 | BD | Set `SAMPLE_APPROVED` | `approveSample` | `POST /bussdev/approve-sample` | — | Klien tolak → `REJECTED` → back to negosiasi |

**Event**: `activity.logged` (BD, RND, FINANCE)

**Loop Condition**: Ulang step 1.5-1.9 jika `SampleStage != APPROVED` || `revisionCount < 3`

**Output**: `SampleStage.APPROVED` + `Formula.status = SAMPLE_LOCKED` + BOM final

---

## FASE 2: KOMITMEN PRODUKSI & EKSEKUSI PARALEL

| Step | Actor | Action | System Trigger | Endpoint | Gate | Exception |
|:---|:---|:---|:---|:---|:---:|:---|
| 2.1 | BD | Buat Sales Order (SO) status `PENDING_DP` | `createSalesOrder` | `POST /bussdev/sales-order` | Wajib refer SampleRequest | — |
| 2.2 | BD | Upload SPK + bukti DP ≥ 50% | `uploadDpProof` | `PATCH /bussdev/sales-order/:id` | — | DP kurang → sistem tolak |
| 2.3 | Finance | Verifikasi DP → SO jadi `LOCKED_ACTIVE` | **G2: PRODUCTION GATE** | `POST /finance/payment/verify` | `amount >= 50% totalAmount` | — |
| 2.4 | System | Trigger Triple Parallel otomatis | — | — | — | — |

**Event**: `activity.logged` (FINANCE — G2 opened)

---

### TRACK A — Legal & Compliance

| Step | Actor | Action | Endpoint | Gate | SLA |
|:---|:---|:---|:---|:---:|:---:|
| A.1 | Legal | Create RegulatoryPipeline (BPOM, HKI, HALAL) | `POST /legal/pipeline` | G2 must be OPEN | — |
| A.2 | Legal | Inisiasi HKI brand/logo di DJKI | `PATCH /legal/pipeline/:id/submit` | — | 14 hari |
| A.3 | Finance | Bayar PNBP (PNBPRequest) | `POST /finance/pnbp/pay` | — | 3 hari |
| A.4 | Legal | Submit BPOM notifikasi kosmetik | `PATCH /legal/pipeline/:id/submit` | Formula + LabTestResult harus ada | 30-90 hari (pemerintah) |
| A.5 | Legal | Set `PUBLISHED` saat NA terbit | `PATCH /legal/pipeline/:id/publish` | Input registrationNo | — |

**Interlock**: BPOM/HKI ditolak → `LEGAL_REJECT` → R&D revisi formulasi
**Event**: `activity.logged` (LEGAL, FINANCE — PNBP paid)

---

### TRACK B — Supply Chain & Material

| Step | Actor | Action | Endpoint | Gate | SLA |
|:---|:---|:---|:---|:---:|:---:|
| B.1 | System | Auto check BOM vs stok | — | G2 must be OPEN | — |
| B.2 | System | Create PurchaseRequest (PR) jika stok kurang | `POST /scm/purchase-orders` (via PR) | — | Otomatis |
| B.3 | SCM | Approve PR → Create PurchaseOrder (PO) | `POST /scm/purchase-orders` | — | 2 hari |
| B.4 | Finance | Validasi PO → approve payment terms | `POST /finance/ap-hub` | — | 1 hari |
| B.5 | Warehouse | Barang datang → WarehouseInbound | `POST /warehouse/inbounds` | — | — |
| B.6 | QC | QC Inbound → `QCAudit.status: GOOD` | `POST /warehouse/batches/:id/status` | — | 1 hari |
| B.7 | Warehouse | Pindah dari QUARANTINE → AVAILABLE | `POST /warehouse/batches/:id/status` | QC must be GOOD | — |

**Event**: `warehouse.inbound.received`, `warehouse.batch.status_changed`, `scm.inbound.qc_validated`, `activity.logged`
**Exception**: Stok tidak tersedia → `EscalationType.VENDOR_BLACKLIST_PO` + notify Direktur

---

### TRACK C — Creative & Packaging Design

| Step | Actor | Action | Endpoint | Gate | SLA |
|:---|:---|:---|:---|:---:|:---:|
| C.1 | Creative | Design Task masuk INBOX | `POST /creative/task` | G2 must be OPEN | — |
| C.2 | Creative | Buat artwork v1 → upload DesignVersion | `PATCH /creative/task/:id/version` | — | 5 hari |
| C.3 | Legal (APJ) | ArtworkReview → ACC/TOLAK | `PATCH /creative/task/:id/apj-review` | Cek klaim, INCI, BPOM | 2 hari |
| C.4 | Client | Review desain → ACC/REVISI | `PATCH /creative/task/:id/client-review` | — | 3 hari |
| C.5 | Creative | Lock design → status `LOCKED` | auto (via client-review ACC) | APJ + Client must approve | — |
| C.6 | System | Kirim print specs ke SCM (auto-create PO) | auto (via client-review ACC) | DesignTask.isFinal = true | — |

**Event**: `creative.task.created`, `creative.version.uploaded`, `creative.task.submitted`, `creative.task.apj_reviewed`, `creative.task.locked`, `creative.task.rejected`, `activity.logged` (CREATIVE, LEGAL)
**Exception**: Revisi > 3x → notifikasi Direktur (task auto-locked)

---

### TRACK D — Warehouse Capacity Check

| Step | Actor | Action | Endpoint | Gate |
|:---|:---|:---|:---|:---:|
| D.1 | System | Check kapasitas gudang | `GET /warehouse/check-thresholds` | G2 must be OPEN |
| D.2 | System | Warning jika utility > 75%, CRITICAL jika > 90% | `GET /warehouse/stats` | — |

**Event**: — (read-only check)

---

### MERGE GATE — Readiness Check

| Step | Condition | Action | Endpoint |
|:---|:---|---:|:---|
| Merge | Legal.PUBLISHED AND Creative.LOCKED AND SCM.READY | SO → `READY_TO_PRODUCE` | `PATCH /bussdev/sales-order/:id` |

---

## FASE 3: EKSEKUSI LANTAI PABRIK

| Step | Actor | Action | Endpoint | Gate / Interlock | Exception |
|:---|:---|:---|:---|:---:|:---|
| 3.1 | PPIC | Create WorkOrder (target qty, target completion) | `POST /production-plans` | SO must be `READY_TO_PRODUCE` | — |
| 3.2 | PPIC | Create ProductionSchedule (machine, operator) | `POST /production/schedules` | — | Machine breakdown → reschedule |
| 3.3 | PPIC | Create Batch Record → pull data: Formula(R&D) + WorkOrder + Design(Creative) + QC Parameters | `GET /production/plans` | All interlock MUST be TRUE | Data tidak lengkap → reject |
| 3.4 | Warehouse | Issue material via MaterialRequisition | `POST /warehouse/release/:workOrderId` | Stock must be AVAILABLE | Stock shortage → Escalation |
| 3.5 | Production | **BATCHING**: timbang bahan sesuai BOM | `PATCH /production/schedules/:id/actuals` | **Gate: Atomic Phase** (wajib urut) | Weight deviasi > 0.5% → butuh PIN Supervisor |
| 3.6 | Production | **MIXING**: campur bahan → ProductionLog | `PATCH /production/schedules/:id/result` | — | — |
| 3.7 | QC | **QC Bulk**: uji pH, viskositas, organoleptik | `POST /qc/audits` | **Gate: QC Bulk Gate** | FAIL → RejectExecution + COPQRecord |
| 3.8 | Production | **FILLING**: isi ke kemasan primer | `PATCH /production/schedules/:id/result` | QC Bulk must be `RELEASED` | **Interlock: production.qc_interlock_triggered** |
| 3.9 | QC | **QC Filling**: cek volume, sealing, kebocoran | `POST /qc/audits` | — | FAIL → rework/reject |
| 3.10 | Production | **PACKING**: kemas ke kardus + label | `PATCH /production/schedules/:id/result` | Design must be `LOCKED`, NA must exist | — |
| 3.11 | QC | **QC Final**: sampling berat, inkjet, barcode | `POST /qc/audits` | **Gate: Final Packing Validation** | Deviasi > 1% → auto REJECT |
| 3.12 | Warehouse | FinishedGood → MaterialInventory (status `QUARANTINE`) | `POST /warehouse/inbounds` | QC Final must be `GOOD` | — |
| 3.13 | System | Auto hitung COPQ + kirim ke Finance | auto | — | — |
| 3.14 | Production | Return sisa bahan → MaterialReturn | event `production.material.returned` | — | — |

**Event Chain**:
- Step 3.4 → `warehouse.material.released` + `production.material.issued`
- Step 3.7 → `production.qc_verified` + `qc.audit.created`
- Step 3.8 gate block → `production.qc_interlock_triggered`
- Step 3.5 gate block → `production.qc_gate_blocked` (material QC check)
- Step 3.14 → `warehouse.material.returned` event → stock increment

**Rework Loop**: Jika QC HOLD → Production rework → QC ulang

---

## FASE 4: TERMINASI & PENGIRIMAN

| Step | Actor | Action | Endpoint | Gate | Exception |
|:---|:---|:---|:---|:---:|:---|
| 4.1 | BD | Tagih pelunasan ke klien | — | — | — |
| 4.2 | Finance | Terbitkan Invoice FINAL_PAYMENT | `POST /finance/journal` | — | — |
| 4.3 | Client | Bayar sisa tagihan | — | — | Tidak bayar → Aging AR → Escalation |
| 4.4 | Finance | Verifikasi pelunasan → Invoice `PAID` | `POST /finance/payment/verify` | **G3: DELIVERY GATE** | — |
| 4.5 | Warehouse | Cetak DeliveryOrder | `POST /warehouse/release/:workOrderId` | G3 must be OPEN | — |
| 4.6 | Logistics | Create Shipment + input tracking | — | DO printed | — |
| 4.7 | System | SO → `COMPLETED`, Lead → `WON_DEAL` | auto | Shipment status = SHIPPED | — |

**Event**: `activity.logged` (FINANCE — G3 opened)

---

## FASE 5: AFTER-SALES & RETENSI

| Step | Actor | Action | Trigger | Exception |
|:---|:---|:---|:---:|:---|
| 5.1 | System | RetentionEngine aktif → hitung est. depletion date | `WON_DEAL` + qty data | — |
| 5.2 | System | Notifikasi H-14: "Klien siap re-order" | estDepletionDate approach | — |
| 5.3 | BD | Follow up repeat order | RetentionStatus = NOTIFIED | Churn → `CHURNED` |
| 5.4 | BD | Create repeat SO (referensi formula lama) | `POST /bussdev/sales-order` | — |

**Exception Flow — Sales Return**:
- Jika klien komplain → BD create `SalesReturn` → WH receive barang → QC check → Finance adjust invoice

---

## COMMUNICATION PROTOCOL: COMPLETE EVENT BUS

### Master Event Chain per Fase

| Fase | Trigger Event | Emitter | Listener | Effect |
|:---|:---|:---|:---|:---|
| **F0** | `marketing.ads.created` | Marketing | BD dashboard | New lead data |
| **F1** | `activity.logged` (BD sample req) | BussDev | R&D inbox | Sample task appears |
| **F1→F2** | G1: Finance verify payment | Finance | R&D | Formula task unlocked |
| **F2** | G2: Finance verify DP | Finance | ALL | 4 tracks trigger parallel |
| **F2A** | `activity.logged` (Legal submit) | Legal | Finance | PNBP payment request |
| **F2C** | `creative.task.created` | Creative | Kanban board | Design task appears |
| **F2C** | `creative.task.submitted` | Creative | Legal (APJ) | Artwork review needed |
| **F2C** | `creative.task.apj_reviewed` | Legal | Creative | Design state change |
| **F2C** | `creative.task.locked` | Creative | SCM + BD | Auto-create PO + readiness check |
| **F2B** | `warehouse.inbound.received` | Warehouse | SCM | PO fulfillment update |
| **F2B** | `scm.inbound.qc_validated` | SCM/Inbound | Warehouse | Batch release from quarantine |
| **F2B** | `warehouse.batch.status_changed` | Warehouse | Production | Material available notification |
| **F3** | `warehouse.material.released` | Warehouse | Production | Material ready at line |
| **F3.5** | `production.qc_gate_blocked` | Production | QC dashboard | Material QC fail alert |
| **F3.7** | `production.qc_verified` | Production | QC dashboard | QC audit created |
| **F3.8** | `production.qc_interlock_triggered` | Production | QC dashboard + terminal | Filling blocked without QC |
| **F3** | `production.schedule_completed` | Production | Warehouse | Stock deduction trigger |
| **F3** | `production.material.issued` | Production | Inventory sync | Stock decremented |
| **F3** | `production.material.shortage` | Production | SCM | Procurement escalation |
| **F3** | `production.material.returned` | Production | Warehouse | Stock increment |
| **F3** | `qc.audit.created` | QC Audit | Activity feed | Quality record |
| **F3** | `warehouse.opname.created` | Warehouse | Finance | Approval workflow |
| **F3** | `warehouse.opname.approved` | Warehouse | Finance | Journal entry |
| **F3** | `warehouse.adjustment.created` | Warehouse | Approval workflow | Adjustment request |
| **F3** | `warehouse.adjustment.approved` | Warehouse | Finance + inventory | Stock adjustment applied |
| **F4** | `warehouse.material.released` (DO) | Warehouse | Logistics | Delivery order printed |
| **F4** | G3: Finance verify payment | Finance | Warehouse | DO gate unlocked |
| **F0-F5** | `activity.logged` (ALL) | ALL | Activity stream | Universal audit trail |

---

## INTERLOCK MATRIX (Gate Dependencies + Events)

| Gate Dibuka | BD | R&D | SCM | Legal | Creative | Prod | WH | QC | Event Emitted |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|
| **G1 (Sample Paid)** | ✅ | ✅ Formula | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `activity.logged` |
| **G2 (DP Paid)** | ✅ | ✅ | ✅ PR/PO | ✅ Register | ✅ Design | ✅ Plan | ✅ Check | ❌ | `activity.logged` |
| **G3 (Paid Off)** | ✅ Won | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Ship | ✅ | `activity.logged` |
| **QC Bulk Release** | — | — | — | — | — | ✅ Fill | — | — | `production.qc_verified` |
| **Design LOCKED** | — | — | ✅ PO | ✅ | — | ✅ Pack | — | — | `creative.task.locked` |
| **Material GOOD** | — | — | — | — | — | ✅ Batch | ✅ Issue | — | `warehouse.batch.status_changed` |

---

## RACI MATRIX (Responsible, Accountable, Consulted, Informed)

| Aktivitas | BD | R&D | SCM | Finance | Legal | Creative | QC | Prod | WH | Marketing |
|:---|---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lead Acquisition | **RA** | — | — | — | — | — | — | — | — | C |
| Ads Input | C | — | — | I | — | — | — | — | — | **RA** |
| Sample Request | **RA** | C | — | I | — | — | — | — | — | — |
| Gate 1 Verification | I | I | — | **RA** | — | — | — | — | — | — |
| Formulation | I | **RA** | C | — | I | — | — | — | — | — |
| Sample Approval | **RA** | C | — | — | — | — | — | — | — | — |
| SO Creation | **RA** | — | I | I | — | — | — | — | — | — |
| Gate 2 Verification | I | — | I | **RA** | — | — | — | — | I | — |
| BPOM Registration | I | C | — | I | **RA** | — | — | — | — | — |
| Artwork Design | I | — | I | — | C | **RA** | — | — | — | — |
| Artwork Review (APJ) | — | — | I | — | **RA** | C | — | — | — | — |
| Procurement | — | — | **RA** | I | — | — | — | I | C | — |
| Inbound Receiving | — | — | I | — | — | — | I | — | **RA** | — |
| QC Inbound | — | — | I | — | — | — | **RA** | — | I | — |
| Batch Record | — | C | — | — | — | C | — | **RA** | — | — |
| Mixing | — | C | — | — | — | — | I | **RA** | I | — |
| QC Inspection | — | C | — | — | — | — | **RA** | I | I | — |
| Stock Opname | — | — | I | — | — | — | — | — | **RA** | — |
| Stock Adjustment | — | — | I | I | — | — | — | — | **RA** | — |
| Gate 3 Verification | I | — | — | **RA** | — | — | — | — | I | — |
| Delivery/Shipment | I | — | — | — | — | — | — | — | **RA** | — |
| Marketing Analytics | I | — | — | I | — | I | — | — | — | **RA** |
| Retention | **RA** | — | — | — | — | — | — | — | — | I |

---

## SLA BENCHMARKS (Target Waktu)

| Aktivitas | Target SLA | Warning | Critical | Endpoint / Check |
|:---|---:|---:|---:|---|
| First follow-up lead | < 24 jam | > 24 jam | > 48 jam | `GET /bussdev/lead/:id/activities` |
| Sample formulation | 5 hari | > 7 hari | > 14 hari | `GET /rnd/samples` |
| Sample revision cycle | 3 hari | > 5 hari | > 7 hari | `PATCH /rnd/samples/:id/revision` |
| BPOM registration | 90 hari | > 90 hari | > 120 hari | `GET /legal/pipeline` |
| Artwork design | 5 hari | > 7 hari | > 14 hari | `GET /creative/tasks` (SLA countdown) |
| Procurement (domestic) | 14 hari | > 21 hari | > 30 hari | `GET /scm/purchase-orders` |
| Production cycle | 7 hari | > 10 hari | > 14 hari | `GET /production/dashboard` |
| QC hold time | 1 hari | > 2 hari | > 3 hari | `GET /warehouse/check-thresholds` |
| Payment verification | 1 hari | > 2 hari | > 3 hari | `POST /finance/payment/verify` |
| Stock opname settlement | 3 hari | > 5 hari | > 7 hari | `GET /warehouse/opname` |
| Hold SLA (material) | 72 jam | > 72 jam | > 96 jam | `GET /warehouse/check-thresholds` |

---

## EXCEPTION HANDLING SUMMARY

| Skenario | Action | Autoritas | Audit Trail |
|:---|---:|---:|---:|
| Sample reject | Back to NEGOTIATION | BD | `SampleStageLog` |
| Formula gagal QC | Re-lab, reformulate | R&D | `LabTestResult` |
| BPOM ditolak | Revisi dokumen, re-submit | Legal | `LegalTimelineLog` |
| Stock shortage | Auto PR + Escalation ke Direktur | System | `EscalationType.VENDOR_BLACKLIST_PO` |
| QC fail | RejectExecution + COPQRecord | QC + Supervisor | `COPQRecord` |
| Client tidak bayar | Aging report → Collection → Escalation | Finance + BD | Aging report |
| Machine breakdown | Reschedule, reassign | PPIC | `ProductionLog` |
| Design reject client | Revision loop (max 3x, then auto-lock) | Creative + BD | `DesignFeedback` |
| Design over-limit | Director override unlock | DIRECTOR | `creative.task.unlocked` event |
| FEFO violation | PIN Supervisor override | WAREHOUSE | `FEFO_Violation` audit log |
| Weight tolerance breach | PIN Supervisor bypass | PRODUCTION + Supervisor | `AuditEscalation` |
| QC gate bypass (filling) | Interlock blocking → system halt | System | `production.qc_interlock_triggered` |
| Material QC fail | Batch blocked → alternative batch | System | `production.qc_gate_blocked` |
| Emergency override | SystemOverrideLog + PIN SUPER_ADMIN | SUPER_ADMIN | Permanen audit log |

---

## ROADMAP PENGEMBANGAN

1. **Integrasi Notifikasi**: Setiap Gate trigger push notification ke PIC terkait (via SSE already: `/events/*`)
2. **Automasi Batch Record PDF**: Generate dokumen Batch Record dari data Formula + WorkOrder + Design
3. **Supplier Portal**: Akses terbatas vendor untuk update status pengiriman
4. **CAPA (Corrective & Preventive Action)**: Form digital untuk root cause analysis
5. **AI Formula Shield**: Validasi otomatis INCI vs MasterInci database
6. **Dashboard Eksekutif Real-time**: OEE, COPQ, Revenue Pipeline, Cashflow
7. **Multi-Warehouse Support**: Perluas dari single warehouse ke multi-location
8. **Retention Engine**: Auto-calculate depletion date + reorder notification
9. **SSE Event Enrichment**: Tambah SSE stream untuk warehouse, marketing, finance

---

## FILE REFERENCE COMPLETE

| Dokumen | Path |
|---------|------|
| Glossary & State Machine | `docs/CANONICAL_GLOSSARY.md` |
| BD Source of Truth | `docs/SOT_BUSSDEV.md` |
| Creative Source of Truth | `docs/SOT_CREATIVE.md` |
| DigiMar Source of Truth | `docs/SOT_DIGIMAR.md` |
| Finance Source of Truth | `docs/SOT_FINANCE.md` |
| Legal Source of Truth | `docs/SOT_LEGAL.md` |
| Production Source of Truth | `docs/SOT_PRODUCTION.md` |
| QC Source of Truth | `docs/SOT_QC.md` |
| R&D Source of Truth | `docs/SOT_RND.md` |
| SCM Source of Truth | `docs/SOT_SCM.md` |
| Warehouse Source of Truth | `docs/SOT_WAREHOUSE.md` |
| This Blueprint | `docs/general docs/05_master_business_process_blueprint.md` |
