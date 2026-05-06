# Communication Protocol: Finance & Accounting
**Version**: 2.0 — Sinkron dengan CANONICAL_GLOSSARY.md v2.0
**Role**: Economic Brain, Financial Auditor, Gate Keeper of 3 Master Locks.

---

## 1. JALUR INBOUND — PENERIMAAN (AR Hub) ↔ BD

| Sumber | Pemicu | Aksi Finance | Dampak Sistemik | Gate |
|:---|---:|:---|---:|:---:|
| **Client** | Transfer biaya sampel | Verifikasi bukti bayar → klik "Verify" | SampleStage → `QUEUE`, R&D terbuka | **G1** |
| **Client** | Transfer DP ≥ 50% | Verifikasi → SO → `LOCKED_ACTIVE` | Legal, SCM, Creative, WH paralel jalan | **G2** |
| **Client** | Transfer pelunasan | Verifikasi → Invoice → `PAID` | WH bisa cetak DO, barang keluar | **G3** |

### Dampak Sistemik Otomatis (setelah G2):
1. Membuat `JournalEntry` (Kas/Bank ↑, Unearned Revenue ↑)
2. Memanggil `LegalityService` → create `RegulatoryPipeline` (Draft BPOM)
3. Memanggil `CreativeService` → create `DesignTask` (INBOX)
4. Memanggil `ScmService.autoCreatePurchaseRequest` → cek stok BOM

---

## 2. JALUR OUTBOUND — PENGELUARAN (AP Hub) ↔ SCM

| Sumber | Pemicu | Aksi Finance | Dampak Sistemik |
|:---|---:|:---|---:|
| **SCM** | Purchase Order (PO) diterbitkan | Validasi PO → setujui term of payment | PO aktif, Supplier kirim barang |
| **Supplier** | Tagihan supplier masuk | Verifikasi invoice → klik "Cairkan Dana" | Kas ↓, Hutang ↓, SCM terima notifikasi |
| **SCM** | Purchase Return | Validasi retur | Adjust hutang, adjust stok |

---

## 3. JALUR INTERNAL — HPP KALKULASI ↔ R&D & SCM

| Pemicu | Aksi Finance | Dampak Sistemik |
|:---|---:|:---|
| QC Release / Mixing Done | **No manual action** — sistem otomatis | BOM × Moving Average Price = COGS |
| Production selesai | — | `WorkOrder.actualCogs` terisi, jurnal COGS auto |
| COPQ terjadi | — | `COPQRecord` → jurnal kerugian |

---

## 4. JALUR OPEX — DANA INTERNAL ↔ SEMUA DIVISI (NEW)

| Sumber | Pemicu | Aksi Finance | Dampak Sistemik |
|:---|---:|:---|---:|
| **Marketing** | Top-up saldo iklan | Buat `FundRequest` → Setujui → Cairkan | Kas ↓, Beban Iklan ↑ di GL |
| **HR** | Payroll bulanan | Terima Payroll `AUTHORIZED` → transfer | Kas ↓, Beban Gaji ↑ |
| **GA** | Pembelian ATK, listrik, perbaikan | Verifikasi pengajuan dana | Kas ↓, Beban Operasional ↑ |
| **Semua Divisi** | Reimbursement karyawan | Verifikasi ticket + bukti | Kas ↓, Beban terkait ↑ |

---

## 5. FINANCIAL HARD GATES — THE 3 MASTER LOCKS

| Gate | Nama | Protocol | Audit Logic |
|:---|:---|---:|:---|
| **G1** | Sample Gate | BD upload bukti bayar → Finance verify → R&D unlock | `paymentApprovedAt` + `verifiedBy` terisi |
| **G2** | Production Gate | BD upload DP ≥ 50% → Finance verify → 5 modul unlock | SO.status → `LOCKED_ACTIVE`, Lead → `DP_PAID` |
| **G3** | Delivery Gate | Client lunas → Finance verify → WH unlock | Invoice.status → `PAID`, Lead → `WON_DEAL` |

---

## 6. COMPLIANCE PROTOCOLS

| Aturan | Enforcement |
|:---|---:|
| Total Dr = Total Cr untuk setiap JournalEntry | Backend reject jika tidak balance |
| Beban (6xxxxx) & Aset Tetap (15xxxx) wajib attachment | Tombol submit nonaktif tanpa file |
| Pajak (PPN/PPH) dipisahkan ke akun penampungan | Auto-split saat Invoice/Bill dibuat |
| Period closing hanya jika Trial Balance = 0 | Sistem blokir jika belum balance |
| Override pada jurnal yang sudah diposting | Wajib catat alasan, tidak hapus data lama |

---

## 7. ENDPOINT API REFERENCE

| Endpoint | Method | Description | Gate |
|:---|---:|:---|---:|
| `/finance/ar/verify-sample` | POST | Verifikasi bayar sampel | G1 |
| `/finance/ar/verify-dp` | POST | Verifikasi DP produksi | G2 |
| `/finance/ar/verify-final` | POST | Verifikasi pelunasan | G3 |
| `/finance/ap/approve-po` | POST | Setujui PO & term of payment | — |
| `/finance/ap/disburse` | POST | Cairkan dana ke supplier | — |
| `/finance/fund-request` | POST | Buat pengajuan dana internal | — |
| `/finance/journal` | POST | Input manual journal entry | — |
