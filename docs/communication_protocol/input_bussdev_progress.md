# Input/Output Protocol: BD Progress Tracking
**Version**: 2.0 — Sinkron dengan CANONICAL_GLOSSARY.md v2.0
**Format**: Setiap status change harus di-log ke `ActivityStream` dan `LeadTimelineLog`.

---

## FASE 1: PENDEKATAN & KESEPAKATAN AWAL

### 1. NEW LEAD
- **Kondisi**: Prospek mentah masuk dari DigiMar / manual input
- **Input BD**: Form "Log Follow Up" — catat hasil obrolan, kategori produk, estimasi MOQ
- **System Output**: `SalesLead.status = NEW_LEAD`, `LeadTimelineLog` created

### 2. CONTACTED
- **Kondisi**: Prospek sudah merespons
- **Input BD**: Upload Quotation (file PDF penawaran harga)
- **System Output**: `SalesLead.status = CONTACTED`

### 3. NEGOTIATION
- **Kondisi**: Klien sedang tawar harga / bahas spesifikasi
- **Input BD**: Update NPF dengan catatan feedback klien
- **System Output**: `SalesLead.status = NEGOTIATION`

---

## FASE 2: LABORATORIUM (Iterasi Sampel)

### 4. SAMPLE REQUEST
- **Kondisi**: Klien setuju buat sampel berbayar
- **Input BD**: Buat SampleRequest + Upload NPF & Bukti Bayar Sampel
- **System Output**: `SampleStage = WAITING_FINANCE`, notifikasi ke Finance

### 5. SAMPLE VERIFICATION (oleh Finance)
- **Kondisi**: Finance validasi pembayaran
- **Input Finance**: Klik "Verify" di AR Hub
- **System Output**: `SampleStage = QUEUE`, gembok R&D terbuka

### 6. SAMPLE REVISION (Loop)
- **Kondisi**: R&D kirim sampel, klien feedback
- **Input BD**: Form "Catatan Revisi" — input ekspektasi revisi
- **System Output**: `SampleStage` tetap, `revisionCount` +1, R&D dapat notifikasi

### 7. SAMPLE APPROVED
- **Kondisi**: Klien setuju sampel final
- **Input BD**: Klik "Kunci Formula"
- **System Output**: `Formula.status = SAMPLE_LOCKED`, `SampleStage = APPROVED`

### 8. SAMPLE REJECTED
- **Kondisi**: Klien tolak sampel final
- **Input BD**: Input alasan penolakan
- **System Output**: `SampleStage = REJECTED`, lead back ke `NEGOTIATION`

---

## FASE 3: KOMITMEN FINANSIAL & LEGALITAS

### 9. SPK SIGNED
- **Kondisi**: Klien siap produksi massal
- **Input BD**: Upload SPK + Sales Order (SO) status `PENDING_DP`
- **System Output**: `SalesLead.status = SPK_SIGNED`

### 10. DP PAID
- **Kondisi**: Klien transfer DP ≥ 50%
- **Input BD**: Upload bukti transfer DP
- **System Output**: `LeadActivity` tipe `DOWN_PAYMENT`

### 11. G2 VERIFIED (oleh Finance)
- **Kondisi**: Finance validasi DP
- **Input Finance**: Klik "Verify DP" di AR Hub
- **System Output**: 
  - `SO.status = LOCKED_ACTIVE`
  - `SalesLead.status = DP_PAID`
  - **Auto-trigger**:
    - Legal → RegulatoryPipeline (BPOM/HKI)
    - SCM → Auto PR jika stok kurang
    - Creative → DesignTask (INBOX)
    - Warehouse → Capacity check

### 12. TRACK LEGALITAS (oleh APJ/Legal)
- **Kondisi**: Setelah G2 terbuka
- **Input Legal**: Progress HKI & BPOM di RegulatoryPipeline
- **Output**: Nomor NA terbit → `RegStage.PUBLISHED`

### 13. TRACK DESAIN (oleh Creative)
- **Kondisi**: Setelah G2 terbuka
- **Input Creative**: Upload artwork, mockup
- **Output**: `DesignTask.status = LOCKED`

### 14. TRACK MATERIAL (oleh SCM)
- **Kondisi**: Setelah G2 terbuka
- **Input SCM**: PR → PO → Inbound → QC Inbound
- **Output**: `StockStatus.READY`

### 15. READY TO PRODUCE (Otomatis)
- **Kondisi**: Legal.PUBLISHED + Creative.LOCKED + SCM.READY
- **System**: SO.status → `READY_TO_PRODUCE`

---

## FASE 4: MANUFAKTUR & PENYELESAIAN

### 16. PRODUCTION PROCESS
- **Kondisi**: Semua prasyarat lengkap
- **Input BD**: **Tidak ada** — BD hanya monitor Activity Stream
- **Eksekutor**: PPIC → WorkOrder, ProductionSchedule; Production → Mixing→Filling→Packing

### 17. READY TO SHIP
- **Kondisi**: QC Final PASS, FG di gudang karantina
- **Input BD**: Tagih sisa tagihan ke klien
- **System Output**: Notifikasi pelunasan ke Finance

### 18. G3 VERIFIED (oleh Finance)
- **Kondisi**: Pelunasan masuk
- **Input Finance**: Klik "Verify Final Payment"
- **System Output**: Invoice → `PAID`, gembok DO terbuka

### 19. SHIPMENT
- **Kondisi**: Pelunasan terverifikasi
- **Input WH**: Cetak DO, input ekspedisi, klik "Barang Terkirim"
- **System Output**: `Shipment.status = SHIPPED`

### 20. WON DEAL
- **Kondisi**: Barang sudah dikirim
- **Pemicu**: System (otomatis setelah Shipment DELIVERED)
- **System Output**: `SO.status = COMPLETED`, `Lead.status = WON_DEAL`, omset masuk dashboard

### 21. LOST DEAL
- **Kondisi**: Batal di tengah jalan
- **Input BD**: Klik "Mark as Lost" + pilih alasan (dropdown `LostReason`)
- **System Output**: `Lead.status = LOST`, data masuk Lost Analysis

---

## RINGKASAN INPUT/OUTPUT BD

| Tahap | Input BD | System Trigger | Output ke Divisi Lain |
|:---|---:|:---|---:|
| New Lead | Data lead + follow up | `createLead` | Dashboard Pipeline |
| NPF | Product brief + target price | `createNpf` | R&D: brief produk |
| Sample Payment | Upload bukti bayar | `uploadPaymentProof` | Finance: AR verification |
| Sample Feedback | Catatan revisi | `createRevision` | R&D: formulasi ulang |
| Sample Approve | Klik approve | `approveSample` | Semua: formula terkunci |
| SPK + SO | Upload SPK + SO | `createSalesOrder` | Finance: billing |
| DP Proof | Upload bukti DP | `uploadDpProof` | Finance: G2 verification |
| Final Payment | Upload bukti lunas | — | Finance: G3 verification |
| Lost Deal | Alasan gagal | `logActivity(LOST)` | Dashboard: Lost Analysis |
| Repeat Follow Up | Follow up klien | `logActivity` | Retention Engine |
