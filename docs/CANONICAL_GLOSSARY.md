# Canonical Glossary & State Machine (Single Source of Truth)
**Version**: 3.0 — Dokumen ini adalah referensi TUNGGAL untuk semua status, terminologi, state transition, dan communication protocol di seluruh ERP. Seluruh SOT dan dokumen lain WAJIB merujuk ke sini.

---

## 1. STANDARDISASI TERMINOLOGI

### 1.1 Nama Divisi (wajib seragam)

| Canonical Name | Alias Terlarang | Enum `Division` |
|:---|---:|:---|
| **Business Development (BD)** | BussDev, Sales | `BD` |
| **Research & Development (R&D)** | RnD, Research | `RND` |
| **Supply Chain Management (SCM)** | Purchasing, Procurement | `SCM` |
| **Finance & Accounting** | Finance, Accounting | `FINANCE` |
| **Legal & Compliance** | APJ, Legality, Compliance | `LEGAL` |
| **Creative Hub** | Designer, Creative | `CREATIVE` |
| **Quality Control (QC)** | Quality, Lab | `QC` |
| **Warehouse & Inventory** | Gudang, Warehouse | `WAREHOUSE` |
| **Production** | Manufacturing, Plant | `PRODUCTION` |
| **Human Resources (HR)** | HRD, Personnel | `HR` |
| **Digital Marketing** | Digimar, Marketing | `MARKETING` |
| **Management / Director** | Direksi, Executive | `MANAGEMENT` |

### 1.2 Nama Role (dari `UserRole` enum)

| Role | Deskripsi |
|:---|:---|
| `SUPER_ADMIN` | Akses penuh sistem |
| `HEAD_OPS` | Kepala operasional |
| `COMMERCIAL` | Staff komersial (pricing, kontrak) |
| `DIGIMAR` | Digital marketing |
| `RND` | Formulator R&D |
| `COMPLIANCE` | Staff legal/compliance |
| `FINANCE` | Finance officer |
| `PURCHASING` | Pembelian (bagian dari SCM) |
| `PPIC` | Production Planning & Inventory Control |
| `WAREHOUSE` | Staff gudang |
| `PRODUCTION_OP` | Operator produksi |
| `QC_LAB` | Lab QC |
| `HR` | HR staff |
| `IT_SYS` | IT/system |
| `ADMIN` | Admin umum |
| `SCM` | Supply Chain Manager |
| `PRODUCTION` | Manager produksi |
| `MARKETING` | Staff marketing |
| `APJ` | Apoteker Penanggung Jawab (Legal) |
| `DIRECTOR` | Direktur |

### 1.3 Standard Naming Convention

| Konsep | Nama Canonical | Bukan |
|:---|---:|---|
| Form produk baru | **NPF** (NewProductForm) | PNF |
| Dokumen pesanan penjualan | **Sales Order (SO)** | SPK, Invoice |
| Dokumen pesanan pembelian | **Purchase Order (PO)** | Nota Beli |
| Formulasi produk | **Formula** (bukan BOM) | Recipe, Resep |
| Daftar bahan | **Bill of Materials (BOM)** | Material List |
| Pengiriman ke klien | **Shipment** (via SO) | Surat Jalan |
| Dokumen pengiriman internal | **DeliveryOrder (DO)** | Surat Jalan |
| Permintaan pembelian | **Purchase Request (PR)** | Purchase Requisition |
| Penerimaan barang | **Warehouse Inbound** | GRN, Receiving Note |
| Sampel produk | **SampleRequest** | Sample, Contoh |
| Desain kemasan | **DesignTask** | Artwork Task |
| Pendaftaran legal | **RegulatoryPipeline** | Izin, Registrasi |

---

## 2. CANONICAL STATE MACHINE — CORPORATE LIFECYCLE

### 2.1 SalesLead (Prospek Klien)

```
NEW_LEAD → CONTACTED → FOLLOW_UP_1 → FOLLOW_UP_2 → FOLLOW_UP_3
    ↓                                                        ↓
    ↓ (sample needed)                                  NEGOTIATION
    ↓                                                        ↓
SAMPLE_REQUESTED ←──────────────────────────────────── (if sample)
    ↓
SAMPLE_SENT → (revision loop) → SAMPLE_APPROVED
    ↓
SPK_SIGNED → WAITING_FINANCE_APPROVAL → DP_PAID → PRODUCTION_PLAN
    ↓                                                        ↓
READY_TO_SHIP → WON_DEAL
    ↓
LOST (any stage) / ABORTED
```

### 2.2 SampleRequest (Development Sampel)

```
WAITING_FINANCE → QUEUE → FORMULATING → LAB_TEST → READY_TO_SHIP
    ↓                                                        ↓
SHIPPED → RECEIVED → CLIENT_REVIEW → (revision loop) → APPROVED
    ↓                                                        ↓
REJECTED / CANCELLED (any stage) ←──────────────────────┘
```

### 2.3 Formula (Formulasi)

```
DRAFT → WAITING_APPROVAL → SAMPLE_LOCKED → MINOR_COMPLIANCE_FIX
    ↓                                               ↓
PRODUCTION_LOCKED → (archived if superseded)    BPOM_REGISTRATION_PROCESS
    ↓
REVISION_REQUIRED → (back to DRAFT) / SUPERSEDED → ARCHIVED
```

### 2.4 SalesOrder (Pesanan Penjualan)

```
PENDING_DP → ACTIVE → LOCKED_ACTIVE → READY_TO_PRODUCE → COMPLETED
    ↓                                                        ↓
CANCELLED (any stage) ←──────────────────────────────────┘
```

### 2.5 ProductionPlan (Batch Produksi)

```
PLANNING → WAITING_MATERIAL → WAITING_PROCUREMENT → READY_TO_PRODUCE
    ↓
MIXING → FILLING → PACKING → PENDING_QC → QC_HOLD → (rework loop)
    ↓                                                        ↓
REWORK → (back to stage)                               FINISHED_GOODS
    ↓                                                        ↓
DONE → DELIVERED → CLOSED / CANCELLED
```

### 2.6 RegulatoryPipeline (Legal/BPOM/HKI/Halal)

```
DRAFT → SUBMITTED → EVALUATION → REVISION → PUBLISHED
```

### 2.7 DesignTask (Desain Kemasan)

```
INBOX → IN_PROGRESS → WAITING_APJ → WAITING_CLIENT → REVISION → LOCKED
```

### 2.8 Invoice (Penagihan)

```
UNPAID → PARTIAL → PAID
```

---

## 3. FINANCIAL GATES — THE 3 MASTER LOCKS

| Gate | Nama | From → To | Syarat | PIC Verify |
|:---|:---|---:|---:|---:|
| **G1** | Sample Gate | `WAITING_FINANCE` → `QUEUE` | Upload Bukti Bayar Sampel | Finance |
| **G2** | Production Gate | `SPK_SIGNED` → `LOCKED_ACTIVE` | DP ≥ 50% Masuk Rekening | Finance |
| **G3** | Delivery Gate | `READY_TO_SHIP` → `WON_DEAL` | Pelunasan 100% | Finance |

---

## 4. INTERLOCK MATRIX (Gate Dependencies)

Setiap gate membuka akses divisi lain:

| Gate Dibuka | BD | R&D | SCM | Legal | Creative | Prod | WH | QC |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **G1 (Sample Paid)** | ✅ | ✅ Formulate | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **G2 (DP Paid)** | ✅ | ✅ | ✅ PR/PO | ✅ Register | ✅ Design | ✅ Plan | ✅ Check | ❌ |
| **G3 (Paid Off)** | ✅ Won | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Ship | ✅ |

---

## 5. ALUR DOKUMEN (Document Flow Chain)

```
[Marketing] DailyAdsMetric
    ↓ Lead Data
[BD] SalesLead → NewProductForm (NPF)
    ↓ Sample Request
[R&D] SampleRequest → Formula → BillOfMaterial
    ↓ Formula Locked + NPF
[BD] SalesOrder (SO)
    ↓ DP Paid (G2)
[SCM] PurchaseRequest (PR) → PurchaseOrder (PO)
    ↓ Goods Arrive
[WH] WarehouseInbound → [QC] QCAudit (Inbound)
    ↓ Materials Ready
[Production] ProductionPlan → WorkOrder
    ↓ Materials Issued
[WH] MaterialRequisition → RequisitionFulfillment
    ↓ Production Runs
[Production] ProductionLog → ProductionStepLog → [QC] QCAudit (Bulk/Final)
    ↓ Finished Goods
[WH] FinishedGood → MaterialInventory (QUARANTINE → GOOD)
    ↓ Paid Off (G3)
[BD] Shipment → [WH] DeliveryOrder
    ↓ Complete
[BD] SalesLead → WON_DEAL
```

---

## 6. KPI CANONICAL DEFINITIONS

| KPI | Formula | Data Source | Owner |
|:---|:---|---:|---:|
| Lead-to-Sample Rate | `SAMPLE_REQUESTED` / `NEW_LEAD` | SalesLead | BD |
| Sample-to-Deal Rate | `WON_DEAL` / `SAMPLE_APPROVED` | SalesLead | BD |
| First-Time Approval | Formula approved V1 without revision | SampleRevision | R&D |
| On-Time Delivery | Orders shipped before due date | SalesOrder.dueDate vs Shipment.shippedAt | Production |
| FTY (First Time Yield) | Batch passed QC on first try | ProductionPlan.isFirstPass | QC |
| OEE | Availability × Performance × Quality | Machine + ProductionLog | Production |
| Inventory Turnover | COGS / Avg Inventory Value | InventoryTransaction | Warehouse |
| AR Aging | Days since Invoice.issuedAt without full payment | Invoice | Finance |
| COPQ | Sum of reject qty × unit cost | COPQRecord | QC/Finance |
| ROAS | Revenue from leads / Total Ad Spend | SalesOrder vs DailyAdsMetric | Marketing |

---

## 7. EXCEPTION HANDLING CANONICAL PATTERNS

| Skenario | Status | Action | Audit Trail |
|:---|---:|---:|---:|
| Sample reject | `SampleStage.REJECTED` | BD must input reason → back to negotiation | `SampleStageLog` |
| QC fail | `QCAudit.status: REJECT` | Auto create `RejectExecution` | `COPQRecord` |
| Stuck > SLA | `ActivityStream.isCritical: true` | Notify Director | `ActivityStream` |
| Stock shortage | `RequisitionStatus.SHORTAGE` | Auto-create PR with priority HIGH | `EscalationType.VENDOR_BLACKLIST_PO` |
| Payment overdue | `InvoiceStatus.UNPAID > 30d` | Notify BD + Finance | Aging report |
| Emergency bypass | `SystemOverrideLog` | Requires SUPER_ADMIN PIN | Permanent audit log |

---

## 8. COMMUNICATION PROTOCOL (EVENT BUS)

Semua komunikasi antar modul menggunakan `EventEmitter2` (NestJS). Setiap event mengikuti pola dual-emission: **domain-specific event** + **activity.logged** (generic audit trail).

### 8.1. Canonic Event Pattern

```typescript
// Domain-specific event — untuk cross-module integration
this.eventEmitter.emit('{module}.{action}', { ...payload });

// Generic audit trail — untuk activity feed di semua dashboard
this.eventEmitter.emit('activity.logged', {
  senderDivision: '{DIVISION_ENUM}',
  notes: 'Human-readable description',
  loggedBy: '{userId}|SYSTEM:{DIVISION}',
});
```

### 8.2. Master Event Registry

| Domain Event | Emitter Module | Trigger | Listener(s) |
|:---|---:|---:|---|
| `production.schedule_completed` | Production | Schedule result submitted | Warehouse → stock deduction |
| `production.qc_verified` | Production | QC Bulk/Final verified | QC dashboard |
| `production.material.issued` | Production | Material requisition issued | Warehouse inventory sync |
| `production.material.shortage` | Production | Shortage flagged | SCM procurement trigger |
| `production.material.returned` | Production | Excess material returned | Warehouse stock increment |
| `production.qc_interlock_triggered` | Production | QC gate blocked filling | QC dashboard |
| `production.qc_gate_blocked` | Production | Material QC not GOOD | QC dashboard |
| `scm.inbound.qc_validated` | SCM/Inbound | Inbound QC validated | Warehouse release |
| `qc.audit.created` | QC Audit | New QCAudit created | QC dashboard, activity feed |
| `qc.notification` | QC Events | QC notification bus | SSE `/events/qc` |
| `warehouse.opname.approved` | Warehouse | Stock opname approved | Finance journaling |
| `warehouse.material.released` | Warehouse | Material released to production | Production material ready |
| `warehouse.material.issued` | Warehouse | Material issued (cross-module) | Production, Inventory sync |
| `warehouse.batch.status_changed` | Warehouse | Batch QC status updated | Inventory availability |
| `warehouse.transfer.created` | Warehouse | Transfer order created | Destination WH notification |
| `warehouse.transfer.executed` | Warehouse | Transfer completed | Both warehouses stock sync |
| `warehouse.inbound.received` | Warehouse | Goods receipt created | SCM PO fulfillment |
| `warehouse.stock.adjusted` | Warehouse | Stock adjustment approved | Finance journaling |
| `warehouse.adjustment.created` | Warehouse | Adjustment requested | Approval workflow |
| `warehouse.adjustment.approved` | Warehouse | Adjustment approved | Inventory transaction logged |
| `warehouse.opname.created` | Warehouse | Opname session created | Approval workflow |
| `creative.update` | Creative | Any design state change | SSE `/events/creative` |
| `creative.task.created` | Creative | New design task created | Board refresh |
| `creative.version.uploaded` | Creative | New artwork version | Version history |
| `creative.task.submitted` | Creative | Submitted to APJ | Legal notification |
| `creative.task.apj_reviewed` | Creative | APJ reviewed design | Design state change |
| `creative.task.locked` | Creative | Client approved — LOCKED | SCM PO auto-creation |
| `creative.task.rejected` | Creative | Client rejected design | Revision cycle |
| `creative.task.unlocked` | Creative | BusDev override unlock | Board refresh |
| `marketing.ads.created` | Marketing | Daily ads metric recorded | Dashboard refresh |
| `marketing.ads.audited` | Marketing | Finance audited ads | Audit log |
| `marketing.ads.updated` | Marketing | Ads metric updated | Log refresh |
| `marketing.ads.deleted` | Marketing | Ads metric deleted | Log refresh |
| `marketing.organic.created` | Marketing | Weekly organic logged | Dashboard refresh |
| `marketing.organic.updated` | Marketing | Organic log updated | Log refresh |
| `marketing.organic.deleted` | Marketing | Organic log deleted | Log refresh |
| `marketing.content.created` | Marketing | Content asset created | Content library |
| `marketing.targets.set` | Marketing | Monthly targets set | KPI dashboard |

### 8.3. SSE (Server-Sent Events) Streams

| SSE Endpoint | Event Filter | Frontend Consumer |
|:---|---:|---|
| `/events/busdev` | `production.update` | Production dashboard |
| `/events/qc` | `qc.notification` | QC dashboard |
| `/events/maintenance` | `machine.error` | Maintenance alerts |
| `/events/creative` | `creative.update` | Creative Kanban board |

### 8.4. Activity Feed Convention

Semua event `activity.logged` menggunakan format:

```typescript
{
  senderDivision: 'BD' | 'RND' | 'SCM' | 'FINANCE' | 'LEGAL' | 'CREATIVE' | 'QC' | 'WAREHOUSE' | 'PRODUCTION' | 'MARKETING' | 'MANAGEMENT',
  notes: string,                     // Human-readable, max 200 chars
  loggedBy: string,                  // User ID or 'SYSTEM:{DIVISION}'
  // Opsional fields:
  action?: string,                   // e.g. 'MATERIAL_RELEASED', 'OPNAME_CREATED'
  entityType?: string,               // e.g. 'StockAdjustment', 'QCAudit'
  entityId?: string,                 // UUID of the affected entity
  detail?: string,                   // Additional context
}
```

---

## 9. API ROUTE NAMING CONVENTION

| Pattern | Contoh | Keterangan |
|:---|---:|---|
| `/{module}` | `/warehouse` | Base path per modul |
| `/{module}/{action}` | `/warehouse/stats` | Action spesifik |
| `/{module}/:id/{action}` | `/warehouse/opname/:id/approve-pin` | Action pada resource spesifik |
| `/{module}/logs/{sub}` | `/marketing/logs/ads` | Log endpoints |
| `/master/{entity}` | `/master/materials` | Master data (via RouteAliasController) |
| `/production-plans` | `/production-plans` | Cross-module entity (production-planning) |
| `/production/requisitions` | `/production/requisitions` | Sub-entity production |
| `/events/{stream}` | `/events/creative` | SSE streams |

---
