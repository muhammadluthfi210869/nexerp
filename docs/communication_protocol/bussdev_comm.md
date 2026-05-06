# Communication Protocol: Business Development (BD)
**Version**: 2.0 — Sinkron dengan CANONICAL_GLOSSARY.md v2.0
**Architecture**: Event-Driven State Machine. BD sebagai orchestrator lini depan.

---

## FASE 1: AKUISISI & PIPELINE (DigiMar → BD)

| Tahap | Status Canonical | Aksi BD | Trigger | Divisi Terlibat |
|:---|---:|:---|:---|---:|
| **New Lead** | `NEW_LEAD` | Input data lead / terima dari DigiMar | `createLead` | DigiMar: suplai data iklan |
| **Contacted** | `CONTACTED` | Log follow-up (WA/Call/Meeting) | `logActivity` | — |
| **Follow Up** | `FOLLOW_UP_1/2/3` | Update progres negosiasi | `logActivity` | — |
| **Negotiation** | `NEGOTIATION` | Upload quotation + penawaran | `logActivity(QUOTATION)` | — |

---

## FASE 2: PENGEMBANGAN SAMPEL (BD ↔ Finance ↔ R&D)

| Tahap | Status Canonical | Aksi | Trigger | Gate |
|:---|---:|:---|---:|:---:|
| **Request Sample** | `SAMPLE_REQUESTED` | Buat SampleRequest | `createSampleRequest` | — |
| **Closing Sample** | `WAITING_FINANCE` | Upload NPF + Bukti Bayar Sampel | `uploadPaymentProof` | **G1: Sample Gate** |
| **Sample Verification** | `QUEUE` | Finance verifikasi pembayaran | `verifyPayment` | G1 terbuka → R&D mulai |
| **Lab Work** | `FORMULATING` | R&D upload formula v1 | `uploadFormula` | — |
| **Lab Test** | `LAB_TEST` | R&D input hasil uji lab | `createLabTest` | — |
| **Sample Shipped** | `SHIPPED` | R&D input resi pengiriman | `shipSample` | — |
| **Client Review** | `CLIENT_REVIEW` | Klien terima & review sampel | auto via tracking | — |
| **Revision** | (loop) | BD input feedback klien → R&D revisi | `createRevision` | Max 3x → Director |
| **Sample Approved** | `APPROVED` | BD klik "Sample Approved" → kunci formula | `approveSample` | Formula → `SAMPLE_LOCKED` |
| **Sample Rejected** | `REJECTED` | BD input alasan → back ke negosiasi | `rejectSample` | — |

---

## FASE 3: KOMITMEN PRODUKSI & PARALEL (BD ↔ All Divisions)

| Tahap | Status Canonical | Aksi | Trigger | Gate |
|:---|---:|:---|---:|:---:|
| **SPK Signed** | `SPK_SIGNED` | Upload SPK + bukti DP ≥ 50% | `createSalesOrder` + `uploadDpProof` | — |
| **DP Verification** | `DP_PAID` / `LOCKED_ACTIVE` | Finance verifikasi DP | **G2: Production Gate** | Semua track paralel terbuka |
| | | **System trigger Triple Parallel**: | | |
| | | Legal → RegulatoryPipeline (BPOM/HKI/HALAL) | auto | — |
| | | SCM → auto PR jika stok kurang | auto | — |
| | | Creative → DesignTask INBOX | auto | — |
| | | Warehouse → capacity check | auto | — |
| **Readiness Check** | `READY_TO_PRODUCE` | System cek: Legal.PUBLISHED + Creative.LOCKED + SCM.READY | auto | Merge Gate |

---

## FASE 4: EKSEKUSI PRODUKSI (BD monitor via Activity Stream)

| Tahap | Status Canonical | Aksi Sistem | Divisi Eksekutor |
|:---|---:|:---|---:|
| **Work Order** | `PLANNING` | PPIC buat WorkOrder + ProductionSchedule | Production |
| **Batch Record** | `WAITING_MATERIAL` | Cetak Batch Record, tarik data Formula + WO + Design | Production |
| **Material Issue** | — | Warehouse keluarkan bahan via MaterialRequisition | WH → Production |
| **Mixing** | `MIXING` | Produksi mixing → QC Bulk → RELEASED/HOLD | Production → QC |
| **Filling** | `FILLING` | Produksi filling → QC Leak/Volume | Production → QC |
| **Packing** | `PACKING` | Produksi packing → QC Final | Production → QC |
| **FG Quarantine** | `FINISHED_GOODS` | FG masuk gudang karantina | Warehouse |

---

## FASE 5: PENYELESAIAN & PENGIRIMAN (Finance ↔ WH ↔ BD)

| Tahap | Status Canonical | Aksi | Trigger | Gate |
|:---|---:|:---|---:|:---:|
| **Invoice Final** | — | Finance terbitkan Invoice FINAL_PAYMENT | — | — |
| **Final Payment** | — | Client bayar → Finance verifikasi | **G3: Delivery Gate** | — |
| **DeliveryOrder** | — | Warehouse cetak DO | G3 must be OPEN | — |
| **Shipment** | `SHIPPED` | Logistics input tracking, barang keluar | `createShipment` | — |
| **Won Deal** | `WON_DEAL` | System ubah status lead | Shipment `DELIVERED` | — |
| **Lost Deal** | `LOST` | BD klik "Mark as Lost" + alasan | `logActivity(LOST)` | — |

---

## FASE 6: RETENSI & REPEAT ORDER (NEW)

| Tahap | Aksi | Trigger |
|:---|---:|:---|
| **Retention Active** | System hitung estimasi habis stok klien | WON_DEAL + qty data |
| **Notify H-14** | System kirim notifikasi ke BD | estDepletionDate - 14 hari |
| **Follow Up** | BD follow up klien untuk re-order | RetentionStatus = NOTIFIED |
| **Churn** | Jika tidak repeat → `CHURNED` | > 30 hari after notification |
| **Repeat Order** | Buat SO baru (referensi formula lama) | Siklus dari Fase 3 lagi |

---

## ACTIVITY STREAM — FORMAT KANONIKAL

Setiap transaksi state di-log ke `ActivityStream` dengan format:

```
[TIMESTAMP] [DIVISI: PIC] - AKSI - [STATUS LAMA → STATUS BARU] - CATATAN
```

Contoh:
```
[09:00] [SYSTEM] - Leads baru dari Meta Ads (Campaign: Whitening Series)
[09:30] [BD: FINA] - CONTACTED - Klien tertarik maklon 5000 pcs
[13:00] [BD: FINA] - WAITING_FINANCE - Upload NPF & Bukti Bayar Sampel Rp 500k
[13:15] [FINANCE: ZAKI] - G1 VERIFIED - Dana masuk Kas BCA - R&D terbuka
[15:00] [RND: ADI] - FORMULATING - Upload Formula v1
[16:00] [BD: FINA] - REVISION 1 - "Aroma kurang kuat, minta tekstur lebih cair"
[09:00] [BD: FINA] - APPROVED - Kunci Formula #F-102
[10:00] [LEGAL: IRMA] - SUBMITTED - Pengajuan BPOM & HKI
[11:00] [CREATIVE: RIO] - IN_PROGRESS - Upload Mockup v1
[15:00] [BD: FINA] - SPK_SIGNED - Upload SPK + Bukti DP 50% (Rp 25jt)
[15:30] [FINANCE: ZAKI] - G2 VERIFIED - SO LOCKED_ACTIVE - Semua track paralel jalan
[08:00] [PROD: EKO] - MIXING - Cetak Batch Record, timbang bahan
[11:00] [QC: LALA] - QC Bulk: RELEASED - pH OK, Viskositas OK
[16:00] [QC: LALA] - QC Packing: PASSED - 5.050 pcs FG
[17:00] [FINANCE: ZAKI] - G3 VERIFIED - Pelunasan 50% - DO terbuka
[09:00] [WH: BUDI] - SHIPPED - Cetak Surat Jalan, barang keluar
[09:10] [SYSTEM] - WON_DEAL - Omset tercatat di Dashboard
```
