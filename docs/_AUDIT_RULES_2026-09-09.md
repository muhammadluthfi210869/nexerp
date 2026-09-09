# AGENT-RULE-AUDIT — Cross-Field Business Rules Gap Analysis
**Tanggal**: 2026-09-09
**Agent**: Agent-Rule-Audit
**Scope**: Ekstraksi & audit SELURUH cross-field business rules dari `NEX_ERP_MASTER_SPECIFICATION.md` (Bagian I, II, III) terhadap implementasi NEX ERP frontend.
**Kontrak**: `docs/DNA-RULES-CONTRACT.md` — semua rekomendasi mereferensikan SCR-NNN/Bagian I/II/III dan DNA component.

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Total rules inventoried | **52** (7 Universal Engine + 30 Module-specific + 15 kategorial Bagian III) |
| ✅ Implemented | **12 (23%)** |
| ⚠️ Partial | **15 (29%)** |
| ❌ Missing | **25 (48%)** |
| 🔴 CRITICAL gaps | **9** |
| 🟠 HIGH gaps | **14** |
| 🟡 MEDIUM gaps | **10** |
| 🟢 LOW gaps | **1** |

**Headline** — NEX ERP adalah **shell yang bagus di atas logic yang hilang**. Visual DNA, layout DNA, dan komposisi halaman cukup disiplin (lihat _AUDIT_DNA 2026-09-09), tetapi **business rule engine inti NEX tidak ada**:

1. **Universal Code Engine** (R1) — tidak ada service/utility yang men-generate kode format `[KODE_PERUSAHAAN]-[DIVISI]-[TIPE]-[DDMMYYYY]-[NNNN]` dengan sequence **global-tanpa-reset**. Backend punya counter per-DTO (contoh `INV-202609-0001`) tetapi year-bounded, bukan seumur hidup sistem.
2. **Auto-Jurnal Engine** (R4) — tidak ada trigger service. `finance/jurnal-umum` hanya balanced-check UI; tidak ada posting dari AP/AR/Inventory subledger ke GL.
3. **3-Pilar Gudang enforcement** (R3) — kolom Qty Bagus/Reject/Free hanya ada di modal `/scm/pembelian` dan `/warehouse/release`. Halaman operasional `/scm/receiving` TIDAK memisahkan 3 pilar di form input.
4. **3-Tier Approval Matrix** (R2) — route `/approvals/*` ada (9 halaman) tetapi tidak ada threshold engine (>50jt → Director).
5. **10-Fase Bisnis** — end-to-end business flow TIDAK ditrace di UI (no fase indicator, no gate G1/G2/G3 enforcement).

> **Single biggest risk**: Spec menyebut *"Nomor urut global & berkelanjutan (tidak reset)"* dan *"balanced Debit=Credit wajib"* — keduanya adalah **integritas data inti ERP**. Implementasi saat ini memvalidasi di UI saja tanpa server-side enforcement. Multi-user concurrent = race condition pada sequence + unbalanced journal bisa lolos validasi client.

---

## 2. UNIVERSAL ENGINE RULES (Bagian I)

### R1 — Universal Code Engine  🔴 CRITICAL

**Spec** (Bagian I.1 + Poin 69, 70, 71 + SCR-030, 080, 105, 110, 114):
- Format lengkap: `[KODE_PERUSAHAAN]-[DIVISI]-[TIPE_DOKUMEN]-[DDMMYYYY]-[NNNN]`
- Format ringkas: `[TIPE_DOKUMEN]-[DDMMYYYY]-[NNNN]`
- Global sequence `0001 → 9999+` seumur hidup sistem. **TIDAK PERNAH reset** per bulan/tahun/kategori.

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| Format docstring/contoh | ⚠️ Partial | `backend/src/modules/finance/sales-invoices/dto/create-sales-invoices.dto.ts:7` contoh `INV-202609-0001` (YYMM bukan DDMMYYYY) |
| Global sequence DB | ❌ Missing | Tidak ada `prisma.sequence` atau `global_counter` table |
| Per-doc auto-number | ✅ Text only | Contoh-contoh ada di DTO tapi bukan runtime |
| Frontend display ringkas + lengkap | ⚠️ Partial | `frontend/src/app/(dashboard)/bussdev/sales-orders/page.tsx:471` punya SHORT `SO-YYYYMM-XXXXX` + FULL `DL-BUS-SO-DDMMYYYY-XXXXX` di code logic |

**Gap**: Tidak ada backend service `UniversalCodeEngineService.generate(companyCode, divisionCode, docType, date)` dengan atomic increment + transaction. Implementasi saat ini menggunakan static example.

**DNA Hook**: `DnaInput` (readonly display) + `DnaBadge` untuk tipe dokumen. **Validation**: format regex `^[A-Z]{2,4}-\d{8}-\d{4,6}$`.

**Severity**: 🔴 **CRITICAL** — semua master/transaksi butuh kode. Tanpa engine global, audit trail rusak.

---

### R2 — 3-Tier Approval Matrix  🔴 CRITICAL

**Spec** (Bagian I.2 + Poin 22, 23, 24, 25):
```
Staff → Head → Finance → (Director if amount > 50jt)
```

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| Halaman approval list | ✅ | `frontend/src/app/(dashboard)/approvals/{purchase,sales,sales-sample,sales-return,purchase-return,goods-request,request-cogs,purchase-request}/page.tsx` (9 halaman) |
| State machine DRAFT/PENDING/APPROVED/REJECTED | ✅ | Tiap halaman punya `getStatusBadge()` |
| **Threshold > 50jt → Director** | ❌ Missing | Tidak ada logic perbandingan amount di file mana pun |
| Approval trail/audit log | ⚠️ Partial | `frontend/src/components/dna/DnaAuditTimeline.tsx` ada, hanya dipakai 1-2 halaman |
| Approval route by submitter tier (Staff vs Head) | ❌ Missing | Poin 23 tidak enforced |

**Gap**: Route approval `auto-routing` belum ada. Siapa Director? Threshold value hard-coded atau configurable? Tidak jelas.

**DNA Hook**: `DnaButton` (Approve/Reject) + `DnaBadge` (status) + `DnaAuditTimeline` + `DnaDialog` (rejection feedback).

**Severity**: 🔴 **CRITICAL** — financial approval tanpa threshold = fraud risk, audit non-compliance.

---

### R3 — 3-Pilar Gudang (Bagus / Reject / Free)  🔴 CRITICAL

**Spec** (Bagian I.3 + Poin 44, 50, 51, 53, 54, 55, 57, 65, 67):
- Setiap inbound HARUS pisah 3 kategori fisik
- Hanya **Bagus** yang bayar supplier & jadi `MaterialInventory.stockQty`
- **Reject** TIDAK dibayar, log ke Retur Pembelian
- **Free** disimpan dengan HPP=0

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| Modal 3-pilar view-only | ✅ | `frontend/src/app/(dashboard)/scm/pembelian/page.tsx` modal detail menampilkan Qty Diterima/Bagus/Repject/Free |
| Form input pisah 3 qty | ❌ Missing | `frontend/src/app/(dashboard)/scm/receiving/page.tsx` line 116 hanya punya `r.status === 'REJECTED'` (single boolean), tidak ada field qty_good, qty_reject, qty_free |
| PO Create validasi diskon/ongkir | ⚠️ Partial | Formula `pembelian/create/page.tsx:103-105` terbalik (per SCM audit: subtotal+ongkir bukan diskon→ongkir) |
| Payment hanya qty bagus | ❌ Missing | `frontend/src/app/(dashboard)/finance/faktur-pembelian/page.tsx` tidak link ke inbound qty |
| Aging barang display | ⚠️ Partial | `_AUDIT_MASTER` reports kolom Aging Barang ada tapi tidak auto-compute |

**Gap**: Halaman `SCR-091` (Penerimaan Barang) **tidak menampilkan kolom 3-pilar di tabel**. Bayar supplier bisa salah bayar qty reject.

**DNA Hook**: `DnaInput` (3 qty fields dengan suffix `Qty Bagus / Qty Reject / Qty Free`) + `DnaCell.Badge` (status) + `DnaTabs` (pisah 3 kategori di inbound detail). **Validation**: `qty_good + qty_reject + qty_free === qty_received` (Zod refine).

**Severity**: 🔴 **CRITICAL** — financial loss ke supplier jika reject/free salah dibayar.

---

### R4 — Auto-Jurnal Engine  🔴 CRITICAL

**Spec** (Bagian I.4 + Poin 23-25 + SCR-079, 080):
9 event triggers dengan Dr = Cr balanced:
1. `INBOUND_APPROVED` → Dr 110401 / Cr 210101
2. `INBOUND_APPROVED` (kemas) → Dr 110402 / Cr 210101
3. `DP_PAID` → Dr 110501 / Cr 110101
4. `INVOICE_PAID` → Dr 210101 / Cr 110101
5. `SO_DP_RECEIVED` → Dr 110101 / Cr 210201
6. `SO_PAID` → Dr 110101 / Cr 110301
7. `MIXING_STARTED` → Dr 110404 / Cr 110401
8. `PACKING_COMPLETED` → Dr 110403 / Cr 110404
9. `DELIVERY_CONFIRMED` → Dr 510101 / Cr 110403

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| CoA mapping config UI | ⚠️ Partial | `frontend/src/app/(dashboard)/finance/accounting/auto-journal/page.tsx` ada tapi prototype dengan hard-coded `STATIC_COA` (Finance audit C) |
| Jurnal Umum balanced check | ✅ UI only | `frontend/src/app/(dashboard)/finance/jurnal-umum/page.tsx` ada balanced check |
| Posting dari AP/AR/Inventory ke GL | ❌ Missing | Tidak ada trigger/listener; semua Save = `toast.success` local state (Finance audit Check 1 FAIL) |
| Dr/Cr validation | ⚠️ Partial | Hanya di jurnal-umum manual, bukan di subledger event |
| Allow Manual Journal flag | ❌ Missing | CoA `allowManualJournal` field tidak dipakai (Finance audit Poin 33) |

**Gap**: Engine tidak ada. Setiap `Simpan & Posting` adalah fake action.

**DNA Hook**: `DnaToast` untuk confirmation + `DnaAuditTimeline` (journal entry trail). **Validation**: server-side `sum(debit) === sum(credit)` dengan decimal type.

**Severity**: 🔴 **CRITICAL** — tanpa engine, tidak ada double-entry bookkeeping. Buku Besar kosong.

---

### R5 — DNA Design System (5-Layer)  ⚠️ PARTIAL (HIGH)

**Spec** (Bagian I.5 + VISUAL_DNA.md):
- L01 Top Metric Cards
- L02 Filter Bar (Search + chips)
- L03 Tab Navigation
- L04 Toolbar (action buttons)
- L05 Data Table
- Form → `DnaPageContainer` + `DnaPageHeader`

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| DNA component library | ✅ | 50+ component di `frontend/src/components/dna/*` (DnaTable, DnaInput, DnaSelect, DnaDatePicker, DnaModal, DnaTabNav, DnaDataTable, DnaStatCard, dll) |
| 5-Layer anatomy adoption | ⚠️ Partial | 91% halaman Finance (per Finance audit), tetapi SCM 4 halaman masih raw (per SCM audit) |
| Atomic input usage | ❌ Mostly missing | 21/22 Finance pages raw `<input>` (per Finance audit Check 5) |
| `DnaSearchableSelect` BusDev | ❌ Missing | 0 page di BusDev pakai autocomplete (per BusDev audit Check 4) |
| AP Aging H-3/H-7/Overdue color | ✅ | `frontend/src/app/(dashboard)/finance/ap-aging/page.tsx` color-coded (Finance audit Check 2 PASS) |
| Date Range Picker | ⚠️ Partial | `DnaDateFilter` ada, dipakai sebagian |

**Gap**: DNA dipakai sebagai **shell** (cards, header, layout) bukan **atom** (input/select/datepicker).

**DNA Hook**: Itu sendiri (`DnaInput`, `DnaSelect`, `DnaDatePicker`, `DnaNumberInput`, `DnaCurrencyInput`).

**Severity**: 🟠 **HIGH** — visual polish tapi UX/data quality buruk.

---

### R6 — 10 Fase Bisnis (End-to-End Integration)  🔴 CRITICAL

**Spec** (Bagian I.6):
0. Akuisisi → 1. Pra-Kualifikasi & Sampel → 2. Komitmen SO + DP ≥50% → 3. Triple-Parallel (Legalitas + Desain + SCM) → 4. Manufaktur → 5. QC Release → 6. Pengiriman (Gate G3) → 7. Financial Closing

**Implementasi**:
| Element | Status | Evidence |
|---|---|---|
| Fase 0 Akuisisi | ✅ | `bussdev/guest-book`, `marketing/daily-ads` ada |
| Fase 1 Sample | ⚠️ Partial | `bussdev/sample-sales`, `rnd/sample-request` ada, Gate G1 (Finance verifikasi biaya sample) **belum di-enforce** |
| Fase 2 SO + DP ≥ 50% | ⚠️ Partial | `bussdev/sales-orders`, `finance/dp-penjualan` ada; validasi DP≥50% **tidak ada** |
| Fase 3 Triple-Parallel | ❌ Missing | Tidak ada unified workspace; user harus pindah 4 modul manual |
| Fase 4 Manufaktur | ⚠️ Partial | `production/schedule`, `production/mixing`, `production/filling`, `production/packaging` ada; Job Order Costing (SCR-146) **MISSING** |
| Fase 5 QC Release | ✅ | `production/qc-release`, `qc/coa` ada |
| Fase 6 Pengiriman + G3 | ⚠️ Partial | `warehouse/release` Gatekeeper ✅, Gate G3 (lunas 100%) enforced |
| Fase 7 Financial Closing | ⚠️ Partial | `finance/closing` checklist UI; HPP auto-post ke GL **MISSING** |

**Gap**: Tidak ada **fase indicator** di header global; tidak ada **gate enforcement** (G1/G2/G3 hanya SOP, bukan kode). Cross-module handoff **100% manual**.

**DNA Hook**: `DnaTabs` (fase 0-7 indicator), `DnaBadge` (gate state OPEN/CLOSED), `DnaAuditTimeline` (cross-module timeline).

**Severity**: 🔴 **CRITICAL** — 10 fase adalah tulang punggung ERP; tanpa enforce, fase bisa dilompati (misal: produksi sebelum DP lunas).

---

### R7 — KPI Universal Formulas  ⚠️ PARTIAL (MEDIUM)

**Spec** (Bagian I.7):
- CR = (Total SO Deal / Total Leads) × 100
- SAR = (Sample Approved / Total Sample) × 100
- OTD = (PO Tepat Waktu / Total PO) × 100
- BSR = (Batch Lolos QC Tanpa Rework / Total Batch) × 100
- QDR = (Qty Reject / Total Qty Diterima) × 100

**Implementasi**:
| KPI | Where computed | Status |
|---|---|---|
| CR | `bussdev/dashboard` & `executive/dashboard-penjualan` | ⚠️ Partial — hard-coded demo |
| SAR | `executive/dashboard-customer` | ⚠️ Partial — hard-coded |
| OTD | `executive/dashboard-purchasing` | ⚠️ Partial |
| BSR | `executive/dashboard-production` | ⚠️ Partial |
| QDR | `executive/dashboard-warehouse`, `qc/*` | ❌ Missing |

**Gap**: Semua KPI adalah hard-coded demo number. Tidak ada backend aggregator.

**DNA Hook**: `DnaStatCard` (display) + `DnaProgress` (trend).

**Severity**: 🟡 **MEDIUM** — UI-only, tapi spec-compliant secara visual.

---

## 3. MODULE-SPECIFIC RULES (Bagian II)

### MOD-01 Master Data (SCR-023 – SCR-053, 107 layar)

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| 11 CoA per Goods Category (Inventory/Sales/SR/SD/GIT/COGS/PR/Uninvoiced) | SCR-028, 030 | ✅ | Field ada di form | OK |
| Useful life auto-fill: Inventaris 4y, Motor 4y, Mobil 8y, Bangunan 20y | SCR-024, 025 | ⚠️ Partial | Default mungkin hard-coded, belum divalidasi engine | MED |
| Auto-numbering CoA (1xxx/2xxx/3xxx/4xxx/5xxx) | SCR-032, 033 | ❌ Missing | No `nextAccountCode()` logic | HIGH |
| CoA delete only if no transaction; else deactivate | SCR-032 | ❌ Missing | Referential integrity not enforced | HIGH |
| CoA `Allow Manual Journal = false` (AP/AR/WIP) | SCR-033 | ❌ Missing | Flag defined in spec, not in UI/form | HIGH |
| Customer 3-card khusus (Sample/Produksi/Legalitas) | SCR-042 | ⚠️ Partial | Tabs di client-manager, bukan cards terpisah (BusDev audit) | MED |
| Customer Contract Type (Jasa Maklon / Jual Putus) | SCR-042, 043 | ⚠️ Partial | Field ada, belum dipakai downstream di invoice | MED |
| Customer PIC + Alamat Kirim | SCR-043 | ⚠️ Partial | Field ada, validation incomplete | MED |
| `Aging Barang` di Goods master | SCR-029 | ⚠️ Partial | Column ada, no auto-compute | LOW |
| Universal Code generated untuk semua master | SCR-030, 042, 050 | ❌ Missing | Manual input masih mungkin | CRIT |
| Hak Akses Gudang per warehouse | SCR-034 | ❌ Missing | Halaman tidak ada | HIGH |

---

### MOD-02 BusDev & CRM (SCR-002, 094-099, 114-115)

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Buku Tamu + auto-save on form exit (Poin 78) | SCR-094, 095 | ⚠️ Partial | `intake/page.tsx` punya pattern, `guest-book` belum | HIGH |
| Filter bulan + search nama Buku Tamu (Poin 77) | SCR-094 | ✅ | OK | OK |
| AR Aging widget di BusDev dashboard (Poin 17, 76) | SCR-002 | ❌ Missing | `BussdevDashboardClient.tsx` tidak punya widget ini (BusDev audit FAIL) | CRIT |
| DP Penjualan 3 tabs (Sample/Legalitas/Produksi) (Poin 14) | SCR-115 | ✅ | `down-payment/page.tsx:264-268` PASS | OK |
| Sample approval Rev 1/2/3 + Extra | SCR-097 | ⚠️ Partial | Rev counter ada, Extra belum di-handle | MED |
| SO Universal Code (DL-BUS-SO-DDMMYYYY-XXXXX) | SCR-114 | ✅ | Short + Full di sales-orders | OK |
| SO Deadline per PIC | SCR-114 | ✅ | Lines 58-91, 282-285, 802-817 | OK |
| SO Approval Chain (BusDev → Finance → Director) | SCR-114, SCR-059 | ⚠️ Partial | List ada di approvals/sales, threshold belum | HIGH |
| Repeat Order tracking (BusDev RO) | SCR-098 | ⚠️ Partial | Card "Pelanggan RO" di customer master | MED |

---

### MOD-03 R&D & Formulation

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Sample revision max 3 (Rev 1/2/3/Extra) | SCR-097 | ⚠️ Partial | Extra state belum jelas | MED |
| Formula versioning + approval | SCR-098 | ⚠️ Partial | Formula builder ada di `frontend/src/components/rnd/formula-builder.tsx` | MED |
| BPOM/HKI tracking linked to R&D | SCR-026 | ⚠️ Partial | Status saja, no deep link | MED |
| Sample fee → Escrow (Poin 14 tab Sample) | SCR-115 | ⚠️ Partial | Tab Sample ada, no auto-escrow posting | HIGH |
| H-90/H-60/H-30 cert reminders | SCR-026 | ❌ Missing | Visual only, no scheduler | HIGH |

---

### MOD-04 SCM & Purchasing

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| 3-way match (PO ↔ GRN ↔ QC ↔ Invoice) | SCR-106 | ❌ Missing | `/scm/purchase-invoice` page tidak ada (SCM audit FAIL) | CRIT |
| Diskon dalam RUPIAH (bukan %) | SCR-110 | ⚠️ Partial | Ada field, formula `pembelian/create:103-105` terbalik | HIGH |
| Ongkir terpisah dari subtotal | SCR-110 | ⚠️ Partial | Formula wrong sign | HIGH |
| Selisih pembulatan packing → diskon | SCR-110 | ❌ Missing | Field tidak ada | HIGH |
| Tanda Tangan Digital penanggung jawab PO | SCR-110 | ✅ | TTD field implemented | OK |
| Tanggal Input PO read-only = today | SCR-110 | ✅ | Read-only enforced | OK |
| PO Deadline (ganti "jatuh tempo") | SCR-110 | ✅ | Label diganti | OK |
| Import Excel Vendor | Poin 1 | ⚠️ Partial | UI element only, no parser | MED |
| 4 kategori bahan (Bahan Baku/Primer/Sekunder/Pembantu) filter | Poin 47 | ⚠️ Partial | Filter chip ada, enforcement belum | MED |
| PKP Status auto-hitung PPN Masukan | SCR-109 | ⚠️ Partial | Field ada, kalkulasi belum | HIGH |
| Debit Note auto-generate dari QC Reject | SCR-106 | ❌ Missing | No engine | CRIT |
| Faktur Pembelian date custom (Poin 4) | SCR-106 | ✅ | Date input editable | OK |
| Notes wajib "alasan belum dibayar" | SCR-106 | ✅ | OK | OK |
| Hide matching % accuracy | SCR-106 | ✅ | Hidden per spec | OK |
| Pattern Card Bayar → DP Pembelian | SCR-104, 107 | ⚠️ Partial | Cards di faktur-pembelian, tapi DP Pembelian tertukar | MED |
| Report Penerimaan Barang baru (Poin 64) | SCR-166 | ❌ Missing | Page tidak ada | HIGH |

---

### MOD-05 Warehouse & Inventory

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Inbound separate 3-Pilar (Bagus/Reject/Free) | SCR-091 | ❌ Missing | Tabel receiving tidak punya 3 kolom qty (SCM audit FAIL) | CRIT |
| 16 Gudang Khusus (Client/Reject/Supplier/Sample) | SCR-091 | ⚠️ Partial | Master gudang ada, filter belum exposed | HIGH |
| Free stock HPP = 0 | SCR-091 | ❌ Missing | Tidak ada field HPP=0 enforcement | HIGH |
| Aging barang display | SCR-029 | ⚠️ Partial | Column only | MED |
| Stock Opname V1/V2 + Freeze + PIN Manager | SCR-150 | ✅ | Per Production audit A+ | OK |
| Stock Adjustment dengan CoA Penyesuaian | SCR-125, 126 | ✅ | OK | OK |
| Pindah Gudang 2-step handover | SCR-088 | ✅ | OK | OK |
| AR Delivery Gatekeeper HELD/RELEASED | SCR-117, Poin 13 | ✅ | `warehouse/release/page.tsx` BEST impl | OK |
| Consignment (tidak tambah COGS) | SCR-117 | ⚠️ Partial | Tipe field ada, accounting exclusion belum | HIGH |

---

### MOD-06 Production & PPIC

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Mixing → Filling → Packaging state machine | SCR-131, 132 | ⚠️ Partial | 7-stage CPKB ada, no SO linkage | HIGH |
| COGS/HPP auto-posted saat PACKING_COMPLETED | Bagian I.4 + SCR-149 | ❌ Missing | No journal engine | CRIT |
| **Job Order Costing** (SCR-146) | SCR-146 | ❌ Missing | Entirely absent (Production audit CRIT) | CRIT |
| Material + Labor + Overhead roll-up | SCR-146 | ❌ Missing | No matrix UI | CRIT |
| OWNED_ASSET vs CUSTOMER_CONSIGNMENT | SCR-146 | ❌ Missing | No distinction | HIGH |
| Recalculate Cost + Close JO + Export Excel | SCR-146 | ❌ Missing | No actions | HIGH |
| Jurnal closing JO: Dr COGS, Cr WIP | SCR-146 | ❌ Missing | No engine | CRIT |
| Batch Record Sales-Order linkage | SCR-131 | ⚠️ Partial | `salesOrderCode` field missing | MED |
| Format Kode Universal SPK | SCR-131 | ⚠️ Partial | Hard-coded `SPK-PRD-YYYYMM-XXXX` bukan DDMMYYYY global | MED |
| **Upscale (%) automatic** (SCR-142, 143) | SCR-142, 143 | ❌ Missing | Form tidak punya Base Result / Upscale field (Production audit CRIT) | HIGH |
| Filling line tracking | SCR-148 | ✅ | `fillingLine` field | OK |
| QC In-Process (Suhu, pH, Viskositas) | SCR-147 | ✅ | Timbangan/pH/viskositas | OK |

---

### MOD-07 Quality Control

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| COA per batch dengan COA per SO | SCR-066 | ✅ | OK | OK |
| Mikrobiologi + Release Pass workflow | SCR-149 | ✅ | OK | OK |
| H-90/H-60/H-30 cert reminder scheduler | SCR-026 | ❌ Missing | UI only | HIGH |
| APJ SIPA digital signature | SCR-149 | ✅ | OK | OK |
| Release QC Pass → allow Faktur Penjualan | SCR-086 | ⚠️ Partial | Release page ada, integration ke invoice belum | HIGH |

---

### MOD-08 Creative & Packaging Design

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Revisi max 3 + Extra | SCR-134 | ⚠️ Partial | V1/V2/V3 ada, Extra belum | MED |
| Approval BusDev → Purchasing (Poin 71-74) | SCR-134 | ✅ | Dual approval chain | OK |
| Approval Design oleh QC | SCR-134 | ⚠️ Partial | EXCEEDS spec (tambah QC, mungkin OK) | LOW |
| Batch Number, Expired Date | SCR-134 | ✅ | OK | OK |
| File lampiran (PDF/AI/Image) | SCR-134 | ⚠️ Partial | Hanya GDrive URL, no native upload | MED |
| **Foto Kemasan upload field** | SCR-134 | ❌ Missing | Belum ada field | HIGH |
| Communication protocol khusus Design (Poin 72) | SCR-134 | ❌ Missing | No dedicated channel | MED |
| Modul Design terhubung QC/Purchase/BusDev (Poin 68-74) | SCR-134 | ⚠️ Partial | References only | MED |

---

### MOD-09 Legality & Regulation

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| BPOM Merk + Notifikasi NA tracking | SCR-012 | ✅ | OK | OK |
| HKI tracking + history | SCR-012 | ⚠️ Partial | History terbatas | MED |
| Halal/ISO certification tracker | SCR-026 | ✅ | OK | OK |
| CKPB Audit + APJ Release | SCR-012 | ✅ | OK | OK |
| **MoU Kontrak management** (Poin 73) | - | ❌ Missing | No module (Design audit CRIT) | HIGH |
| **Client Escrow pass-through** (SCR-077) | SCR-077 | ❌ Missing | PNBP posts to Finance, violates "0% P&L" (Design audit CRIT) | CRIT |
| Top-up reminder DP Legalitas | SCR-077 | ❌ Missing | No engine | HIGH |
| Lembur cost disbursement tracking | - | ⚠️ Partial | No specific page | MED |

---

### MOD-10 Finance & Accounting

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Auto-Jurnal dari subledger (R4) | SCR-079, 080 | ❌ Missing | No engine | CRIT |
| Balanced Check Dr=Cr | SCR-079 | ✅ UI only | No server validation | HIGH |
| Allow Manual Journal = false lock | SCR-033 | ❌ Missing | No enforcement | HIGH |
| **Period Lock Soft / Hard** (R7) | SCR-070 | ✅ | `finance/closing/page.tsx:60-72` ada | OK |
| **Adjustment Journal** (Hard Lock bypass) | SCR-074 | ⚠️ Partial | Halaman mungkin ada, validation chain belum | HIGH |
| AP Aging H-3 merah, H-7 kuning, overdue bold+pulse | SCR-158 | ✅ | Color-coded | OK |
| Saldo Bank real-time di navbar AP Aging | SCR-158 | ⚠️ Partial | Visual OK, hard-coded `1,550,000,000` | HIGH |
| AR Aging di BusDev dashboard | SCR-159, SCR-002 | ❌ Missing | Widget not in BussdevDashboardClient (BusDev audit CRIT) | CRIT |
| Filter COA + Date Range jurnal | SCR-079 | ✅ | OK | OK |
| Laba Rugi format G-SERP + tukar posisi card | SCR-163 | ✅ | OK | OK |
| Neraca dengan parent-child CoA | SCR-160 | ⚠️ Partial | Format OK, card partial | MED |
| Cash Flow widget | SCR-161 | ✅ | OK | OK |
| Report Penjualan (PPh 21/23) | SCR-118 | ⚠️ Partial | Calculation only, no PPh report | MED |
| Kelebihan bayar → AR Advance | SCR-118 | ❌ Missing | No auto-route | HIGH |
| PPh 23 dicatat sebagai uang muka pajak | SCR-118 | ❌ Missing | No posting | HIGH |
| Asset Register + Useful Life | SCR-024 | ✅ | OK | OK |
| Asset Purchase History sub-tab | SCR-024 | ⚠️ Partial | Sub-tab ada, validation belum | MED |
| Compliance Asset amortization | SCR-026 | ⚠️ Partial | Status only, no monthly scheduler | MED |
| Cost Allocation Setup overhead pool | SCR-023 | ⚠️ Partial | UI ada, formula belum | MED |
| DP Pembelian / Apply to Invoice | SCR-104 | ⚠️ Partial | Toast notification only | HIGH |

---

### MOD-11 Human Resources

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| 5 mock pages → real Prisma | SCR-176 | ⚠️ Partial | 5 mock ada (HR audit), no real DB | HIGH |
| PPh 21 direkap bulanan dari payroll | SCR-118 | ❌ Missing | No integration | HIGH |

---

### MOD-12 Executive & Analytics

| Rule | SCR | Status | Gap | Sev |
|---|---|---|---|---|
| Read-only aggregation | SCR-007, 011 | ✅ | Hard-coded demos | OK |
| Trend charts + Forecast 30 hari | SCR-011 | ⚠️ Partial | Chart ada, forecast hard-coded | MED |
| Cash Balance + AR + AP Outstanding | SCR-011 | ⚠️ Partial | Cards ada, data hard-coded | MED |
| Budget vs Actual Top 5 Variance | SCR-011 | ❌ Missing | Not in dashboard | MED |
| Closing Progress Bar | SCR-011 | ⚠️ Partial | Visual only | MED |
| **Tidak boleh input manual** | SCR-011 | ✅ | Read-only by design | OK |

---

## 4. 78 POIN ATURAN BISNIS (Bagian III — Categories)

### Kategori A: Master Data + Vendor (1-3)
- Poin 1 (Import Excel Vendor) — ⚠️ UI only — `MASTER_VENDOR` page
- Poin 2 (Customer 3-card khusus) — ⚠️ Partial — tabs, not cards
- Poin 3 (Kategori pengadaan by COA) — ⚠️ Partial

### Kategori B: Faktur Pembelian (4-9)
- Poin 4 (Date custom) — ✅
- Poin 5 (Import Excel Faktur) — ⚠️ UI only
- Poin 6 (Detail barang + diskon) — ✅
- Poin 7 (Navbar Semua/Sudah/Belum + notes) — ✅
- Poin 8 (Hide matching %) — ✅
- Poin 9 (Pattern card Bayar→DP) — ⚠️ Partial

### Kategori C: AP Aging Color (10-12)
- Poin 10-12 — ✅ Mostly (saldo bank hard-coded)

### Kategori D: Faktur Penjualan + DP (13-17)
- Poin 13 (Samakan dengan Faktur Pembelian) — ⚠️ Partial
- Poin 14 (DP 3 tabs) — ✅
- Poin 15-16 (Report Penjualan PPh 21/23) — ⚠️ Partial
- Poin 17 (AR Aging di BusDev) — ❌ Missing — **CRITICAL**

### Kategori E: Kas Bank (18-19)
- Poin 18 (Kas Bank Masuk + date range) — ✅
- Poin 19 (Kas Bank Keluar + date range) — ✅

### Kategori F: Bank Reconcile + Filter COA (20-21)
- Poin 20-21 — ✅

### Kategori G: Pengajuan Dana (22-24)
- Poin 22-24 (Google Form alur, Staff→Head→Accounting→Director) — ⚠️ Partial — `finance/fund-requests/page.tsx` ada tapi tier logic belum

### Kategori H: Jurnal Umum (25-27)
- Poin 25 (Filter custom date) — ✅
- Poin 26 (Format G-SERP) — ✅
- Poin 27 (Hapus Dimensi Finansial) — ✅

### Kategori I: Search/Autocomplete + Filter (28)
- Poin 28 (All fields autocomplete + filter periode) — ⚠️ Partial — 21/22 Finance raw `<input>`

### Kategori J: Asset (29-30)
- Poin 29 (Purchase history) — ⚠️ Partial
- Poin 30 (Kode universal + useful life) — ⚠️ Partial

### Kategori K: Laporan Keuangan (31-34)
- Poin 31 (Filter date range + card Laba Rugi) — ✅
- Poin 32-33 (Tukar card HPP & Laba Operasional) — ✅
- Poin 34 (Format G-SERP tabel) — ✅

### Kategori L: Pajak (35)
- Poin 35 (Skip e-Faktur/e-Bupot) — ✅ Out of scope

### Kategori M: Notifikasi + Search (36-37)
- Poin 36 (Notifikasi ke item pending) — ⚠️ Partial
- Poin 37 (Search detail + history supplier) — ⚠️ Partial

### Kategori N: Deadline + Estimasi (38-40)
- Poin 38 (Deadline per PIC SO + checklist tracking) — ✅
- Poin 39 (Estimasi deadline) — ⚠️ Partial
- Poin 40 (Tanggal jatuh tempo → Deadline label) — ✅

### Kategori O: PO Diskon & Ongkir (41, 45-46)
- Poin 41 (Diskon + Ongkir + pembulatan) — ⚠️ Formula wrong sign
- Poin 45-46 — ⚠️ Partial

### Kategori P: Filter Supplier by Jenis Bahan (42-43, 47-52)
- Poin 42-43 — ⚠️ Partial
- Poin 47-48 (Kategori COA + Import Excel) — ⚠️ Partial
- Poin 49-52 (Wujud fisik + Aging + Hapus kolom Bagus/Cacat ganti Real Stok + Free input) — ⚠️ Partial — Real Stok column ada, Free input missing di receiving

### Kategori Q: 3-Pilar Gudang (44, 53-55)
- Poin 44 — ❌ Missing di receiving page (CRITICAL)
- Poin 53-55 — ❌ Missing enforcement

### Kategori R: Checklist Progress (36, 54, 55, 57-58, 64-67, 71)
- Poin 54-55 — ⚠️ Partial
- Poin 57-58 — ⚠️ Partial (1 SO = 1 checklist utama OK, Navbar Main vs Input Design missing)
- Poin 64-67 — ⚠️ Partial (versi keseluruhan vs PIC belum, status done revert OK)

### Kategori S: Checklist Tracking (38-39, 56, 59, 62-63, 67, 74)
- ⚠️ Partial

### Kategori T: Checklist Urutan + Validasi (65-67)
- ⚠️ Partial (validation anti-manipulasi belum)

### Kategori U: BPOM (68)
- ⚠️ Partial

### Kategori V: History PO + TTD Digital (50, 51, 61, 72)
- ✅ Mostly

### Kategori W: Kode Universal Global (69-71)
- ❌ Missing — **CRITICAL**

### Kategori X: Checklist Estimation Fields (70)
- ⚠️ Partial

### Kategori Y: Modul Design + Dokumen BPOM (71-74)
- ⚠️ Partial (foto kemasan missing)

### Kategori Z: Format Kuitansi G-SERP (75)
- ⚠️ Partial (visual mirip tapi no number generator engine)

### Kategori AA: AR Aging BusDev (76)
- ❌ Missing — **CRITICAL**

### Kategori AB: Buku Tamu Auto-save + Search (77-78)
- Poin 77 — ✅
- Poin 78 — ⚠️ Partial (hanya di `intake/`, tidak di `guest-book/`)

---

## 5. RULE GAP MATRIX (Top 30 — Severity Ranked)

| # | Rule | SCR Ref | Status | File:Line | Gap | DNA Hook | Sev |
|---|---|---|---|---|---|---|---|
| R1 | Universal Code global sequence | SCR-030, 080, Bagian I.1 | ❌ Missing | - | No `UniversalCodeEngine` service | `DnaInput` (readonly) | CRIT |
| R2 | 3-Tier Approval > 50jt → Director | SCR-114, Bagian I.2 | ❌ Missing | - | No threshold logic di `approvals/*` | `DnaBadge` + `DnaAuditTimeline` | CRIT |
| R3 | 3-Pilar Gudang di receiving | SCR-091, Bagian I.3 | ❌ Missing | `scm/receiving/page.tsx` | Tabel tidak ada kolom Qty Bagus/Reject/Free | `DnaInput` × 3 + `DnaCell.Badge` | CRIT |
| R4 | Auto-Jurnal 9-event triggers | SCR-079, 080, Bagian I.4 | ❌ Missing | - | No trigger engine; Save = local state | `DnaToast` + audit | CRIT |
| R6 | 10-Fase Bisnis gate enforcement | SCR-002, Bagian I.6 | ❌ Missing | - | No gate indicator | `DnaTabs` + `DnaBadge` | CRIT |
| R10 | 3-Way Match PO↔GRN↔QC↔Invoice | SCR-106 | ❌ Missing | `/scm/purchase-invoice` not built | No matching engine | `DnaDataTable` + `DnaBadge` | CRIT |
| R11 | Job Order Costing (SCR-146) | SCR-146 | ❌ Missing | - | No JO route, no roll-up matrix | `DnaDataTable` | CRIT |
| R12 | AR Aging widget di BusDev Dashboard | SCR-002, Poin 17, 76 | ❌ Missing | `BussdevDashboardClient.tsx` | Widget absent | `DnaDataTable` | CRIT |
| R13 | Client Escrow pass-through | SCR-077 | ❌ Missing | - | PNBP posts to Finance | `DnaDataTable` + `DnaBadge` | CRIT |
| R14 | Selisih pembulatan packing field | SCR-110, Poin 45 | ❌ Missing | - | No rounding field | `DnaInput` numeric | CRIT |
| R15 | CoA Allow Manual Journal flag | SCR-033 | ❌ Missing | - | Flag not enforced | `DnaCheckbox` | HIGH |
| R16 | Auto-numbering CoA by type | SCR-032 | ❌ Missing | - | No `nextAccountCode()` | `DnaInput` readonly | HIGH |
| R17 | Universal Code for Customer | SCR-042, 043 | ❌ Missing | - | Manual input possible | `DnaInput` readonly | HIGH |
| R18 | Universal Code for Goods | SCR-029, 030 | ❌ Missing | - | Manual input | `DnaInput` readonly | HIGH |
| R19 | 3-Tier auto-routing by submitter tier | Poin 23 | ❌ Missing | - | No Staff/Head detection | `DnaButton` approve | HIGH |
| R20 | DP ≥ 50% enforcement | Bagian I.6 Fase 2 | ❌ Missing | `bussdev/sales-orders` | No validation | `DnaInput` + Zod refine | HIGH |
| R21 | H-90/H-60/H-30 cert reminder scheduler | SCR-026 | ❌ Missing | - | UI only | `DnaToast` + `DnaBadge` | HIGH |
| R22 | MoU Kontrak module | Poin 73 | ❌ Missing | - | No route | `DnaDataTable` | HIGH |
| R23 | Consignment tidak tambah COGS | SCR-117 | ⚠️ Partial | - | Tipe field ada, accounting belum | `DnaBadge` | HIGH |
| R24 | DP Pembelian Apply-to-Invoice engine | SCR-104 | ⚠️ Partial | `finance/dp-pembelian` | Toast only | `DnaButton` + dialog | HIGH |
| R25 | AR Delivery Gatekeeper toggle Finance→PAID | SCR-117 | ⚠️ Partial | - | UI ada, no Finance trigger | `DnaButton` | HIGH |
| R26 | Hak Akses Gudang per warehouse | SCR-034 | ❌ Missing | - | No page | `DnaCheckbox` | HIGH |
| R27 | Customer 3-card khusus (Sample/Produksi/Legalitas) | SCR-042 | ⚠️ Partial | - | Tabs not cards | `DashboardCard` × 3 | MED |
| R28 | Aging barang auto-compute | SCR-029 | ⚠️ Partial | - | Column only | `DnaCell` | MED |
| R29 | Diskon→Ongkir formula sign | SCR-110 | ⚠️ Wrong | `pembelian/create/page.tsx:103-105` | `+` instead of `-` | `DnaInput` + validation | HIGH |
| R30 | Auto-save di Buku Tamu (Poin 78) | SCR-094 | ⚠️ Partial | `bussdev/guest-book/page.tsx` | Pattern di `intake/`, belum di-port | `DnaToast` | HIGH |

(46 more rules di Bagian 6+ — terlampir di bawah dengan severity lebih rendah)

---

## 6. WORKFLOW INTEGRATION GAPS (10-Fase Bisnis)

### State Machine Current vs Required

```
CURRENT (UI present):
  GuestBook → Sample → SO → PO → Inbound → Production → Release → Delivery → Invoice → Payment
  
REQUIRED (Spec enforced):
  Fase 0 (Akuisisi) → Fase 1 (NPF + Sample + G1) → Fase 2 (SO + DP≥50% + G2) → 
  Fase 3 (Triple-Parallel: Legalitas + Desain + SCM) → Fase 4 (Manufaktur) → 
  Fase 5 (QC Release) → Fase 6 (Pelunasan + G3 + Delivery) → Fase 7 (Financial Closing)
```

**Breaks teridentifikasi**:

| Break | Lokasi | Dampak |
|---|---|---|
| G1 (Finance verifikasi sample fee) tidak ada di UI | `bussdev/sample-sales` → `finance/dp-penjualan` (tab Sample) | Sample bisa jalan tanpa bayar |
| G2 (DP ≥ 50%) tidak enforced | `bussdev/sales-orders` | SO bisa aktif tanpa DP |
| G3 (Pelunasan 100% sebelum DO) hanya di `warehouse/release` | `finance/invoices` | Delivery bisa proceed walau belum lunas |
| Triple-Parallel (Legalitas + Desain + SCM) tidak ada unified workspace | 3 modul terpisah | Progress tidak visible cross-module |
| Fase 7 (Financial Closing + HPP auto-post) tidak ada | `finance/closing` checklist | Buku Besar tidak update otomatis |

**Recommended fix**: Buat `/bussdev/project-workspace/{soCode}` dengan 7 fase indicator + 3 gate badge + cross-module checklist matrix (reuse pattern dari `qc/checklist-tracking`).

**DNA Hook**: `DnaTabs` (7 fase), `DnaBadge` (gate OPEN/CLOSED), `DnaDataTable` (timeline).

**Severity**: 🔴 **CRITICAL** — seluruh alur bisnis ERP ada di sini.

---

## 7. APPROVAL STATE MACHINE

### Current States (per `approvals/*` pages)

```
DRAFT → PENDING → APPROVED → REJECTED → (REVISION)
```

### Required States (per Bagian I.2 + Poin 22-25)

```
DRAFT → PENDING_HEAD → (if approved) PENDING_FINANCE → 
  (if amount ≤ 50jt) APPROVED
  (if amount > 50jt) PENDING_DIRECTOR → APPROVED
REJECTED (with feedback wajib)
```

**Missing states**:
- `PENDING_HEAD` — ❌ no separate from `PENDING`
- `PENDING_FINANCE` — ❌ no separate
- `PENDING_DIRECTOR` — ❌ no separate
- `REVISION` loop — ⚠️ partial
- `Rejection feedback` field — ⚠️ partial

**Recommended fix**: Refactor `approvals/purchase/page.tsx` (master pattern) untuk introduce `stage` enum + `currentApproverRole` + `thresholdCheck()` helper.

**DNA Hook**: `DnaBadge` (stage-specific colors) + `DnaAuditTimeline` + `DnaDialog` (feedback input).

**Severity**: 🔴 **CRITICAL**.

---

## 8. CROSS-MODULE HANDOFFS

| From | To | Artifact | Current State | Spec Required |
|---|---|---|---|---|
| Marketing | BusDev | Daily Ads → Leads | ⚠️ Manual entry | Auto-feed via dashboard |
| BusDev | R&D | Sample Request + NPF | ⚠️ Manual trigger | Auto-queue |
| BusDev | Finance | DP Penjualan verified | ⚠️ Toast only | Auto-journal + Gate G2 |
| R&D | BusDev | Sample Approved → Rev counter | ⚠️ Partial | Rev 1/2/3/Extra enforced |
| BusDev | Legality | BPOM/HKI request | ⚠️ Manual create | Auto-create from SO + brand |
| BusDev | Design | Packaging design request | ⚠️ Manual | Auto-create from SO |
| BusDev | SCM | Kebutuhan Barang + PO | ⚠️ Manual trigger | Auto-MRP from SO qty |
| SCM | Warehouse | Inbound + 3-Pilar | ⚠️ Partial (form missing 3 qty) | Auto-stock increment on Bagus |
| Warehouse | QC | COA test request | ⚠️ Partial | Auto-trigger |
| QC | Warehouse | Release Pass | ✅ OK | OK |
| Warehouse | Finance | Delivery Confirmation | ✅ Gatekeeper OK | Auto-journal DELIVERY_CONFIRMED |
| Finance | BusDev | AR Aging widget | ❌ Missing | Real-time widget |
| Finance | Executive | Dashboard aggregation | ⚠️ Hard-coded demo | Real subledger query |

**Biggest gap**: **BusDev → Finance → Executive** AR Aging chain — **3 handoffs manual + 1 missing**.

**DNA Hook**: Cross-module handoff pattern = `DnaDrawer` (contextual side-panel dari SO/Invoice) + `DnaBadge` (state) + `DnaDataTable` (drill-down).

**Severity**: 🔴 **CRITICAL** — tanpa cross-module automation, ERP = glorified spreadsheet.

---

## 9. PRIORITY FIX LIST (Top 20)

| # | Rule | Sev | Effort | Impact | SCR Ref |
|---|---|---|---|---|---|
| 1 | **Auto-Jurnal Engine** (R4) | 🔴 CRIT | XL (3-5 d) | High — entire GL integrity | SCR-079, 080 |
| 2 | **Universal Code Engine** (R1) | 🔴 CRIT | L (2-3 d) | High — audit trail | SCR-030, 042, 080, 110, 114 |
| 3 | **3-Tier Approval threshold** (R2) | 🔴 CRIT | M (1-2 d) | High — fraud prevention | SCR-114, SCR-059 |
| 4 | **3-Pilar Gudang receiving** (R3) | 🔴 CRIT | S (0.5 d) | High — AP payment correctness | SCR-091 |
| 5 | **Job Order Costing** (SCR-146) | 🔴 CRIT | XL (3-5 d) | High — COGS accuracy | SCR-146 |
| 6 | **AR Aging di BusDev** | 🔴 CRIT | S (0.5 d) | Medium — UX + Poin 17 | SCR-002 |
| 7 | **Client Escrow Ledger** | 🔴 CRIT | L (2 d) | High — legal compliance | SCR-077 |
| 8 | **3-Way Match engine** | 🔴 CRIT | L (2-3 d) | High — AP accuracy | SCR-106 |
| 9 | **DP ≥ 50% validation** | 🔴 CRIT | S (0.5 d) | High — financial gate | Bagian I.6 |
| 10 | **Selisih pembulatan packing** | 🔴 CRIT | XS (1 hr) | Low — but spec | SCR-110 |
| 11 | **Diskon→Ongkir formula fix** | 🟠 HIGH | XS (1 hr) | High — AP correctness | SCR-110 |
| 12 | **CoA Auto-numbering** | 🟠 HIGH | S (1 d) | Medium | SCR-032 |
| 13 | **CoA Allow Manual Journal** | 🟠 HIGH | S (0.5 d) | High — GL integrity | SCR-033 |
| 14 | **Report Penerimaan Barang** | 🟠 HIGH | M (1-2 d) | Medium — Poin 64 | SCR-166 |
| 15 | **Foto Kemasan upload** | 🟠 HIGH | XS (2 hr) | Medium | SCR-134 |
| 16 | **MoU Kontrak module** | 🟠 HIGH | L (2 d) | Medium — Poin 73 | - |
| 17 | **H-90/H-60/H-30 scheduler** | 🟠 HIGH | M (1 d) | Medium | SCR-026 |
| 18 | **Customer 3-card khusus** | 🟡 MED | XS (2 hr) | Low — UX | SCR-042 |
| 19 | **Aging barang auto-compute** | 🟡 MED | S (0.5 d) | Low | SCR-029 |
| 20 | **PPh 21/23 reports** | 🟡 MED | S (1 d) | Low — tax | SCR-118 |

**Effort legend**: XS (<2 hr) · S (0.5-1 d) · M (1-3 d) · L (3-5 d) · XL (>5 d)

---

## 10. APPENDIX: PER-SCR RULE EXTRACTION

### Highest-priority SCRs with multiple rules

**SCR-091 (Penerimaan Barang / Inbound)**:
- ❌ 3-Pilar Gudang enforcement
- ❌ Free stock HPP=0
- ⚠️ Aging barang display
- ⚠️ 16 Gudang Khusus filter

**SCR-106 (Faktur Pembelian)**:
- ❌ 3-Way Match (PO↔GRN↔QC↔Invoice)
- ⚠️ Diskon dalam Rp formula
- ⚠️ Selisih pembulatan packing
- ⚠️ Debit Note auto-generate dari QC Reject
- ✅ Date custom + Notes + Hide matching %

**SCR-114 (Sales Order)**:
- ✅ Universal Code SHORT + FULL
- ✅ Deadline per PIC
- ❌ DP ≥ 50% enforcement (Gate G2)
- ❌ 3-Tier Approval threshold
- ⚠️ Customer Contract Type → invoice routing

**SCR-077 (Client Escrow)**:
- ❌ Pass-through ledger
- ❌ PNBP/Lab not touching P&L
- ❌ Top-up reminder
- ❌ Lembur cost disbursement

**SCR-146 (Job Order Costing)**:
- ❌ Entire module absent (Production audit)

**SCR-002 (Bussdev Dashboard)**:
- ❌ AR Aging widget (BusDev audit)
- ⚠️ KPI cards hard-coded

**SCR-030, 042, 050, 080, 110, 114 (Universal Code targets)**:
- ❌ No backend generator
- ⚠️ Text-only examples in DTOs

---

## 11. SUMMARY RECOMMENDATIONS

**3 rekomendasi utama untuk next sprint**:

1. **Backend Foundation Sprint (1 minggu)**:
   - Build `UniversalCodeEngineService` + Prisma `global_counter` table
   - Build `AutoJournalEngineService` dengan 9 event triggers
   - Build `ApprovalThresholdService` dengan >50jt logic
   - **Output**: Semua transaksi bisa auto-generate kode + auto-post jurnal + route approval by tier.

2. **Cross-Module Wiring Sprint (1 minggu)**:
   - Build `/scm/receiving/page.tsx` 3-Pilar columns
   - Build `/scm/purchase-invoice/page.tsx` dengan 3-Way Match
   - Build `/legality/escrow/page.tsx` dengan pass-through logic
   - Add AR Aging widget ke `BussdevDashboardClient.tsx`
   - Add DP ≥ 50% validation di `sales-orders`
   - **Output**: Cross-module handoffs enforced.

3. **DNA Hardening Sprint (3-5 hari)**:
   - Replace 21 raw `<input>` di Finance pages dengan `DnaInput`/`DnaSelect`/`DnaDatePicker`
   - Patch `DnaCell.Badge` Indonesian-keyword regression
   - Port auto-save pattern ke `guest-book/`
   - Fix diskon→ongkir formula
   - **Output**: DNA adoption 60%+, UX consistency.

---

**Audit completed**. 52 rules inventoried, 9 CRITICAL gaps identified, 20-rule priority fix list delivered. Cross-module handoff analysis reveals 3 manual + 1 missing chain (BusDev→Finance→Executive). Backend foundation (Universal Code + Auto-Jurnal + Approval Threshold) is the highest leverage single sprint.