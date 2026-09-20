# NEX ERP — Business Rules Catalog
**Document Version:** 1.1 (2026-09-17) — Bahasa Indonesia untuk Tim Operasional
**Status:** PROVISIONAL — seluruh 4 keputusan bisnis material telah diselesaikan dan dikodifikasikan.
**Authority:** Dokumen ini memiliki validasi, kalkulasi, eligibility, invariant, dan constraint semantik bisnis sesuai `00_MASTER_SPEC.md §9.1`. Dokumen sumber lama hanya provenance.

---

## 1. Pendahuluan

### 1.1 Tujuan
- Menjadi **katalog tertutup** semua validasi, kalkulasi, dan invariant bisnis di NEX ERP.
- Referensi harian tim operasional (Upii + staf) saat menemukan perilaku sistem yang dirasa "aneh".
- Referensi developer saat implementasi: angka toleransi, formula, urutan precedence.

### 1.2 Cara Baca
- Setiap rule punya ID `BUS-RULE-XXX` (XXX = nomor urut 3 digit, **bersifat permanen** — kalau ada rule yang dihapus, nomornya tidak reuse).
- Tag **Prio-1 (Critical)** artinya wajib ada validasi backend, jangan andalkan frontend saja.
- Tag **Prio-2 (Business)** artinya boleh di-hardcode rule bisnis di satu tempat (service / domain function).
- Tag **Prio-3 (UX Hint)** artinya cukup jadi peringatan UI, tanpa memblokir submit.
- Lihat **§13 Operations Manual Notes** untuk skenario error umum & prosedur override.

### 1.3 Konvensi Penomoran
- `BUS-RULE-XXX` — nomor urut global
- Penomoran per-section (Sales, Purchase, dst.) hanya untuk organisasi dokumen, bukan untuk ID rule itu sendiri
- Sumber Spec selalu link ke file path absolute

### 1.4 Resolusi Konflik
- Tentukan subjek lalu gunakan pemilik tunggal pada `00_MASTER_SPEC.md §9.1`.
- Bukti requirement dan keputusan yang disetujui dipakai untuk memperbarui pemilik kanonik, bukan sebagai kontrak runtime paralel.
- Konflik bisnis yang tidak bisa ditentukan dari bukti harus menjadi `DECISION_REQUIRED`; jangan gunakan default teknis diam-diam.
- Override manual hanya bisa oleh user dengan role Director (lihat `07_RBAC_MATRIX.yaml`) + wajib ditulis di audit log.

---

## 2. Sales Rules (15 rules)

### BUS-RULE-001 — Sales Order: Customer Wajib Aktif
**Deskripsi**: SO tidak boleh dibuat untuk customer berstatus nonaktif; mencegah piutang macet.
**Konteks**: Entity `SalesOrder`, field `customerId` (FK), phase `Draft`.
**Logika**:
```
IF customer.status != 'ACTIVE' THEN error
IF customer.isBlacklisted THEN error
```
**Pesan Error**: `Customer tidak aktif atau masuk daftar hitam. Hubungi Accounting untuk klarifikasi.` / `CUSTOMER_INACTIVE`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.1, DEC-024
**Siapa Terlibat**: BusDev (input), Finance (validasi status blacklist)
**Test Case**: SO-001-CUST-INACTIVE → blok submit
**Catatan**: Customer hasil migrasi legacy dengan status nonaktif harus direview Finance dulu.

### BUS-RULE-002 — DP Penjualan Minimum 50% & Aturan Amandemen SO
**Deskripsi**: Setiap SO baru wajib ada DP ≥ 50% sebelum masuk status `READY_PROD` atau turun PR/PO. Amandemen setelah DP diterima tunduk pada aturan perubahan terkontrol.
**Konteks**: Entity `SalesOrder` + `DownPayment`, phase sebelum `ProductionReady`.
**Logika**:
```
dpAmount = sum(DownPayment where status='POSTED' and category='PRODUCTION')
IF dpAmount < (so.totalAmount * 0.50) THEN error

// Aturan Amandemen Pasca-DP (DECISION_REQUIRED-003):
on SO_Amendment_Requested(so):
  IF so.status == 'IN_PRODUCTION' OR so.status IN ['QC_PASS', 'SHIPPED', 'CLOSED'] THEN
    ERROR('Data komersial SO terkunci setelah IN_PRODUCTION. Amandemen langsung dilarang.')
  ELSE IF so.status == 'DP_PAID':
    so.status = 'AMENDMENT_REVIEW'
    production_hold.set(true)
    newTotal = recalculate_so_total(so.items)
    deltaDP = (newTotal * 0.50) - dpAmount
    IF deltaDP > 0:
      issue_supplementary_dp_invoice(deltaDP)
    ELSE IF deltaDP < 0:
      credit_customer_balance(abs(deltaDP)) // atau offset di faktur akhir
    REQUIRE approval(BusDevManager AND FinanceManager)
    ON approved:
      so.status = 'DP_PAID'
      production_hold.set(false)
```
**Pesan Error**: `DP minimum 50% belum tercapai. Saat ini: Rp {X} dari Rp {Y} (Z%).` / `DP_MINIMUM_NOT_MET`
**Sumber Spec**: REQUIREMENT Poin 14, NEX_FINANCE_FINAL_SPEC §3.3, DECISION_REQUIRED-003 (Resolved 2026-09-17)
**Siapa Terlibat**: BusDev (tagih DP, ajukan amandemen), Finance (verifikasi, rekonsiliasi DP), Production (tahan/mulai kerja)
**Test Case**: SO total Rp 100jt, DP baru Rp 40jt → blok pindah status. SO status DP_PAID diamandemen → masuk AMENDMENT_REVIEW, produksi hold. SO status IN_PRODUCTION diamandemen → reject error.
**Catatan**: Pengecualian untuk client korporat dengan credit limit approval khusus (lihat BUS-RULE-005). Amandemen hanya diizinkan SEBELUM produksi berjalan; setelah IN_PRODUCTION data komersial immutable.

### BUS-RULE-003 — Sales Order: Invoice Date Custom
**Deskripsi**: Tanggal invoice penjualan boleh di-custom manual, tidak harus = tanggal sistem.
**Konteks**: Entity `SalesInvoice`, field `invoiceDate`.
**Logika**:
```
IF invoiceDate < so.createdAt - 90 days THEN warning
IF invoiceDate > today THEN error (tidak boleh tanggal masa depan)
```
**Pesan Error**: `Tanggal invoice tidak boleh lebih dari hari ini.` / `INVOICE_DATE_FUTURE`
**Sumber Spec**: REQUIREMENT Poin 13, NEX_FINANCE_FINAL_SPEC §3.2
**Siapa Terlibat**: Finance Admin (input)
**Test Case**: Tanggal sistem 2026-09-16, invoice 2026-09-20 → blok. Invoice 2026-06-01 → warning saja.

### BUS-RULE-004 — DP Penjualan: Kategori Wajib Dipilih
**Deskripsi**: DP Penjualan wajib punya kategori (Sample / Legalitas / Produksi) agar jurnal benar.
**Konteks**: Entity `DownPayment`, field `category`.
**Logika**:
```
IF dp.category NOT IN ('SAMPLE','LEGALITAS','PRODUKSI') THEN error
```
**Pesan Error**: `Kategori DP wajib dipilih (Sample / Legalitas / Produksi).` / `DP_CATEGORY_REQUIRED`
**Sumber Spec**: REQUIREMENT Poin 14, NEX_FINANCE_FINAL_SPEC §3.3
**Siapa Terlibat**: Finance Admin
**Test Case**: DP tanpa kategori → blok simpan. Kategori 'LEGALITAS' → otomatis posting ke Client Escrow (lihat BUS-RULE-060).

### BUS-RULE-005 — Credit Limit Check saat Faktur Penjualan Submit
**Deskripsi**: Submit Faktur Penjualan wajib melewati credit limit check customer.
**Konteks**: Entity `SalesInvoice`, saat transisi `Draft → PendingApproval`.
**Logika**:
```
outstandingAR = sum(open invoices + new invoice amount)
IF outstandingAR > customer.creditLimit THEN require explicit override
```
**Pesan Error**: `Total AR (termasuk faktur baru) melebihi credit limit customer Rp {limit}. Butuh approval Finance Controller.` / `CREDIT_LIMIT_EXCEEDED`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.2, REQUIREMENT Poin 15
**Siapa Terlibat**: Finance Controller (override), BusDev (submit)
**Test Case**: Customer limit Rp 50jt, outstanding Rp 45jt, faktur baru Rp 10jt → butuh override.

### BUS-RULE-006 — AR Delivery Gatekeeper (HELD vs RELEASED)
**Deskripsi**: Gudang tidak boleh cetak Surat Jalan selama status AR faktur = HELD.
**Konteks**: Entity `SalesInvoice.status = 'HELD'`/`'RELEASED'`, dipanggil oleh module Warehouse sebelum cetak DO.
**Logika**:
```
IF salesInvoice.deliveryStatus != 'RELEASED' THEN block 'Cetak Surat Jalan'
```
**Pesan Error**: `Surat Jalan belum bisa dicetak. Finance masih menahan faktur (status HELD — pelunasan 50% belum masuk).` / `DELIVERY_GATE_HELD`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.2 + Lampiran B
**Siapa Terlibat**: Warehouse (cetak DO), Finance (ubah ke RELEASED), BusDev (monitor)
**Test Case**: SO sudah lunas 100% → RELEASED otomatis. SO baru 50% → masih HELD.

### BUS-RULE-007 — PPh 23 Dipotong Customer
**Deskripsi**: Customer boleh memotong PPh 23 saat bayar; sistem catat sebagai piutang pajak, bukan tagihan belum lunas.
**Konteks**: Entity `CustomerPayment`, field `pph23DeductedAmount` (optional).
**Logika**:
```
IF pph23DeductedAmount > 0 THEN
  Dr Bank (grossReceived)
  Dr PPh 23 Dibayar Dimuka (pph23DeductedAmount)
    Cr AR Control (invoiceAmount)
```
**Pesan Error**: `Jumlah PPh 23 tidak boleh melebihi nilai invoice.` / `PPh23_EXCEEDS_INVOICE`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.4 + §5.2, REQUIREMENT Poin 13
**Siapa Terlibat**: Finance Admin (input Bukti Potong)
**Test Case**: Invoice Rp 100jt, customer bayar Rp 98jt + potong PPh 23 Rp 2jt → AR tetap lunas.

### BUS-RULE-008 — Sample Fee Offset ke DP Produksi
**Deskripsi**: Sample fee yang sudah dibayar client bisa di-offset sebagai pengurang DP Produksi.
**Konteks**: Entity `SampleFee.status = 'RECEIVED'`, dipanggil saat `DownPayment.category = 'PRODUKSI'` dibuat.
**Logika**:
```
IF customer has SampleFee.status='RECEIVED' THEN
  show option "Apply Sample Fee sebagai pengurang DP"
  IF applied THEN dp.amount -= sampleFee.amount
```
**Pesan Error**: `Sample Fee sudah di-offset ke DP Produksi {DPJ-XXX}. Tidak bisa dipakai dua kali.` / `SAMPLE_FEE_ALREADY_OFFSET`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.7, REQUIREMENT Poin 14
**Siapa Terlibat**: Finance Admin (apply), BusDev (lihat opsi)
**Test Case**: Sample Fee Rp 5jt RECEIVED, DP Produksi Rp 100jt → jadi Rp 95jt.

### BUS-RULE-009 — Sample Fee Kedaluwarsa = Revenue
**Deskripsi**: Sample fee yang tidak di-offset dalam validity period → otomatis jadi revenue Sample Fee.
**Konteks**: Entity `SampleFee.validityPeriod`, scheduler harian.
**Logika**:
```
IF today > sampleFee.validityPeriod AND status='RECEIVED' THEN
  status = 'EXPIRED'
  post journal: Dr Sample Fee Unearned / Cr Revenue - Sample Fee
```
**Pesan Error**: (Scheduler, tidak ada error user)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.7
**Siapa Terlibat**: Finance Controller (monitor)
**Test Case**: Sample Fee Rp 5jt, validity 3 bulan, tidak ada kontrak → otomatis EXPIRED.

### BUS-RULE-010 — AR Aging: Color Coding
**Deskripsi**: Aging buckets untuk invoice: 0-30 hari hijau stabil, 31-60 kuning, 61-90 oranye, >90 merah + pulse animation.
**Konteks**: Entity `SalesInvoice`, dashboard `report-ar-aging` + widget BusDev.
**Logika**:
```
daysOverdue = today - invoice.dueDate
IF daysOverdue <= 0     THEN bucket = 'CURRENT',    color = 'green'
IF 1..30                THEN bucket = '1-30',       color = 'green'
IF 31..60               THEN bucket = '31-60',      color = 'yellow'
IF 61..90               THEN bucket = '61-90',      color = 'orange'
IF > 90                 THEN bucket = '>90',        color = 'red', animate = true
```
**Pesan Error**: (UI only, bukan blocking)
**Sumber Spec**: REQUIREMENT Poin 15, NEX_FINANCE_FINAL_SPEC §2.5 + §3.6
**Siapa Terlibat**: Finance (kolektor), BusDev (lihat widget)
**Test Case**: Invoice due 2026-07-01, hari ini 2026-09-16 → bucket >90, merah + pulse.

### BUS-RULE-011 — Sales Order: Deadline per PIC
**Deskripsi**: SO wajib punya deadline per PIC (desain, MoU, formulasi, dll) untuk tracking KPI.
**Konteks**: Entity `SalesOrderChecklistItem`, field `picDeadline`.
**Logika**:
```
FOR EACH checklistItem WHERE category IN ('DESIGN','MOU','FORMULASI','BPOM'):
  IF picDeadline IS NULL THEN warning (PRIO-3)
```
**Pesan Error**: `Checklist item {kategori} belum ada deadline. Mohon isi tanggal.` / `PIC_DEADLINE_MISSING`
**Sumber Spec**: REQUIREMENT Poin (sales-order-deadline)
**Siapa Terlibat**: BusDev (input), semua PIC terkait (monitor)
**Test Case**: Item "Desain Artwork" tanpa deadline → badge kuning + warning toast.

### BUS-RULE-012 — Return / Refund Penjualan
**Deskripsi**: Retur penjualan wajib via Credit Note (Dokumen Baru), bukan edit faktur Posted.
**Konteks**: Entity `CreditNote` (child of `SalesInvoice`).
**Logika**:
```
IF invoice.status = 'POSTED' THEN
  create CreditNote (NOT edit original)
  Dr Sales Returns / Cr AR Control
```
**Pesan Error**: `Faktur Posted tidak bisa diedit. Buat Credit Note untuk retur.` / `POSTED_INVOICE_IMMUTABLE`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §0.3 + §3.2
**Siapa Terlibat**: Finance Admin
**Test Case**: Invoice POSTED Rp 100jt, retur Rp 20jt → Credit Note Rp 20jt.

### BUS-RULE-013 — Sales Order: Cart Pattern
**Deskripsi**: Multi-line item SO pakai cart pattern (add/get/delete/clear) sebelum final submit.
**Konteks**: Entity `CartSession` (Redis-backed), route `/{module}/add-cart`.
**Logika**:
```
session.cart = []
FOR EACH add: session.cart.append(lineItem)
submit: validate cart, persist to SalesOrder + SalesOrderLine
```
**Pesan Error**: `Cart kosong. Tambahkan minimal 1 item.` / `CART_EMPTY`
**Sumber Spec**: DEC-015 (Cart Pattern Preservation), _SSOT_FINAL §4.1
**Siapa Terlibat**: BusDev (UI)
**Test Case**: Submit SO dengan cart kosong → blok.

### BUS-RULE-014 — Sales Order: Kategori SO Wajib
**Deskripsi**: Tiap SO wajib punya kategori (sample / produksi / legalitas) untuk pencatatan BPOM dan filtering.
**Konteks**: Entity `SalesOrder`, field `category`.
**Logika**:
```
IF so.category IS NULL THEN error (PRIO-1)
```
**Pesan Error**: `Kategori SO wajib dipilih: Sample / Produksi / Legalitas.` / `SO_CATEGORY_REQUIRED`
**Sumber Spec**: REQUIREMENT Poin (sales-kategori)
**Siapa Terlibat**: BusDev
**Test Case**: SO baru tanpa kategori → blok simpan.

### BUS-RULE-015 — Payment Allocation: Auto atau Manual
**Deskripsi**: Pembayaran клиент (> nilai invoice outstanding) → sisa otomatis jadi AR Advance, bukan saldo nganggur.
**Konteks**: Entity `CustomerPayment`, saat `Posted`.
**Logika**:
```
remaining = payment.amount - sum(allocated invoices)
IF remaining > 0 THEN
  Cr AR Advance (customer) += remaining
```
**Pesan Error**: (Tidak ada, otomatis)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.4
**Siapa Terlibat**: Finance Admin
**Test Case**: Bayar Rp 100jt, alokasi 2 invoice total Rp 80jt → Rp 20jt jadi AR Advance.

---

## 3. Purchase Rules (12 rules)

### BUS-RULE-016 — PO: Tanggal Input Read-Only
**Deskripsi**: Tanggal PO otomatis = hari ini, tidak bisa diubah manual saat create.
**Konteks**: Entity `PurchaseOrder`, field `poDate` saat create.
**Logika**:
```
poDate = today() (auto, server-side, tidak dari form)
```
**Pesan Error**: `Tanggal PO otomatis terisi hari ini dan tidak dapat diubah.` / `PO_DATE_IMMUTABLE`
**Sumber Spec**: REQUIREMENT Poin (purchase-date-readonly)
**Siapa Terlibat**: SCM (input)
**Test Case**: Form PO dengan tanggal custom → field disabled, helper text "Otomatis hari ini".

### BUS-RULE-017 — PO: Field Diskon & Ongkir Wajib
**Deskripsi**: PO wajib punya field diskon (Rp) dan ongkir (Rp). Selisih pembulatan qty packing → masuk diskon.
**Konteks**: Entity `PurchaseOrder`, fields `discountAmount`, `shippingCost`.
**Logika**:
```
IF discountAmount IS NULL OR shippingCost IS NULL THEN warning (PRIO-3)
roundingDiff = computedQty - orderedQty (per line)
addToDiscount(roundingDiff * price)
discount = discount - shippingCost
```
**Pesan Error**: `Diskon dihitung dalam Rupiah dan dikurangi dari ongkir.` / `DISCOUNT_AS_RUPIAH`
**Sumber Spec**: REQUIREMENT Poin 55, 56
**Siapa Terlibat**: SCM, Purchasing
**Test Case**: Order 100 packing @ 12 pcs = 1200, packing = 144, selisih 4 pcs × harga → diskon bertambah.

### BUS-RULE-018 — Penerimaan Barang: qtyFree, qtyReject, qtyGood
**Deskripsi**: Inbound Goods Receipt wajib mencatat 3 qty terpisah: Good (masuk stok), Reject (tidak dibayar), Free (bonus/gratis).
**Konteks**: Entity `GoodsReceipt`, fields `qtyGood`, `qtyReject`, `qtyFree`.
**Logika**:
```
sum = qtyGood + qtyReject + qtyFree  // WAJIB = qtyOrdered di PO
IF sum != poLine.qtyOrdered THEN error
stock += qtyGood (hanya yg good)
```
**Pesan Error**: `Total qty ({sum}) tidak sama dengan qty PO ({qty}). Mohon cek kembali.` / `GR_QTY_MISMATCH`
**Sumber Spec**: REQUIREMENT Poin 44, 50, 51, 53, 65
**Siapa Terlibat**: Warehouse (input), QC (verifikasi reject)
**Test Case**: PO 100 kg, datang 95 good + 3 reject + 2 free → total 100 ✓.

### BUS-RULE-019 — Pembayaran Supplier: Hanya qtyGood
**Deskripsi**: Pembayaran ke supplier hanya untuk barang kondisi Good. Reject → tidak dibayar (return/dispose).
**Konteks**: Entity `VendorInvoice`, 4-leg matching engine.
**Logika**:
```
billableQty = qtyGood (dari GR) - qtyReturned - qtyDiscrepancy
IF invoiceQty > billableQty THEN warning "Selisih {X} — perlu investigasi"
```
**Pesan Error**: `Pembayaran tidak bisa melebihi qtyGood ({X}). Mohon cek retur/reject.` / `PAYMENT_EXCEEDS_QTY_GOOD`
**Sumber Spec**: REQUIREMENT Poin (purchase-payment-only-good), NEX_FINANCE_FINAL_SPEC §2.2
**Siapa Terlihat**: SCM, Finance Admin
**Test Case**: PO 100 kg, 95 good + 5 reject → invoice max untuk 95 kg.

### BUS-RULE-020 — Vendor: Kategori Berdasarkan COA
**Deskripsi**: Kategori pengadaan vendor ditentukan dari **Kategori COA** saja, bukan field kategori terpisah.
**Konteks**: Entity `Supplier`, field `coaAccountId` → menentukan akun default saat Faktur Pembelian.
**Logika**:
```
IF supplier.coaAccountId IS NULL THEN error (PRIO-1)
invoiceDefaultAccount = supplier.coaAccountId (auto-fill di Faktur Pembelian)
```
**Pesan Error**: `Vendor wajib punya Kategori COA. Tanpa COA, akun jurnal tidak bisa di-resolve.` / `VENDOR_COA_REQUIRED`
**Sumber Spec**: REQUIREMENT Poin 3, NEX_FINANCE_FINAL_SPEC §2.1
**Siapa Terlibat**: Finance Admin (setup), Purchasing
**Test Case**: Vendor baru tanpa COA → blok save sampai COA dipilih.

### BUS-RULE-021 — PO: Sumber Pengambilan (PO atau Stok)
**Deskripsi**: Pengambilan barang ke produksi hanya boleh bersumber dari PO pembelian atau stok gudang, bukan random.
**Konteks**: Entity `InternalTransfer` (pindah gudang), validasi sumber.
**Logika**:
```
sourceType IN ('PO_ALLOCATION','STOCK_PICKING')
IF sourceType = 'STOCK_PICKING' THEN batch must exist & FEFO-OK
```
**Pesan Error**: `Barang harus bersumber dari PO atau Stok Gudang. Tidak boleh input manual.` / `SOURCE_TYPE_INVALID`
**Sumber Spec**: REQUIREMENT Poin (source-must-be-po-or-stock)
**Siapa Terlibat**: Warehouse, Produksi
**Test Case**: Ambil Aqua tanpa alokasi PO → blok.

### BUS-RULE-022 — PO: Approval Tanda Tangan Digital
**Deskripsi**: Penanggung jawab PO dan approval wajib tanda tangan digital di dokumen.
**Konteks**: Entity `PurchaseOrderApproval`, field `signatureUrl`.
**Logika**:
```
approval.action='APPROVED' requires signatureUrl != null
audit_logs.signature_url recorded
```
**Pesan Error**: `Tanda tangan digital wajib diupload sebelum approve.` / `SIGNATURE_REQUIRED`
**Sumber Spec**: REQUIREMENT Poin (digital-signature-po)
**Siapa Terlibat**: Approver (Head/Direktur)
**Test Case**: Approve tanpa upload signature → blok.

### BUS-RULE-023 — PO + Invoice Matching: 4-leg Exact Match, Accuracy di-HIDE
**Deskripsi**: Matching `PO ordered ↔ GR received ↔ QC passed ↔ Vendor Invoice` berjalan di belakang. Baseline NEX memakai **zero tolerance/exact match** karena REQUIREMENT final menonaktifkan auto-matching selisih nominal; persentase akurasi di-HIDE dari UI.
**Konteks**: Entity `VendorInvoice.status = 'MATCHED'|'EXCEPTION'`, frontend menyembunyikan angka %.
**Logika**:
```
payableQty = min(po.orderedQty, gr.receivedQty, qc.passedQty)
qtyVariance = invoice.qty - payableQty
priceVariance = invoice.unitPrice - po.unitPriceAfterDiscount
MATCHED only if qtyVariance == 0 AND priceVariance == 0
any variance → EXCEPTION and manual review; never auto-approve the difference
display only: 'Matched' / 'Exception' + nominal variance per field; hide matching percentage
```
**Pesan Error**: `Invoice memiliki selisih quantity/harga dan memerlukan review manual.` / `PURCHASE_MATCH_EXCEPTION`
**Sumber Spec**: REQUIREMENT §13 (auto matching selisih nominal dinonaktifkan; authoritative), NEX_FINANCE_FINAL_SPEC §2.2 (4-leg engine + hidden accuracy)
**Siapa Terlibat**: Finance Admin (lihat status)
**Test Case**: PO/GR/QC/Invoice sama persis → tampil "Matched" tanpa angka. Selisih Rp 50rb → tampil "Exception: Selisih harga Rp 50rb" dan tidak auto-approve.

### BUS-RULE-024 — DP Pembelian: Apply ke Invoice
**Deskripsi**: DP Pembelian yang sudah di-Posted otomatis muncul sebagai opsi apply saat Faktur Pembelian vendor sama dibuat.
**Konteks**: Entity `DownPayment` + `VendorInvoice`, saat vendor sama.
**Logika**:
```
IF exists(DP.vendorId == invoice.vendorId AND DP.status='POSTED' AND DP.remaining > 0) THEN
  show notification "DP Rp {X} tersedia untuk apply"
```
**Pesan Error**: (Notifikasi saja)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §2.3 + §2.2
**Siapa Terlibat**: Finance Admin
**Test Case**: DP Pembelian Rp 20jt ke vendor A, faktur baru vendor A Rp 100jt → notifikasi muncul, bisa apply.

### BUS-RULE-025 — PO: Range Harga Tetap (SOP)
**Deskripsi**: PO wajib tunduk pada SOP range harga (misal 0-10% di atas price reference terakhir). Override butuh approval.
**Konteks**: Entity `PurchaseOrder`, saat submit.
**Logika**:
```
referencePrice = lastPurchasePrice(item) OR movingAveragePrice(item)
IF poLine.price > referencePrice * 1.10 THEN require 'PriceOverride' approval
```
**Pesan Error**: `Harga {X} melebihi range SOP (max 110% dari Rp {ref}). Butuh approval khusus.` / `PRICE_OUT_OF_RANGE`
**Sumber Spec**: REQUIREMENT Poin (po-price-range-sop)
**Siapa Terlibat**: Purchasing (submit), Head Purchasing (override)
**Test Case**: Reference Rp 100rb, PO Rp 120rb → butuh override.

### BUS-RULE-026 — Vendor Master: Import Excel
**Deskripsi**: Vendor baru bisa di-import dari Excel dengan template khusus.
**Konteks**: Entity `Supplier`, route `/supplier-manage/import`.
**Logika**:
```
validate(rows):
  - name unik
  - coaAccountId exists
  - paymentTerm valid (Net 30/60/...)
preview(errorReport) -> commit
```
**Pesan Error**: (Per-baris, misal `Baris 5: Nama duplikat dengan vendor existing`)
**Sumber Spec**: REQUIREMENT Poin 1, NEX_FINANCE_FINAL_SPEC §2.1
**Siapa Terlibat**: Finance Admin
**Test Case**: Import 50 vendor dari CSV → preview tampilkan 48 OK + 2 error duplikat.

### BUS-RULE-027 — PO: HPP Cost Roll-Up Trigger
**Deskripsi**: Saat PO Posted, sistem otomatis kirim data kebutuhan HPP ke modul costing.
**Konteks**: Entity `PurchaseOrder` + `JobOrderCosting`, setelah Posted.
**Logika**:
```
po.status='POSTED':
  link poLine to jobOrder (if any)
  update JobOrderCosting.materialCost += poLine.amount
```
**Pesan Error**: (Silent automation)
**Sumber Spec**: REQUIREMENT Poin (hpp-from-purchase)
**Siapa Terlibat**: Finance (JO Costing)
**Test Case**: PO bahan baku Rp 50jt untuk JO-001 → materialCost JO-001 +50jt otomatis.

---

## 4. Production Rules (10 rules)

### BUS-RULE-028 — BatchRecord: Wajib Terhubung Schedule
**Deskripsi**: Setiap BatchRecord (CPKB/BMR) wajib punya `scheduleId` FK ke ProductionSchedule.
**Konteks**: Entity `BatchRecord`, field `scheduleId` (FK NOT NULL).
**Logika**:
```
IF scheduleId IS NULL THEN error (PRIO-1)
sales_details_id bridge preserved per DEC-017
```
**Pesan Error**: `Batch Record wajib terikat ke Schedule Produksi.` / `BATCH_SCHEDULE_REQUIRED`
**Sumber Spec**: DEC-017, _SSOT_FINAL §3.3, raw/production.md
**Siapa Terlibat**: PPIC, Produksi
**Test Case**: BMR tanpa schedule → blok simpan.

### BUS-RULE-029 — Tahap Produksi: Progresi Wajib Sequential
**Deskripsi**: Tahapan Mixing → Filling → Packaging harus sequential; tidak bisa loncat.
**Konteks**: Entity `BatchRecord`, field `currentStage`.
**Logika**:
```
stageOrder = ['MIXING','FILLING','PACKAGING']
currentStage hanya bisa maju ke stageOrder[i+1]
kembali ke previous stage butuh alesan + PIC supervisor
```
**Pesan Error**: `Tidak bisa langsung ke Filling sebelum Mixing selesai.` / `STAGE_ORDER_VIOLATION`
**Sumber Spec**: raw/production.md (Mixing/Filling/Packing pages)
**Siapa Terlibat**: Produksi, Supervisor
**Test Case**: BMR stage MIXING, klik "Selesai Filling" langsung → blok.

### BUS-RULE-030 — Mixing: Tolerance Berat (0.5%)
**Deskripsi**: Deviasi gramasi bahan > 0.5% dari target R&D butuh PIN Supervisor (override).
**Konteks**: Entity `BatchRecordLine`, field `actualWeight` vs `targetWeight`.
**Logika**:
```
deviation = abs(actualWeight - targetWeight) / targetWeight
IF deviation > 0.005 THEN require supervisorPin
```
**Pesan Error**: `Deviasi {X}% melebihi toleransi 0.5%. Butuh approval Supervisor.` / `WEIGHT_DEVIATION_EXCEEDED`
**Sumber Spec**: raw/production.md §3 Constraint 2
**Siapa Terlibat**: Operator Produksi, Supervisor
**Test Case**: Target 100 gram, aktual 101.2 gram → deviasi 1.2% → butuh override.

### BUS-RULE-031 — Mixing: FEFO Material Match-Gate
**Deskripsi**: Scan drum bahan harus sesuai BOM dan Batch yang dialokasikan SCM.
**Konteks**: Entity `BatchRecordMaterial`, field `scannedBatch`.
**Logika**:
```
validate(scannedBatch):
  - itemId == bomItemId
  - batch.fefoOrder == first
  - batch.status == 'ALLOCATED'
ELSE error
```
**Pesan Error**: `FEFO Violation: Batch {X} bukan yang harus dipakai. Harus Batch {Y}.` / `FEFO_VIOLATION`
**Sumber Spec**: raw/production.md §3 Constraint 1 + §4
**Siapa Terlibat**: Operator, Gudang
**Test Case**: Scan drum Aqua Batch #ABC (lebih baru) padahal harusnya Batch #XYZ → blok merah.

### BUS-RULE-032 — Filling: QC Interlock (Bulk Harus Lulus Uji)
**Deskripsi**: Bulk WIP hanya bisa di-Filling setelah status `APPROVED_BULK` (QC lulus).
**Konteks**: Entity `BatchRecord.stage='FILLING'`, field `wipBulkId`.
**Logika**:
```
IF wipBulk.qcStatus != 'APPROVED_BULK' THEN error
```
**Pesan Error**: `[AKSES DITOLAK: CURAH BELUM LULUS UJI LAB]` / `QC_BULK_NOT_APPROVED`
**Sumber Spec**: raw/production.md (Filling page) Constraint 1
**Siapa Terlibat**: QC, Produksi
**Test Case**: Drum bulk masih `WAITING_QC_BULK` → mesin Filling terkunci.

### BUS-RULE-033 — Filling: Mathematical Limit
**Deskripsi**: `goodOutput` tidak boleh melebihi batas teoritis (drum_kg / volume_botol_gram × safety_margin).
**Konteks**: Entity `BatchRecordFilling`, field `goodOutput`.
**Logika**:
```
maxOutput = (bulkRemainingKg * 1000 / targetVolumeGram) * 0.98  // 2% safety
IF goodOutput > maxOutput THEN error
```
**Pesan Error**: `Output {X} melebihi batas logis {max}. Periksa volume botol atau drum.` / `OUTPUT_EXCEEDS_PHYSICAL_LIMIT`
**Sumber Spec**: raw/production.md (Filling page) Constraint 2
**Siapa Terlibat**: Operator Produksi
**Test Case**: Drum 50 kg, botol 100g, max teoritis 500 pcs → input 510 → blok.

### BUS-RULE-034 — Packaging: Artwork Interlock (Legal APPROVED)
**Deskripsi**: Packaging hanya bisa jalan setelah status Artwork `APPROVED` di Legal/APJ.
**Konteks**: Entity `BatchRecord.stage='PACKAGING'`, field `artworkStatus`.
**Logika**:
```
IF artwork.status IN ('REVISION','EVALUATION') THEN error
```
**Pesan Error**: `Artwork belum APPROVED. Packaging terkunci.` / `ARTWORK_NOT_APPROVED`
**Sumber Spec**: raw/production.md (Packaging page) Constraint 1
**Siapa Terlibat**: Legal/APJ, Produksi
**Test Case**: Artwork masih REVISION → halaman Packaging terkunci.

### BUS-RULE-035 — Packaging: Traceability Encoding
**Deskripsi**: Backend permanen bind ID Bahan Baku, Botol, Label, Operator, QC ke QR Code FG.
**Konteks**: Entity `FinishedGood`, field `qrCodeData` (JSON composite key).
**Logika**:
```
on 'Selesai Packaging':
  qrCodeData = JSON{
    batchRecordId, materialBatchIds[], packagingBatchId, operatorId, qcInspectorId, finishedAt
  }
  immutable forever
```
**Pesan Error**: (Immutable — no error)
**Sumber Spec**: raw/production.md (Packaging page) Constraint 3
**Siapa Terlibat**: Sistem
**Test Case**: Scan QR FG → tampil timeline lengkap traceability.

### BUS-RULE-036 — Idle Time Alert (>24 jam)
**Deskripsi**: Batch yang tertahan > 24 jam di satu stage → alert merah ke Production Control Board.
**Konteks**: Entity `BatchRecord`, scheduler.
**Logika**:
```
idleHours = now - stageEnteredAt
IF idleHours > 24 THEN alert('Batch {no} idle > 24 jam di stage {stage}')
```
**Pesan Error**: (Alert, bukan blocking)
**Sumber Spec**: raw/quality_control.md (Rework & Hold Action Log)
**Siapa Terlibat**: PPIC, Supervisor
**Test Case**: BMR stuck di MIXING 30 jam → alert merah berkedip.

### BUS-RULE-037 — Packaging Creates Quarantined Finished Goods
**Deskripsi**: Saat "Selesai Packaging", output fisik berpindah dari WIP menjadi Finished Goods berstatus `QUARANTINE`. Kuantitas fisik tercatat, tetapi belum `AVAILABLE`, belum dapat dialokasikan, dan belum dapat dikirim sampai final QC release.
**Konteks**: Entity `StockMovement` + `BatchRecord.stage='PACKAGING'`, event-driven.
**Logika**:
```
on 'Selesai Packaging':
  stockMovement OUT(WIP, qty=goodFGOutput)
  stockMovement IN(FG, availability='QUARANTINE', qty=goodFGOutput)
  availableQty += 0
  auditLog: 'FG_QUARANTINE_FROM_PACKAGING'
```
**Pesan Error**: (Automation — alert jika gagal atomic)
**Sumber Spec**: ERP_INPUT_OUTPUT_LINEAGE §5 (Broken Lineage Fix), DEC-019 (no fallback)
**Siapa Terlibat**: Sistem, Gudang FG (verifikasi)
**Test Case**: Packaging selesai 5.000 pcs → physical FG quarantine +5.000, available FG tetap 0. Setelah QC release → quarantine -5.000 dan available +5.000.

---

## 5. R&D / Formulation Rules (8 rules)

### BUS-RULE-038 — Sample Brief: Wajib Bayar Sample Divalidasi Finance
**Deskripsi**: R&D hanya boleh menerima Sample Brief yang pembayaran sample-nya sudah divalidasi Finance.
**Konteks**: Entity `SampleRequest`, field `isPaymentVerified`.
**Logika**:
```
IF SampleRequest.isPaymentVerified != true THEN hide from R&D Inbox
R&D inbox filter: status='WAITING_RND_ACTION' AND isPaymentVerified=true
```
**Pesan Error**: (Hidden — not in inbox)
**Sumber Spec**: raw/r&d.md §1 Hard-Gate
**Siapa Terlibat**: BusDev (input PNF), Finance (validasi bayar), R&D (mulai kerja)
**Test Case**: PNF baru tanpa bayar sample → tidak muncul di inbox R&D.

### BUS-RULE-039 — Formulasi: Total Persentase Wajib 100%
**Deskripsi**: Total persentase semua bahan di semua fase harus tepat 100.00% sebelum tombol Lock Formula aktif.
**Konteks**: Entity `Formula` + `FormulaLine`, field `percentage`.
**Logika**:
```
totalPct = sum(formulaLines.percentage) // across all phases
IF abs(totalPct - 100.00) > 0.001 THEN disable 'Lock Formula' button
```
**Pesan Error**: `Total persentase {X}% belum 100%. Tombol Kunci Formula nonaktif.` / `FORMULA_NOT_100_PERCENT`
**Sumber Spec**: raw/r&d.md §2 Logic A (The 100% Rule), REQUIREMENT Poin (cpkb-100pct)
**Siapa Terlibat**: R&D Analyst
**Test Case**: Aqua 75% + Glycerin 5% + Niacinamide 5% → total 85%, tombol disabled.

### BUS-RULE-040 — Formulasi: Phase Separation (A/B/C/Fragrance)
**Deskripsi**: Bahan kimia harus dikelompokkan ke fase yang tepat (A=water phase, B=active, C=oil phase, dst).
**Konteks**: Entity `FormulaLine`, field `phase`.
**Logika**:
```
phase IN ('A','B','C','D','E','FRAGRANCE','PRESERVATIVE')
each phase represents distinct mixing step
```
**Pesan Error**: `Fase wajib dipilih (A / B / C / D / E / Fragrance / Preservative).` / `FORMULA_PHASE_REQUIRED`
**Sumber Spec**: raw/r&d.md (Phase Builder)
**Siapa Terlibat**: R&D
**Test Case**: Aqua di fase "Fragrance" → warning tidak konsisten (depends on validation).

### BUS-RULE-041 — Formulasi: Auto-Convert Persentase → Gram
**Deskripsi**: Input hanya persentase; berat gram dihitung otomatis dari Target Netto.
**Konteks**: Entity `FormulaLine`, field `actualWeight`.
**Logika**:
```
actualWeight = (percentage / 100) * targetNettoGram
read-only on UI, computed client-side
```
**Pesan Error**: (Read-only field)
**Sumber Spec**: raw/r&d.md §2 Logic B
**Siapa Terlibat**: R&D (visual saja)
**Test Case**: Persentase 5% × Target 1000g → actualWeight = 50g otomatis.

### BUS-RULE-042 — Formulasi: Live HPP Tracking & Valuasi Persediaan
**Deskripsi**: Estimasi HPP dan COGS dihitung real-time menggunakan Moving Weighted Average Cost yang dicatat dalam cost ledger/snapshot ter-audit per entitas legal dan item.
**Konteks**: Entity `Formula`, field `liveEstimatedHpp`; Entity `Goods`, cost snapshot / ledger.
**Logika**:
```
// Per DECISION_REQUIRED-002 (Resolved 2026-09-17):
// 1. Setiap GoodsReceipt, purchase return, stock adjustment, dan reversal memperbarui cost ledger:
newAverageCost = ((currentQty * currentAverageCost) + (receivedQty * poUnitPrice)) / (currentQty + receivedQty)
record_cost_ledger_entry(legalEntityId, itemId, eventType, qtyDelta, unitCost, newAverageCost, auditRef)

// 2. Estimasi HPP formulasi dan biaya konsumsi produksi:
for each line: lineCost = (actualWeight_kg) * itemCostLedger.movingAverageCost
totalHPP = sum(lineCost)
display: green if <= targetHPP, red if > targetHPP

// 3. Pemisahan Akuntansi vs Operasional Fisik:
// Physical picking gudang (FIFO/FEFO) tetap terpisah dari valuasi moving weighted average akuntansi.
```
**Pesan Error**: (UI indicator)
**Sumber Spec**: raw/r&d.md §2 Logic C, ERP_INPUT_OUTPUT_LINEAGE §1 (Pipeline HPP), DECISION_REQUIRED-002 (Resolved 2026-09-17)
**Siapa Terlibat**: R&D, Finance, SCM/Purchasing
**Test Case**: Niacinamide 25% × 1000g × Rp 250.000/kg = Rp 62.500 → indikator merah. Penerimaan barang baru memperbarui cost ledger secara atomik.

### BUS-RULE-043 — Formulasi: Version Control (V1, V2, V3) & Garis Keturunan Adjustment
**Deskripsi**: Revisi formula tidak hapus versi lama — clone ke versi baru, pertahankan history. Penyesuaian formulasi (`FormulationAdjustment`) memiliki riwayat terpisah dan tidak mengubah versi parent.
**Konteks**: Entity `Formula`, field `parentVersionId`, `versionNumber`; Entity `FormulationAdjustment`.
**Logika**:
```
// Per OD-SM-01 (Resolved 2026-09-17):
on 'Buat Versi Revisi':
  newFormula = clone(oldFormula)
  newFormula.parentVersionId = oldFormula.id
  newFormula.versionNumber = oldFormula.versionNumber + 1
  oldFormula.status = 'SUPERSEDED' (read-only)

on 'FormulationAdjustment Approved':
  // Adjustment dicatat sebagai ledger historis terpisah terhubung ke formulaId
  // TIDAK MENGUBAH DAN TIDAK MENAIKKAN versionNumber / rev_number parent formula
  record_adjustment_entry(formulaId, adjustmentDetails, approvedBy, auditRef)
  parentFormula.versionNumber KONTINU_TETAP (revisi hanya via formal R&D workflow)
```
**Pesan Error**: (No direct error)
**Sumber Spec**: raw/r&d.md §3 Pipeline (Version Control), OD-SM-01 (Resolved 2026-09-17)
**Siapa Terlibat**: R&D, BusDev, QC
**Test Case**: V1 LOCKED, klien minta revisi → V2 dibuat (V1 tetap LOCKED sebagai sejarah). FormulationAdjustment disetujui → V1 tetap V1, penyesuaian tersimpan di tabel audit/adjustment terpisah.

### BUS-RULE-044 — Formulasi: Lock = Immutable
**Deskripsi**: Formula berstatus LOCKED menolak semua PUT/PATCH.
**Konteks**: Entity `Formula.status='LOCKED'`.
**Logika**:
```
backend middleware: reject PUT/PATCH/DELETE if status='LOCKED'
edit only allowed if status='DRAFT' or 'FORMULATING'
```
**Pesan Error**: `Formula terkunci tidak bisa diedit. Buat Versi Revisi.` / `FORMULA_LOCKED_IMMUTABLE`
**Sumber Spec**: raw/r&d.md (Blueprint - Aturan Immutabilitas)
**Siapa Terlibat**: R&D, Backend
**Test Case**: PUT ke formula LOCKED → 422 error code.

### BUS-RULE-045 — Formula: BPOM Push Hanya dari LOCKED
**Deskripsi**: Push DIP ke Legal/BPOM hanya bisa dari formula berstatus LOCKED (komposisi absolut).
**Konteks**: Entity `Formula.status='LOCKED'`, button `Push DIP to Legal`.
**Logika**:
```
IF formula.status != 'LOCKED' THEN disable button
on click:
  post to legal BPOM Queue with INCI list sorted by % desc
```
**Pesan Error**: `Push ke BPOM hanya untuk formula LOCKED.` / `FORMULA_NOT_LOCKED_FOR_BPOM`
**Sumber Spec**: raw/r&d.md (Blueprint Tombol Aksi 2), REQUIREMENT Poin (BPOM-track)
**Siapa Terlibat**: R&D, Legal
**Test Case**: Formula FORMULATING → tombol disabled. Formula LOCKED → tombol aktif.

---

## 6. Warehouse Rules (10 rules)

### BUS-RULE-046 — Inbound: Status Default QUARANTINE
**Deskripsi**: Barang datang dari supplier masuk status QUARANTINE_DRUM dulu, **TIDAK langsung** ke Stok Tersedia.
**Konteks**: Entity `InventoryItem.status` saat GR Posted.
**Logika**:
```
on GoodsReceipt posted:
  inventory.status = 'QUARANTINE_DRUM'
  quarantine.stockQty += qtyGood
  available.stockQty += 0
  trigger notification to QC Tablet
```
**Pesan Error**: (Automation only)
**Sumber Spec**: raw/warehouse.md §3 Quarantine Gate
**Siapa Terlibat**: Warehouse, QC
**Test Case**: Barang Aqua datang 100 kg → status QUARANTINE, belum bisa diambil Produksi.

### BUS-RULE-047 — QC Release: Pindah ke Stok Tersedia
**Deskripsi**: QC klik "Lulus Uji Fisik" di tablet → bahan masuk atau Finished Goods QUARANTINE pindah ke Stok Tersedia.
**Konteks**: Entity `StockMovement.availability` setelah QC Release.
**Logika**:
```
qcInspection.status = 'RELEASED':
  create OUT movement from availability='QUARANTINE'
  create IN movement to availability='AVAILABLE'
  both movements share sourceEntityType/sourceEntityId and one idempotency key
```
**Pesan Error**: (Automation)
**Sumber Spec**: raw/warehouse.md §3 + quality_control.md §Inbound QC
**Siapa Terlibat**: QC Inspector
**Test Case**: QC RELEASED drum Aqua atau FG 5.000 pcs → status AVAILABLE, dapat dialokasikan. Pengulangan event tidak menggandakan stok.

### BUS-RULE-048 — Stok Movement: In = Out Balance
**Deskripsi**: Setiap Stock Movement wajib ada sumber jelas (PO, GR, SO, DO, Opname) — tidak ada adjustment tanpa evidence.
**Konteks**: Entity `StockMovement`, field `sourceType`, `sourceId`.
**Logika**:
```
sourceType IN ('PO_RECEIPT','SALES_DELIVERY','PRODUCTION_USAGE','OPNAME_ADJUST','TRANSFER','RETURN')
delta = newStock - oldStock
record movement with delta, reason, approver
```
**Pesan Error**: `Movement stok wajib punya source document.` / `MOVEMENT_SOURCE_REQUIRED`
**Sumber Spec**: raw/warehouse.md (Movement Engine)
**Siapa Terlibat**: Warehouse, Finance
**Test Case**: Adjust -50 kg tanpa source → blok.

### BUS-RULE-049 — Stock Opname: Auto-Approve Threshold
**Deskripsi**: Loss value saat opname ≤ Rp 500.000 → auto-approve. > Rp 500.000 → butuh approval Manager Gudang/Finance.
**Konteks**: Entity `StockOpnameAdjustment`, field `lossValue`.
**Logika**:
```
lossValue = abs(qtyFisik - qtySistem) * movingAveragePrice
IF lossValue <= 500000 THEN status='AUTO_APPROVED', stock langsung update
ELSE status='PENDING_AUDIT', notify Manager
```
**Pesan Error**: `Loss value {X} melebihi threshold auto-approve (Rp 500rb). Butuh approval.` / `OPNAME_LOSS_REQUIRES_APPROVAL`
**Sumber Spec**: raw/warehouse.md §2 Kendali Mutu A
**Siapa Terlibat**: Warehouse, Finance Manager
**Test Case**: Selisih 2 kg Aqua @ Rp 50rb/kg = Rp 100rb → auto-approve. Selisih 20 kg = Rp 1jt → pending audit.

### BUS-RULE-050 — Dead Stock Detection (>6 Bulan No Movement)
**Deskripsi**: Item tanpa movement > 6 bulan → flag Dead Stock, masuk Tabel III.D Risk Analytics.
**Konteks**: Entity `InventoryItem.lastMovementAt`, scheduler harian.
**Logika**:
```
daysIdle = today - lastMovementAt
IF daysIdle > 180 THEN flag = 'DEAD_STOCK'
```
**Pesan Error**: (Alert only)
**Sumber Spec**: raw/warehouse.md §3 C (Trigger FEFO/Dead Stock)
**Siapa Terlibat**: Warehouse, Purchasing
**Test Case**: Aqua 5 kg terakhir keluar 7 bulan lalu → flag merah di dashboard gudang.

### BUS-RULE-051 — Multi-Warehouse Access Control
**Deskripsi**: Stok dipisah per warehouseId; user hanya boleh akses warehouse sesuai role assignment.
**Konteks**: Entity `InventoryItem.warehouseId`, RBAC.
**Logika**:
```
user.accessibleWarehouses IN (SELECT warehouseId FROM user_warehouse_access)
if access missing, return 403 FORBIDDEN
```
**Pesan Error**: `Anda tidak punya akses ke Gudang {nama}.` / `WAREHOUSE_ACCESS_DENIED`
**Sumber Spec**: 07_RBAC_MATRIX.yaml, _SSOT_AUTH.md
**Siapa Terlibat**: Warehouse Admin, Superadmin
**Test Case**: Kepala Gudang Bahan Kimia coba akses Gudang FG → 403.

### BUS-RULE-052 — FIFO/FEFO Compliance: Auto-Enforce
**Deskripsi**: Saat Picking dari stok, sistem kunci pilihan ke Batch FEFO (raw) atau FIFO (packaging).
**Konteks**: Entity `InventoryAllocation`, field `pickBatch`.
**Logika**:
```
per material:
  if category='RAW_MATERIAL' then pickBatch = earliest expiryDate
  if category='PACKAGING' then pickBatch = earliest receivedDate
reject scan of other batch
```
**Pesan Error**: `FEFO VIOLATION: harus ambil Batch #{X}.` / `FEFO_VIOLATION` (sama dengan BUS-RULE-031)
**Sumber Spec**: raw/warehouse.md §3 B (FEFO Auto-Enforcer)
**Siapa Terlibat**: Warehouse Operator, Sistem
**Test Case**: Scan Batch #ABC (lebih baru) → blok merah.

### BUS-RULE-053 — Batch & Expiry Tracking: Mandatory Fields
**Deskripsi**: Inbound GR wajib isi `nomorBatchSupplier` dan `expiredDate` (tidak boleh kosong).
**Konteks**: Entity `GoodsReceiptLine`, fields `supplierBatchNumber`, `expiryDate`.
**Logika**:
```
IF supplierBatchNumber IS NULL OR expiryDate IS NULL THEN disable Save button (Hard-Gate)
```
**Pesan Error**: `Nomor Batch Supplier dan Expired Date wajib diisi.` / `BATCH_EXPIRY_REQUIRED`
**Sumber Spec**: raw/warehouse.md §2 A
**Siapa Terlibat**: Warehouse Operator
**Test Case**: GR tanpa expiry → tombol simpan disabled.

### BUS-RULE-054 — Production Reconciliation: Hutang Material
**Deskripsi**: Jika produksi pinjam 5 kg tapi hanya kembalikan 2 kg → WIP_HUTANG 3 kg, harus return sebelum BMR close.
**Konteks**: Entity `BatchRecord.materialReconciliation`.
**Logika**:
```
hutang = qtyDipinjam - qtyDikembalikan
IF hutang > 0 THEN status = 'WIP_PENDING_RETURN'
BatchRecord cannot close while hutang > 0
operator can declare 'tumpah/susut' (auto-write-off)
```
**Pesan Error**: `Hutang material {X} kg belum diselesaikan. BMR tidak bisa ditutup.` / `MATERIAL_HUTANG_PENDING`
**Sumber Spec**: raw/warehouse.md §3 C (Rekonsiliasi Otomatis)
**Siapa Terlibat**: Produksi, Warehouse
**Test Case**: Pinjam 5 kg Aqua, pakai 2.6, return 2 kg → hutang 0.4 kg → BMR terkunci.

### BUS-RULE-055 — Stock Opname Loss: Auto-Journal
**Deskripsi**: Setiap pengurangan stok tanpa Sales Order → otomatis generate Jurnal (Dr Beban Kerugian Persediaan / Cr Persediaan).
**Konteks**: Entity `StockMovement.sourceType='OPNAME_LOSS'`/`'DISPOSAL'`.
**Logika**:
```
on movement commit:
  postJournal: Dr Beban Kerugian Persediaan / Cr Inventory Account
```
**Pesan Error**: (Silent journal posting)
**Sumber Spec**: raw/warehouse.md §4 (Integrasi Jurnal)
**Siapa Terlibat**: Sistem, Finance (review jurnal)
**Test Case**: Dispose drum Aqua busuk 10 kg → jurnal auto terbentuk.

---

## 7. Finance Rules (15 rules)

### BUS-RULE-056 — Journal Entry Invariant: Debit = Kredit
**Deskripsi**: **Setiap journal entry** (auto atau manual) wajib balanced sebelum boleh Post.
**Konteks**: Entity `JournalEntry`, fields `totalDebit`, `totalCredit`.
**Logika**:
```
sum(lines.debit) == sum(lines.credit)
IF not equal THEN error 'Unbalanced Draft Journal'
card 'Unbalanced Draft Journal' harus 0
```
**Pesan Error**: `Jurnal tidak balance. Debit {X} ≠ Kredit {Y}.` / `JOURNAL_UNBALANCED`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §1.3, REQUIREMENT Poin 23
**Siapa Terlibat**: Finance Admin, Sistem
**Test Case**: Jurnal manual Rp 100rb Dr / Rp 80rb Cr → blok.

### BUS-RULE-057 — Auto-Journal per Transaksi (LOCKED)
**Deskripsi**: Setiap dokumen operasional (Posted) **wajib** otomatis generate journal entry via CoA Jurnal Otomatis rules. User tidak boleh input jurnal manual untuk transaksi harian.
**Konteks**: Entity semua `*Invoice`, `*Payment`, `*DownPayment`, `StockMovement` produksi.
**Logika**:
```
on document.status='POSTED':
  lookup CoA Auto Rule for documentType
  build journal lines
  save JournalEntry with source=documentId
```
**Pesan Error**: `Tidak ada CoA rule untuk dokumen {type}. Hubungi Finance Admin.` / `COA_RULE_MISSING`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §0.5 + §1.2, REQUIREMENT Poin 23-25
**Siapa Terlibat**: Sistem, Finance Admin (setup rules)
**Test Case**: Faktur Penjualan Posted → 1 jurnal otomatis Dr AR / Cr Revenue + Cr PPN.

### BUS-RULE-058 — AR Aging: 4 Buckets
**Deskripsi**: Aging buckets: 0-30 / 31-60 / 61-90 / >90 hari. Warna sesuai BUS-RULE-010.
**Konteks**: Entity `SalesInvoice`, dashboard report + widget BusDev.
**Logika**:
```
daysOverdue = today - dueDate
bucket = classify(daysOverdue) // per BUS-RULE-010
```
**Pesan Error**: (UI indicator)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.6, REQUIREMENT Poin 15
**Siapa Terlibat**: Finance, BusDev
**Test Case**: Invoice due 2026-09-01, hari ini 2026-09-16 → 15 hari → bucket 1-30 hijau.

### BUS-RULE-059 — AP Aging: Color Coding H-3/H-7
**Deskripsi**: AP Aging wajib color coding: H-7 kuning, H-3 merah, Overdue bold + pulse.
**Konteks**: Entity `VendorInvoice`, dashboard report-ap-aging.
**Logika**:
```
daysToDue = dueDate - today
IF 4 <= daysToDue <= 7 THEN yellow
IF 0 <= daysToDue <= 3 THEN red
IF daysToDue < 0  THEN bold + pulse animation
```
**Pesan Error**: (UI only)
**Sumber Spec**: REQUIREMENT Poin 10, NEX_FINANCE_FINAL_SPEC §2.5
**Siapa Terlibat**: Finance Admin
**Test Case**: Faktur vendor due 3 hari lagi → merah.

### BUS-RULE-060 — DP Legalitas: Post ke Client Escrow
**Deskripsi**: DP Penjualan kategori 'LEGALITAS' → posting ke akun Client Escrow Deposit (Liability), bukan AR Advance.
**Konteks**: Entity `DownPayment.category='LEGALITAS'`.
**Logika**:
```
IF dp.category='LEGALITAS' THEN
  Dr Bank/Cash / Cr Client Escrow Deposit (bukan AR Advance)
```
**Pesan Error**: (Silent routing)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §3.3 + §5.3, REQUIREMENT Poin 14
**Siapa Terlibat**: Finance Admin
**Test Case**: DP Legalitas Rp 20jt → bukan AR Advance, tapi Client Escrow.

### BUS-RULE-061 — Client Escrow: Tidak Pernah Masuk Revenue
**Deskripsi**: Deposit client (BPOM/HKI/uji lab) **tidak pernah** diakui sebagai Revenue Dreamlab.
**Konteks**: Entity `ClientEscrow`, semua transaksi escrow.
**Logika**:
```
Dr Bank/Cash / Cr Client Escrow Deposit (Liability)
Dr Client Escrow Deposit / Cr Bank/Cash (saat disbursement)
never touches Revenue or Expense P&L
```
**Pesan Error**: (Hard validation di journal posting)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §5.3
**Siapa Terlibat**: Finance Controller, Legal
**Test Case**: Client titip Rp 5jt untuk BPOM → bukan revenue, kewajiban escrow.

### BUS-RULE-062 — Currency: IDR Integer Only (MVP)
**Deskripsi**: Semua nilai uang disimpan & ditransmisikan sebagai **integer Rupiah** (DEC-028). Tidak ada decimal subunit di MVP.
**Konteks**: Semua entity finansial.
**Logika**:
```
DB: DECIMAL(18,2)
API: integer (smallest unit = IDR 1)
Frontend format dengan thousand separator
no floating-point arithmetic
```
**Pesan Error**: `Nilai tidak valid: harus integer Rupiah tanpa desimal.` / `CURRENCY_NOT_INTEGER`
**Sumber Spec**: DEC-028, 09_NON_FUNCTIONAL_CONTRACT §3
**Siapa Terlibat**: Sistem (backend)
**Test Case**: Rp 100.50 → invalid (tidak ada Rp 0.50 di IDR).

### BUS-RULE-063 — PPN Masukan: Auto-Compute kalau Vendor PKP
**Deskripsi**: Faktur Pembelian dari Vendor PKP=true → otomatis hitung PPN Masukan.
**Konteks**: Entity `VendorInvoice`, saat Posted.
**Logika**:
```
IF vendor.pkpStatus = true THEN
  ppnAmount = (subtotal - discount) * 0.11
  include PPN Masukan in journal posting
```
**Pesan Error**: (Silent compute)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §2.2, REQUIREMENT Poin 3
**Siapa Terlibat**: Finance Admin, Sistem
**Test Case**: Vendor PKP, subtotal Rp 100jt, diskon Rp 5jt → PPN Masukan Rp 10.45jt.

### BUS-RULE-064 — Period Lock: Soft vs Hard
**Deskripsi**: Periode yang sudah closing punya 2 level lock — soft (warning) dan hard (read-only, hanya via Adjustment Journal).
**Konteks**: Entity `AccountingPeriod`, field `lockType`.
**Logika**:
```
lockType='SOFT': posting allowed but warn user
lockType='HARD': posting blocked, must use AdjustmentJournal
AdjustmentJournal for HARD only, requires Finance Manager approval
```
**Pesan Error**: `Periode {periode} sudah hard-locked. Gunakan Adjustment Journal.` / `PERIOD_HARD_LOCKED`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §9.1 + §9.2
**Siapa Terlibat**: Finance Manager
**Test Case**: Tutup buku Agustus 2026 → soft lock. Final approval → hard lock. Transaksi Sept → warning Sept masih open.

### BUS-RULE-065 — CoA Auto Numbering per Tipe
**Deskripsi**: Kode akun auto-generated per tipe (1xxx Asset, 2xxx Liability, 3xxx Equity, 4xxx Revenue, 5xxx Expense).
**Konteks**: Entity `ChartOfAccounts`.
**Logika**:
```
accountCode = {prefix}{nextSequence}
prefix per type (lihat Lampiran B finance spec)
IF type='ASSET' THEN prefix='1'
...
```
**Pesan Error**: `Tipe akun tidak valid.` / `INVALID_ACCOUNT_TYPE`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §1.1 + Lampiran A.3
**Siapa Terlibat**: Finance Admin
**Test Case**: Tambah akun baru tipe Asset → kode `1xxx`.

### BUS-RULE-066 — Depresiasi: Auto-Post Bulanan
**Deskripsi**: Tombol "Run Depresiasi" / scheduled job bulan → post jurnal untuk semua asset aktif.
**Konteks**: Entity `Asset` + `DepreciationSchedule`, scheduler.
**Logika**:
```
FOR tiap asset.status='ACTIVE':
  monthlyAmount = acquisitionCost / usefulLifeMonths
  Dr Depreciation Expense / Cr Accumulated Depreciation
```
**Pesan Error**: `Run gagal: ada asset tanpa Acquisition Cost.` / `DEPRECIATION_INVALID_ASSET`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §6.2, REQUIREMENT Poin 29
**Siapa Terlibat**: Finance Admin (manual trigger), sistem (auto-scheduled)
**Test Case**: Asset Mobil Rp 200jt, masa manfaat 8 tahun → Rp 2.08jt / bulan.

### BUS-RULE-067 — Aset: Masa Manfaat Default per Kategori
**Deskripsi**: Kategori Inventaris=4 tahun, Motor=4 tahun, Mobil=8 tahun, Bangunan=20 tahun.
**Konteks**: Entity `Asset.category`.
**Logika**:
```
category='INVENTARIS' THEN usefulLifeYears=4
category='MOTOR' THEN usefulLifeYears=4
category='MOBIL' THEN usefulLifeYears=8
category='BANGUNAN_PERMANEN' THEN usefulLifeYears=20
ELSE require manual input
```
**Pesan Error**: `Kategori {X} belum punya default masa manfaat. Mohon input manual.` / `USEFUL_LIFE_MANUAL_REQUIRED`
**Sumber Spec**: REQUIREMENT Poin 29, NEX_FINANCE_FINAL_SPEC §6.2
**Siapa Terlibat**: Finance Admin
**Test Case**: Aset kategori "Mesin Produksi" → butuh input manual (belum ada default).

### BUS-RULE-068 — CoA Manual Journal: Allow Flag
**Deskripsi**: Akun kontrol (AP, AR, WIP) default `Allow Manual Journal = false`. Hanya akun accrual/adjustment yang boleh di-Post manual.
**Konteks**: Entity `ChartOfAccounts.allowManualJournal`.
**Logika**:
```
IF account.allowManualJournal = false AND journal.sourceType='MANUAL' THEN error
exception: AdjustmentJournal §9.2
```
**Pesan Error**: `Akun {code} tidak boleh diposting manual. Gunakan Adjustment Journal.` / `MANUAL_JOURNAL_BLOCKED`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §1.1 + §1.3
**Siapa Terlibat**: Finance Admin
**Test Case**: Manual jurnal Dr AR Control → blok (harus via Faktur).

### BUS-RULE-069 — Report Penjualan: Sidebar Rename
**Deskripsi**: Judul sidebar menu "Bayar Penjualan" diganti jadi **"Report Penjualan"** (link ke §11.5, bukan halaman Bayar Penjualan).
**Konteks**: UI sidebar navigation.
**Logika**:
```
sidebarMenu 'Bayar Penjualan' -> label='Report Penjualan', route=/report-sales-summary
```
**Pesan Error**: (UI rename, no runtime error)
**Sumber Spec**: REQUIREMENT Poin 14, NEX_FINANCE_FINAL_SPEC §11.5
**Siapa Terlibat**: Frontend
**Test Case**: Klik sidebar "Report Penjualan" → masuk ringkasan penjualan, bukan halaman Bayar Penjualan.

### BUS-RULE-070 — Laba Rugi: Urutan Card Wajib
**Deskripsi**: Urutan card di Laba Rugi: Total Pendapatan → Total Beban HPP → Laba Operasional Bersih. Tukar posisi HPP & Laba Operasional.
**Konteks**: UI dashboard `report-profit-loss`.
**Logika**:
```
cardOrder = [
  'TotalPendapatan',
  'TotalBebanHPP',
  'LabaOperasionalBersih'
]
```
**Pesan Error**: (UI ordering only)
**Sumber Spec**: REQUIREMENT Poin 32, NEX_FINANCE_FINAL_SPEC §11.2
**Siapa Terlibat**: Frontend
**Test Case**: Buka Laba Rugi → urutannya sesuai, bukan random.

---

## 8. HR Rules (5 rules) — Phase 2

### BUS-RULE-071 — Kontrak Karyawan: Alert 30 Hari Sebelum Expiry
**Deskripsi**: Kontrak karyawan yang akan expire dalam 30 hari → otomatis kirim alert ke HR.
**Konteks**: Entity `EmployeeContract`, scheduler harian.
**Logika**:
```
daysToExpiry = contract.endDate - today
IF 0 <= daysToExpiry <= 30 THEN notify(HR, 'Kontrak {employee} expire {date}')
```
**Pesan Error**: (Alert only)
**Sumber Spec**: raw/HR.md (Implicit), _SSOT_COMMUNICATION.md
**Siapa Terlibat**: HR
**Test Case**: Kontrak Agus expire 25 hari lagi → email + in-app notification.

### BUS-RULE-072 — Performance Scoring: Auto dari Event
**Deskripsi**: KPI karyawan dihitung otomatis dari event modul lain (sales, R&D, produksi, QC, SCM, design) — **TIDAK ada input manual performa** dari HR.
**Konteks**: Entity `EmployeeKpiResult` dan `EmployeePerformance`, listener events.
**Logika**:
```
on eligible business event:
  employeeId = event.payload[definition.attributionKey]
  persist evidence(event.id, event.type, entityType, entityId, actor field, occurredAt)
  recompute EmployeeKpiResult using definition.formulaRuleId
  recompute EmployeePerformance period aggregate

attribution memakai actor pada event saat kejadian; bukan assignee saat ini
denominator == 0 → value/score = null (N/A), bukan 0
late event → replay idempotent dengan calculationVersion baru
finalized period → immutable kecuali audited reopen
HR tidak dapat mengirim nilai score/achievement/weightedScore secara manual
```
**Pesan Error**: `Performa dihitung otomatis. Tidak bisa input manual.` / `PERFORMANCE_MANUAL_BLOCKED`
**Sumber Spec**: raw/HR.md (Passive Harvesting), KPI_REFERENCE.md, keputusan pengguna 2026-09-17 (per-person KPI diwajibkan)
**Siapa Terlibat**: Sistem, karyawan (own view), Division Manager/HR/Executive (scoped view)
**Test Case**: Nisa menutup 5 SO bulan ini → event yang memuat actor Nisa menjadi evidence; replay event yang sama tidak menggandakan hasil.

### BUS-RULE-073 — Salary: Gaji Pokok × Attendance + Lembur - Potongan
**Deskripsi**: Gaji bulanan = (Gaji Pokok × Hari Kerja Aktual) + Lembur (dari Form Lembur Approved) - Potongan (terlambat, alpha, cicilan).
**Konteks**: Entity `Payroll`, saat `[Generate Payroll]`.
**Logika**:
```
hariAktual = sum(attendance where status='PRESENT')
gajiPokok = employee.baseSalary / workingDaysPerMonth
totalGaji = gajiPokok * hariAktual
           + sum(overtime WHERE status='APPROVED')
           - sum(deductions)
```
**Pesan Error**: `Generate payroll gagal: ada Form Lembur belum di-approve.` / `PAYROLL_PENDING_OVERTIME`
**Sumber Spec**: raw/HR.md (Payroll & Settlement)
**Siapa Terlibat**: HR Admin, Bendahara (Finance)
**Test Case**: Agus gaji Rp 5jt, hadir 22 hari (dari 22 hari kerja) = full + lembur 2 jam = Rp 5jt + 200rb.

### BUS-RULE-074 — Dual-Role: Scorecard Per-Role Weighted
**Deskripsi**: Karyawan dengan 2 peran (misal Irma Keuangan + Purchasing) → 2 scorecard, weighted average untuk display.
**Konteks**: Entity `EmployeeRoleAssignment`, field `weight`, `validFrom`, `validTo`.
**Logika**:
```
activeAssignments = assignments overlapping scorecard period
sum(activeAssignments.weight) MUST equal 100
scoreCombined = sum(roleScore * role.weight) / sum(applicable role weights)
display scoreCombined
```
**Pesan Error**: `Total bobot peran aktif harus 100%.` / `KPI_ROLE_WEIGHT_INVALID`
**Sumber Spec**: raw/HR.md §3 (Solusi Dual-Role)
**Siapa Terlibat**: HR Admin
**Test Case**: Irma Keuangan 80 + Purchasing 70, weight 50:50 → score 75.

### BUS-RULE-075 — Reimburse: Auto-Trigger Kas Bank Keluar
**Deskripsi**: Form Reimburse yang di-approve → otomatis muncul di antrean Kas Bank Keluar Finance.
**Konteks**: Entity `Reimbursement.status='APPROVED'`.
**Logika**:
```
on Reimbursement APPROVED:
  create CashBankOut entry with ref reimburseId, status='PENDING_PAYMENT'
```
**Pesan Error**: (Automation)
**Sumber Spec**: raw/HR.md (Ticketing Area)
**Siapa Terlibat**: HR (approve), Bendahara (bayar)
**Test Case**: Reimburse bensin Rp 200rb approved → langsung muncul di Kas Bank Keluar.

---

## 9. Quality Control Rules (5 rules) — Phase 2

### BUS-RULE-076 — FTY (First Time Yield): Definisi
**Deskripsi**: FTY = (qty yang lolos 4 fase QC tanpa rework / qty awal) × 100. Target ≥ 95%.
**Konteks**: Entity `QCInspection`, dashboard `qc/dashboard/`.
**Logika**:
```
fty = (qtyLolosFirstTime / qtyMasuk) * 100
IF fty < 95 THEN card color red + alert
```
**Pesan Error**: (Indicator only)
**Sumber Spec**: KPI_REFERENCE.md §3.6, raw/quality_control.md §A
**Siapa Terlibat**: QC, Produksi
**Test Case**: 1000 pcs masuk, 950 lolos 4 fase tanpa rework → FTY 95%, hijau.

### BUS-RULE-077 — COPQ (Cost of Poor Quality): Definisi
**Deskripsi**: COPQ = total nilai Rupiah barang berstatus REJECTED bulan ini. Target ≤ 3% revenue.
**Konteks**: Entity `QCInspection.status='REJECTED'`.
**Logika**:
```
copq = sum(rejected.batchRecord.cost * rejected.qty)
revenueMonth = finance.totalRevenueMonth
copqPercent = copq / revenueMonth * 100
```
**Pesan Error**: (Indicator only)
**Sumber Spec**: KPI_REFERENCE.md §3.6, raw/quality_control.md §A
**Siapa Terlibat**: QC, Finance, Management
**Test Case**: Bulan ini reject Rp 5jt, revenue Rp 200jt → COPQ 2.5%, kuning.

### BUS-RULE-078 — Defect Categorization
**Deskripsi**: Tiap reject wajib dikategorikan: Botol Bocor / pH Out of Spec / Label Miring / Dll.
**Konteks**: Entity `QCInspection.defectCategory`.
**Logika**:
```
defectCategory IN ('BOTOL_BOCOR','PH_OOS','VISCOSITY_OOS',
                   'LABEL_MIRING','SEGEL_ROBEK','TUTUP_PECAH','LAINNYA')
category wajib diisi saat status='REJECTED'
```
**Pesan Error**: `Kategori defect wajib dipilih saat status REJECTED.` / `DEFECT_CATEGORY_REQUIRED`
**Sumber Spec**: raw/quality_control.md §B (Pareto Tipologi Cacat)
**Siapa Terlibat**: QC Inspector
**Test Case**: Reject tanpa kategori → blok simpan.

### BUS-RULE-079 — Quarantine Alert (>24 jam)
**Deskripsi**: Quarantine yang tertahan > 24 jam → alert merah berkedip, mencegah deterioration.
**Konteks**: Entity `QuarantineBatch`, scheduler.
**Logika**:
```
hoursHeld = now - quarantine.createdAt
IF hoursHeld > 24 THEN alert('Quarantine {batch} held > 24 jam, risiko deterioration')
```
**Pesan Error**: (Alert only)
**Sumber Spec**: raw/quality_control.md §C (Rework & Hold Action Log)
**Siapa Terlibat**: QC Manager, Supervisor
**Test Case**: Drum Aqua di karantina 30 jam → alert merah.

### BUS-RULE-080 — Vendor Watchlist Auto-Block
**Deskripsi**: Supplier dengan accept rate < 90% masuk Watchlist, tombol "Blokir Vendor" tersedia.
**Konteks**: Entity `Supplier.acceptanceRate`, dashboard QC.
**Logika**:
```
acceptanceRate = acceptedCount / totalDelivered * 100
IF acceptanceRate < 90 THEN addToWatchlist
on 'Blokir Vendor' click: supplier.isBlocked=true, hidden di PO creation
```
**Pesan Error**: (Notifikasi)
**Sumber Spec**: raw/quality_control.md §C (Critical Vendor Watchlist)
**Siapa Terlibat**: QC Manager, Purchasing
**Test Case**: Supplier X 15 reject dari 100 → masuk watchlist, blokir.

---

## 10. KPI Calculation Rules (10 rules)

### BUS-RULE-081 — CPL (Cost Per Lead)
**Deskripsi**: CPL = total biaya marketing / jumlah lead bulan ini. Direction: lower-better.
**Konteks**: Entity `Lead`, dashboard BusDev.
**Logika**:
```
cpl = marketingSpend / leadCount
```
**Pesan Error**: (KPI calc only)
**Sumber Spec**: KPI_REFERENCE.md §3.x
**Siapa Terlibat**: BusDev
**Test Case**: Spend Rp 5jt, 50 lead → CPL Rp 100rb.

### BUS-RULE-082 — Conversion Rate (Lead → Order)
**Deskripsi**: Conversion Rate = (jumlah SO / jumlah Lead) × 100. Target ≥ 20% (industry benchmark).
**Konteks**: Entity `SalesOrder`, dashboard BusDev.
**Logika**:
```
conversionRate = (salesOrderCount / leadCount) * 100
```
**Pesan Error**: (Indicator only)
**Sumber Spec**: KPI_REFERENCE.md §3.x
**Siapa Terlibat**: BusDev, Management
**Test Case**: 50 lead, 12 jadi SO → conversion 24%.

### BUS-RULE-083 — OEE (Overall Equipment Effectiveness)
**Deskripsi**: OEE = Availability × Performance × Quality. Target ≥ 85%.
**Konteks**: Entity `ProductionSchedule` + `BatchRecord`, dashboard Produksi.
**Logika**:
```
availability = actualRunTime / plannedProductionTime
performance = (idealCycleTime * totalPieces) / actualRunTime
quality = goodPieces / totalPieces
oee = availability * performance * quality * 100
```
**Pesan Error**: (Indicator only)
**Sumber Spec**: KPI_REFERENCE.md §3.1
**Siapa Terlibat**: Produksi, Maintenance
**Test Case**: A=90%, P=95%, Q=92% → OEE = 78.66%, kuning.

### BUS-RULE-084 — AR Aging (Bucket Distribution)
**Deskripsi**: Persentase nilai AR di bucket >90 hari harusnya ≤ 10% (healthy portfolio).
**Konteks**: Entity `SalesInvoice`, widget dashboard finance & BusDev.
**Logika**:
```
arOverdue90Value = sum(openInvoice.amount where daysOverdue > 90)
arTotal = sum(openInvoice.amount)
arOverdue90Pct = (arOverdue90Value / arTotal) * 100
IF arOverdue90Pct > 10 THEN card color red
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.2
**Siapa Terlibat**: Finance, Management
**Test Case**: Total AR Rp 1M, >90 hari Rp 50rb → 5%, hijau.

### BUS-RULE-085 — Customer Retention Rate
**Deskripsi**: Retention Rate = (jumlah customer repeat order tahun ini / total customer aktif) × 100. Target ≥ 60%.
**Konteks**: Entity `Customer` + `SalesOrder`, dashboard BusDev.
**Logika**:
```
repeatCustomers = count(distinct customer.id WHERE so.count(customer) >= 2 thisYear)
totalActiveCustomers = count(customer WHERE status='ACTIVE')
retention = (repeatCustomers / totalActiveCustomers) * 100
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.x
**Siapa Terlibat**: BusDev
**Test Case**: 100 customer aktif, 65 repeat order → retention 65%.

### BUS-RULE-086 — OTD (On-Time Delivery)
**Deskripsi**: OTD = (jumlah DO dikirim tepat waktu / total DO) × 100. Target ≥ 95%.
**Konteks**: Entity `DeliveryOrder` + `SalesOrder.dueDate`.
**Logika**:
```
deliveredOnTime = count(DO WHERE DO.deliveredAt <= SO.dueDate)
totalDO = count(DO thisMonth)
otd = (deliveredOnTime / totalDO) * 100
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.1
**Siapa Terlibat**: Warehouse, Produksi
**Test Case**: 100 DO, 96 dikirim sebelum dueDate → OTD 96%.

### BUS-RULE-087 — Collection Rate
**Deskripsi**: Collection Rate = (payment received / invoice total) × 100. Target ≥ 90%.
**Konteks**: Entity `CustomerPayment` + `SalesInvoice`.
**Logika**:
```
totalInvoiced = sum(invoice.amount thisMonth)
totalCollected = sum(payment.amount allocated thisMonth)
collectionRate = (totalCollected / totalInvoiced) * 100
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.2
**Siapa Terlibat**: Finance
**Test Case**: Invoice Rp 100jt, bayar Rp 95jt → 95%.

### BUS-RULE-088 — Expense Ratio
**Deskripsi**: Expense Ratio = (total expense / total revenue) × 100. Target ≤ 70%.
**Konteks**: Entity `JournalEntry` (akun 5xxx), dashboard finance.
**Logika**:
```
totalExpense = sum(journal.debit WHERE account.type='EXPENSE' thisMonth)
totalRevenue = sum(journal.credit WHERE account.type='REVENUE' thisMonth)
expenseRatio = (totalExpense / totalRevenue) * 100
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.2
**Siapa Terlibat**: Finance, Management
**Test Case**: Expense Rp 70jt, revenue Rp 100jt → 70%, kuning (boundary).

### BUS-RULE-089 — Net Profit Margin
**Deskripsi**: Net Profit Margin = (net profit / revenue) × 100. Target ≥ 15%.
**Konteks**: Entity `JournalEntry`, dashboard finance.
**Logika**:
```
netProfit = totalRevenue - totalExpense - cogs
margin = (netProfit / totalRevenue) * 100
```
**Pesan Error**: (Indicator)
**Sumber Spec**: KPI_REFERENCE.md §3.2
**Siapa Terlibat**: Management
**Test Case**: Revenue 100jt, expense 60jt, COGS 20jt → margin 20%, hijau.

### BUS-RULE-090 — KPI Threshold Direction (higher / lower / zero)
**Deskripsi**: KPI punya 3 direction semantics — higher-better, lower-better, zero-target. Threshold calculation universal.
**Konteks**: Semua KPI calculation.
**Logika**:
```
higherBetter: pct = (value / target) * 100
lowerBetter: pct = max(0, 100 - ((value - target) / target) * 100)
zeroTarget: pct = (value == 0) ? 100 : 0
```
**Pesan Error**: (Calculation rule)
**Sumber Spec**: KPI_REFERENCE.md §2 (Threshold Logic)
**Siapa Terlibat**: Sistem (frontend rendering)
**Test Case**: KPI "Defect Rate" (lower-better) value 3%, target 2% → pct = 50% (kuning).

Jika `target <= 0`, definisi KPI `LOWER` ditolak; gunakan direction `ZERO` untuk target nol.

### BUS-RULE-106 — Per-Person KPI Aggregate
**Deskripsi**: Scorecard individu per periode adalah agregasi berbobot dari KPI yang berlaku pada divisi/peran karyawan dan memiliki evidence valid.
**Konteks**: `KpiDefinition`, `EmployeeKpiResult`, `EmployeeRoleAssignment`, `EmployeePerformance`.
**Logika**:
```
applicable = results where achievementScore is not null
score = sum(achievementScore * definition.weight * roleWeight)
        / sum(definition.weight * roleWeight for applicable)
no applicable result → score = null (N/A)
```
Nilai di atas target boleh tetap tersimpan sebagai achievement mentah; batas tampilan/gamification tidak boleh mengubah evidence atau nilai mentah. Semua pembulatan hanya pada presentasi (2 desimal).
**Pesan Error**: `KPI belum memiliki evidence yang cukup untuk periode ini.` / `KPI_EVIDENCE_INSUFFICIENT`
**Sumber Spec**: KPI_REFERENCE.md + keputusan pengguna 2026-09-17
**Siapa Terlibat**: Sistem, Employee, Division Manager, HR, Executive, Auditor
**Test Case**: Dua KPI applicable berbobot 60:40 dengan achievement 80 dan 100 menghasilkan score 88; KPI N/A dikeluarkan dari penyebut.

---

## 11. Communication Rules (5 rules)

### BUS-RULE-091 — Tag User: Trigger Notifikasi
**Deskripsi**: `@username` di notes/comments → otomatis kirim in-app notification + email.
**Konteks**: Entity `Note`, `Comment`, `Tag`, `Notification`, dan outbox event.
**Logika**:
```
parse('@username'):
  lookup user by username
  lookup hanya user aktif yang dapat membaca entity induk
  IF found THEN stage Tag(taggedUserId=user.id)
transaction save:
  save Note/Comment + Tag rows + Notification rows + outbox entity.mention.created
  unique(parentType, parentId, taggedUserId) mencegah mention ganda
```
**Pesan Error**: `User @{username} tidak ditemukan.` / `MENTION_USER_NOT_FOUND`
**Sumber Spec**: DEC-012, _SSOT_COMMUNICATION.md §4
**Siapa Terlibat**: Semua user
**Test Case**: Note "@agus tolong cek mesin" → note dan Tag tersimpan atomik; Agus menerima in-app + email. User tanpa ACL tidak dapat dipilih/di-resolve.

### BUS-RULE-092 — Notification Deduplication
**Deskripsi**: Notifikasi yang sama untuk user yang sama dalam 1 jam → cukup 1 (agregat).
**Konteks**: Entity `Notification`.
**Logika**:
```
on new notification:
  IF same(userId, type, refId) exists within last 1 hour:
    increment count, skip new push
  ELSE:
    create new notification
```
**Pesan Error**: (Logic only)
**Sumber Spec**: _SSOT_COMMUNICATION.md
**Siapa Terlibat**: Sistem
**Test Case**: 5 approval request ke Agus dalam 1 jam → 1 notif "5 approval pending".

### BUS-RULE-093 — SLA Timer: Pending Approval
**Deskripsi**: Pending approval > 24 jam → escalation email ke next approver + cc supervisor.
**Konteks**: Entity `Approval`, scheduler.
**Logika**:
```
hoursPending = now - approval.submittedAt
IF hoursPending > 24 THEN escalate(nextApprover, cc=supervisor)
```
**Pesan Error**: (Alert only)
**Sumber Spec**: _SSOT_COMMUNICATION.md, DEC-007
**Siapa Terlibat**: Approver, Supervisor
**Test Case**: Approval Pengajuan Dana idle 25 jam → email ke Accounting + cc Kepala Divisi.

### BUS-RULE-094 — Cross-Reference Comment: Limited Scope
**Deskripsi**: Comment bisa cross-reference ke entity lain **HANYA jika memang berkaitan**.
**Konteks**: Entity `Comment`, field `crossReference`.
**Logika**:
```
UI shows confirm modal: 'Apakah comment ini terkait dengan {entity}?'
IF user confirms THEN save crossReference
ELSE no crossRef
```
**Pesan Error**: (UX guardrail, not blocking)
**Sumber Spec**: DEC-013
**Siapa Terlibat**: Semua user
**Test Case**: Comment di Sales Order link ke Batch Record → confirm → save. Random link ke unrelated SO → abort.

### BUS-RULE-095 — Communication: No Real-Time Chat
**Deskripsi**: **TIDAK ADA** fitur real-time chat di NEX. Communication hanya: notes, document transfer status, tags, cross-references.
**Konteks**: System-wide.
**Logika**:
```
no WebSocket / chat endpoint
no ChatRoom entity
notes + comments only
```
**Pesan Error**: `Fitur chat tidak tersedia. Gunakan notes.` / `CHAT_NOT_AVAILABLE`
**Sumber Spec**: DEC-004, _SSOT_COMMUNICATION.md
**Siapa Terlibat**: Semua user
**Test Case**: Cari menu "Chat" → tidak ada. Notes/comment berfungsi.

---

## 12. Cross-Cutting Rules (10 rules)

### BUS-RULE-096 — Soft-Delete Enforced at Prisma Middleware
**Deskripsi**: Semua DELETE operation diubah jadi soft-delete (`deletedAt = now()`). Auto-filter `deletedAt IS NULL` di middleware.
**Konteks**: Semua entity, Prisma middleware.
**Logika**:
```
on DELETE:
  prisma middleware intercept, set deletedAt=now(), save
  on read: auto-filter WHERE deletedAt IS NULL
  override: includeDeleted=true (audit-required)
```
**Pesan Error**: (Middleware logic, transparent)
**Sumber Spec**: DEC-027, 09_NON_FUNCTIONAL_CONTRACT §5
**Siapa Terlibat**: Sistem
**Test Case**: DELETE supplier → supplier masih ada tapi `deletedAt` terisi, query default hide.

### BUS-RULE-097 — Audit-First: Tulis Audit Sebelum ACK
**Deskripsi**: Setiap perubahan state wajib menulis audit log **sebelum** return response sukses ke client.
**Konteks**: Semua entity state change.
**Logika**:
```
on stateChange:
  insert auditLog({actor, entity, entityId, oldValue, newValue, timestamp})
  THEN commit transaction
  THEN return 200 OK
```
**Pesan Error**: `Audit log gagal ditulis. Transaksi rollback.` / `AUDIT_LOG_FAILED`
**Sumber Spec**: 09_NON_FUNCTIONAL_CONTRACT §6, DEC-027
**Siapa Terlibat**: Sistem
**Test Case**: Approve SO → audit_logs row dulu, lalu return success.

### BUS-RULE-098 — Multi-Tenant Isolation (organizationId)
**Deskripsi**: Setiap row wajib punya `organizationId`. Query auto-filter by user.organizationId.
**Konteks**: Semua entity, Prisma middleware.
**Logika**:
```
WHERE organizationId = currentUser.organizationId  // auto-injected
explicit cross-tenant access requires explicit grant
```
**Pesan Error**: `Akses lintas organisasi ditolak.` / `CROSS_TENANT_BLOCKED`
**Sumber Spec**: NFR (multi-tenant implicit), 07_RBAC_MATRIX
**Siapa Terlibat**: Sistem
**Test Case**: User org A coba GET entity org B → 404 atau 403.

### BUS-RULE-099 — Soft-Delete Orphan Prevention
**Deskensi**: Entity yang punya FK reference (child) tidak boleh soft-delete tanpa handle orphans.
**Konteks**: Entity dengan relasi 1:N.
**Logika**:
```
on DELETE:
  IF any child entity exists (FK referencing this):
    block OR cascade soft-delete children
    IF cascading: notify parent owner
```
**Pesan Error**: `Tidak bisa hapus: masih ada {N} dokumen terkait (misal: SO belum lunas).` / `SOFT_DELETE_HAS_CHILDREN`
**Sumber Spec**: NFR §5, DEC-027
**Siapa Terlibat**: Admin
**Test Case**: Soft-delete customer → ada 5 SO belum lunas → blok.

### BUS-RULE-100 — Error Code Canonical Mapping
**Deskripsi**: API response error pakai `error.code` (canonical), frontend switch berdasarkan code (bukan HTTP status).
**Konteks**: Semua API error response.
**Logika**:
```
response: { error: { code, message, field, details, trace_id } }
frontend: i18n.t('errors.' + code)
new code must register in 05_API_CONTRACT.yaml
```
**Pesan Error**: (Standard envelope)
**Sumber Spec**: DEC-030, 09_NON_FUNCTIONAL_CONTRACT §19
**Siapa Terlibat**: Backend, Frontend
**Test Case**: 422 business rule → `{ code: 'DP_MINIMUM_NOT_MET', message: 'DP minimum 50%...' }`.

### BUS-RULE-101 — Idempotency Key (24h TTL)
**Deskripsi**: POST/PUT/DELETE wajib support `Idempotency-Key` header. Server cache hasil 24 jam.
**Konteks**: Semua state-changing endpoints.
**Logika**:
```
on request:
  IF Idempotency-Key present:
    lookup cache (24h TTL)
    IF found: return cached response
    ELSE: process + cache result
  ELSE: process normally
```
**Pesan Error**: `Idempotency-Key sudah dipakai dengan payload berbeda.` / `IDEMPOTENCY_KEY_CONFLICT`
**Sumber Spec**: DEC-031, 09_NON_FUNCTIONAL_CONTRACT §9
**Siapa Terlibat**: Sistem, Frontend client
**Test Case**: Retry submit payment 3x karena network error → 1 transaksi sukses, 2 return cached.

### BUS-RULE-102 — Format Kode Universal (2 Versi)
**Deskripsi**: Kode dokumen/master data auto-generate dalam 2 versi (lengkap/ringkas), bisa dipilih via Setting.
**Konteks**: `formatKode.perusahaan`, `formatKode.divisi`, transaction generator.
**Logika**:
```
lengkap: {kode-perusahaan}-{divisi}-{produk}-{tanggal}-{nomor-urut}
ringkas: {produk}-{tanggal}-{nomor-urut}
nomor urut GLOBAL & BERKELANJUTAN (tidak reset per periode)
finance docs exception: per bulan per prefix (FP-YYMM-XXXX)
```
**Pesan Error**: (Generator only)
**Sumber Spec**: DEC-020, REQUIREMENT Poin 64-65, NEX_FINANCE_FINAL_SPEC Lampiran A
**Siapa Terlibat**: Sistem
**Test Case**: SO pertama 2026-06-29 → `DL-SAL-SO-29062026-0001`. SO kedua → `0002` (global).

### BUS-RULE-103 — Document Numbering Finance (Per Bulan Per Prefix)
**Deskripsi**: Khusus dokumen finance: sequence reset per bulan per prefix (FP-YYMM-XXXX).
**Konteks**: Entity financial documents.
**Logika**:
```
{prefix}-{YYMM}-{XXXX}
reset XXXX per YYMM per prefix
exception: Asset/SO/PO/Barang pakai global sequence
```
**Pesan Error**: (Generator only)
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §0.2
**Siapa Terlibat**: Sistem Finance
**Test Case**: FP-2609-0001, FP-2609-0002, FP-2610-0001 (reset Oktober).

### BUS-RULE-104 — CoA Delete: Deactivate, Not Hard Delete
**Deskripsi**: CoA yang sudah dipakai transaksi → tidak bisa hard-delete, hanya deactivate.
**Konteks**: Entity `ChartOfAccounts`.
**Logika**:
```
on DELETE:
  IF any journal entry references this account:
    block hard delete
    set isActive=false (soft)
  ELSE: hard delete allowed
```
**Pesan Error**: `Akun sudah dipakai transaksi. Deactivate saja.` / `COA_IN_USE`
**Sumber Spec**: NEX_FINANCE_FINAL_SPEC §1.1
**Siapa Terlibat**: Finance Admin
**Test Case**: Hapus akun 1101 Kas yang sudah ada jurnal → blok, set isActive=false.

### BUS-RULE-105 — Orphan Input/Output Removal (DEC-019, DEC-007)
**Deskripsi**: Hapus semua orphan inputs dan FALLBACK/MOCK data arrays. Sistem tampil error banner jika API gagal.
**Konteks**: Frontend Finance dashboard, HPP Request Board, CRM Client Manager, Stock Intelligence, dll.
**Logika**:
```
remove: FALLBACK_TRANSACTIONS, FALLBACK_AR, FALLBACK_AP, MOCK_CUSTOMERS,
        MOCK_PRODUCTS, MOCK_FORMULAS, DUMMY_SAMPLE_LEADS, DUMMY_PROSPECTS, DUMMY_CHURN
remove: stock-intelligence.service.ts (whole file)
on API error:
  show banner "Data tidak dapat dimuat. Coba lagi nanti."
  no fake numbers shown
```
**Pesan Error**: `Gagal memuat data dari server.` / `API_UNAVAILABLE`
**Sumber Spec**: DEC-007 (Stock Intel remove), DEC-019 (Finance Mock remove), ERP_INPUT_OUTPUT_LINEAGE §2-§3
**Siapa Terlibat**: Frontend, Sistem
**Test Case**: API down → banner merah, bukan angka dummy.

---

## 13. Operations Manual Notes

### 13.1 Skenario Error Umum (Indonesian)

#### A. "DP belum 50%, produksi tidak bisa mulai"
- Pesan sistem: `DP_MINIMUM_NOT_MET`
- Tindakan staf BusDev: Cek SO → Bayar Penjualan → tagih DP ke customer → Finance konfirmasi → status naik ke READY_PROD.
- Jika customer korporat punya Credit Limit override → BUS-RULE-005 berlaku.

#### B. "Stok barang tidak cukup untuk Picking"
- Pesan sistem: `INSUFFICIENT_STOCK` (terkait BUS-RULE-021).
- Tindakan Warehouse: Trigger PO otomatis dari SCM (lihat BUS-RULE-021 + ERP_INPUT_OUTPUT_LINEAGE §Smart Aggregator).
- Jika dead stock tersedia (BUS-RULE-050) → cek dulu sebelum PO baru.

#### C. "Jurnal tidak bisa di-Post"
- Pesan sistem: `JOURNAL_UNBALANCED` atau `MANUAL_JOURNAL_BLOCKED`.
- Tindakan Finance: Cek total debit vs kredit. Jika manual ke akun kontrol → pakai Adjustment Journal (BUS-RULE-068).
- Untuk periode hard-locked → pakai Adjustment Journal (BUS-RULE-064).

#### D. "Surat Jalan tidak bisa dicetak"
- Pesan sistem: `DELIVERY_GATE_HELD` (BUS-RULE-006).
- Tindakan Warehouse: Hubungi Finance. Finance verifikasi pelunasan 50% → ubah status ke RELEASED.
- Untuk client korporat → pakai Credit Limit Bypass approval.

#### E. "Batch Record terkunci di satu stage"
- Pesan sistem: `STAGE_ORDER_VIOLATION` atau `QC_BULK_NOT_APPROVED` atau `ARTWORK_NOT_APPROVED`.
- Tindakan Produksi: Cek urutan (BUS-RULE-029), QC status (BUS-RULE-032), atau Legal artwork (BUS-RULE-034).
- Idle > 24 jam → alert merah (BUS-RULE-036).

### 13.2 Edge Case Handling

#### F.1 Kembalian Pembayaran (Customer bayar lebih)
- Otomatis jadi AR Advance (BUS-RULE-015), bukan saldo nganggur.

#### F.2 Perubahan Customer Credit Limit setelah Invoice Posted
- Invoice lama **tidak** auto-revert. Invoice baru pakai limit baru.

#### F.3 Stock Adjustment tanpa source document
- **Tidak diizinkan**. WAJIB lewat Stock Opname atau Disposal (BUS-RULE-048).

#### F.4 Multiple DP dari customer untuk 1 SO
- Sum semua DP (BUS-RULE-002), kategori masing-masing tracked.

#### F.5 Mixed contract type dalam 1 invoice
- Contract type di-header override per-line jika ada campuran (BUS-RULE-005 + §3.2 finance).

### 13.3 Prosedur Override (Eskalasi)

| Level | Otoritas Override | Butuh Approval |
|---|---|---|
| Level 1 | Auto (system) | Tidak |
| Level 2 | Staff / Supervisor | Tidak |
| Level 3 | Head Divisi | Catatan di audit |
| Level 4 | Finance Controller | Audit + email |
| Level 5 | Director | Audit + approval kedua |

#### Override Umum:
1. Credit Limit (BUS-RULE-005): butuh Director + Finance Controller
2. Price Range PO (BUS-RULE-025): butuh Head Purchasing
3. Weight Tolerance Produksi (BUS-RULE-030): butuh PIN Supervisor
4. Period Hard Lock (BUS-RULE-064): butuh Adjustment Journal + Finance Manager
5. Soft Delete dengan child (BUS-RULE-099): butuh Admin dengan catatan

### 13.4 Yang TIDAK Boleh Dilakukan (Hard Constraints)

| TIDAK BOLEH | Alasan | Sumber |
|---|---|---|
| Hard-delete data produksi | Audit trail hilang | DEC-027, NFR §5 |
| Edit jurnal Posted | Audit corruption | NFR §6, NEX_FINANCE §0.3 |
| Posting ke periode hard-lock tanpa Adjustment Journal | Period integrity | BUS-RULE-064 |
| Real-time chat di NEX | DEC-004 | DEC-004 |
| Skip approval tier | Compliance breach | DEC-022, NEX_FINANCE §2.6 |
| Pakai FALLBACK/MOCK array di Finance dashboard | DEC-019 | DEC-019, ERP_INPUT_OUTPUT_LINEAGE §3.2 |
| Stock Intelligence module (ABC Analysis) | DEC-007 remove | DEC-007 |
| Currency float/desimal subunit di MVP | DEC-028 | DEC-028 |
| Soft-delete dengan orphan | Data integrity | BUS-RULE-099 |
| Posting ke akun kontrol via jurnal manual | Audit risk | BUS-RULE-068 |

---

## 14. References

### 14.1 SSOT & Kontrak Implementasi
- `00_MASTER_SPEC.md` — global principles, module cross-deps
- `01_DOMAIN_MODEL.md` — 78 entities catalog
- `02_DATA_OWNERSHIP.yaml` — (parallel draft) per-entity ownership
- `03_WORKFLOW_STATE_MACHINE.yaml` — (parallel draft) state transitions
- `07_RBAC_MATRIX.yaml` — role-based access control
- `09_NON_FUNCTIONAL_CONTRACT.md` — NFR (audit, soft-delete, idempotency, errors)
- `schema.prisma` — DB field constraints

### 14.2 Source Specs
- `NEX_FINANCE_FINAL_SPEC.md` — finance rules detail
- `NEX_ERP_MASTER_SPECIFICATION.md` — blueprint (193 KB)
- `REQUIREMENT.md` — Upii's 34 poin (SELALU MENANG per DEC-009)
- `KPI_REFERENCE.md` — KPI thresholds + formulas

### 14.3 Legacy Reference
- `LEGACY_ERP_SPEC.md` — G-SERP (live at kil.gserp.id)
- `NEX_ERP_SCREEN_AND_API_CATALOG.json` — 176 screens target
- `NEX_ERP_LIVE_AUDIT_AND_PARITY_REFERENCE.md` — parity gap analysis

### 14.4 Raw Modul Specs
- `raw/production.md` — Mixing/Filling/Packing pages
- `raw/warehouse.md` — Katalog/Stock/Pengadaan/Logistik/Opname
- `raw/quality_control.md` — FTY/COPQ/Inspector Workbench
- `raw/r&d.md` — Sample Brief/Pipeline/Phase Builder/Blueprint
- `raw/HR.md` — HR Command Center + Self-Service Portal
- `raw/ERP_INPUT_OUTPUT_LINEAGE.md` — orphan inputs/outputs + broken lineage

### 14.5 Process Docs
- `_PROCESS_DECISIONS_LOG.md` — DEC-001..034 LOCKED
- `_SSOT_AUTH.md` — authentication spec
- `_SSOT_COMMUNICATION.md` — notes/tags/cross-ref scope
- `_SSOT_KPI_BENCHMARK.md` — KPI source data

### 14.6 Authority and evidence

Tidak ada precedence chain lokal. Gunakan satu peta otoritas berbasis subjek di `00_MASTER_SPEC.md §9.1`. Requirement, DEC, SSOT lama, dan raw docs adalah bukti untuk memperbarui pemilik kanonik; default best-practice tidak boleh membuat keputusan bisnis diam-diam.

---

## 15. Sample / R&D / Creative / Legalitas Rules (P08)

> Canonical owner established by DEC-2026-09-20-051 (design/artwork approval) and
> DEC-2026-09-20-053 (permit record + expiry monitoring). Rules 107–114 encode the
> owner's business decisions of 2026-09-20. Rules 107 and 111 replace behaviour that
> the running implementation got wrong: `RndService.acceptSample` auto-approved the
> sample fee, and `CreativeService.unlockTask` cleared the revision lock without
> recounting the allowance.

### BUS-RULE-107 — Sample Fee: Finance Verification Gate
**Deskripsi**: Formulasi tidak boleh dimulai sebelum Finance memverifikasi bahwa biaya sample benar-benar sudah diterima. Tidak ada auto-approval.
**Konteks**: Entity `SalesSample` (live: `SampleRequest`), transisi `WAITING_FINANCE → IN_PROGRESS`, field `paymentApprovedAt` / `paymentApprovedById`.
**Logika**:
```
IF sample.payment_verified_at IS NULL THEN reject START_FORMULATION
IF sample.payment_verified_by IS NULL THEN reject START_FORMULATION
IF actor.role NOT IN ('FinanceStaff','FinanceAdmin') THEN reject VERIFY_SAMPLE_PAYMENT
ON VERIFY: set payment_verified_at = now(), payment_verified_by = actor.id
NEVER auto-set payment_verified_at implicitly on any other action
```
**Pesan Error**: `Pembayaran sample belum diverifikasi Finance.` / `SAMPLE_FEE_NOT_VERIFIED`
**Sumber Spec**: `03_WORKFLOW_STATE_MACHINE.yaml` sales_pipeline SalesSample; `state-transition.service.ts` gate `G1_SAMPLE`; DEC-2026-09-20-051
**Siapa Terlibat**: Finance, R&D
**Test Case**: Sample pada status WAITING_FINANCE → mulai formulasi ditolak `SAMPLE_FEE_NOT_VERIFIED`; setelah Finance memverifikasi → formulasi dimulai dan `paymentApprovedById` terisi.

### BUS-RULE-108 — Formulation Composition and Deterministic Conversion
**Deskripsi**: Total komposisi wajib tepat 100%; konversi persen→gram dan HPP wajib deterministik dan dapat direproduksi.
**Konteks**: Entity `Formulation` (live: `Formula`), `FormulaPhase`, `FormulaItem`.
**Logika**:
```
IF abs(sum(item.percentage) - 100) > 0.001 THEN reject SAVE   # COMPOSITION_TOTAL_INVALID
gram(item) = round(percentage / 100 * targetYieldGram, 3)
hpp       = sum(percentage * costSnapshot) / 100
SAME input MUST produce SAME gram and SAME hpp on every run
```
Satu implementasi dipakai bersama oleh jalur create dan jalur update — `gramFor()`,
`costPerGramFor()`, `compositionTotal()` di `formulas.service.ts` — supaya kedua jalur
tidak bisa menyimpang satu sama lain.
**Pesan Error**: `Total komposisi harus 100%.` / `COMPOSITION_TOTAL_INVALID`
**Sumber Spec**: REQUIREMENT Poin 11; `raw/r&d.md`; `formulas.service.ts` (`gramFor`, `costPerGramFor`, `compositionTotal`)
**Siapa Terlibat**: RnD Chemist, RnD Manager
**Test Case**: Komposisi 99.5% dan 100.001% ditolak; komposisi 100% menghasilkan gram dan HPP identik pada dua eksekusi berturut-turut.

### BUS-RULE-109 — Approved and Locked Revision Immutability
**Deskripsi**: Formula yang sudah disetujui atau terkunci menolak setiap perubahan. Perubahan wajib lewat revisi baru, bukan penulisan ulang.
**Konteks**: Entity `Formulation.status` (live `FormulaStatus`), `FormulaRevision`.
**Logika**:
```
IMMUTABLE = ('SAMPLE_LOCKED','PRODUCTION_LOCKED','SUPERSEDED')   # status terkunci + riwayat
IF formulation.status IN IMMUTABLE
   THEN reject UPDATE | DELETE of phases, items, targetYieldGram   # FORMULA_LOCKED
ALLOWED only: createRevision (baris baru, version++)
```
`SAMPLE_LOCKED` di-set `approveFormula()`, `PRODUCTION_LOCKED` di-set `lockProduction()`
setelah gate BPOM. `SUPERSEDED` ikut masuk himpunan karena revisi yang sudah digantikan
adalah riwayat beku — mengubahnya berarti menulis ulang sejarah.

Revisi dari induk yang terkunci **diizinkan**, justru karena revisi tidak menulis ulang
induknya (lihat BUS-RULE-114); itu satu-satunya jalur resmi untuk mengubah formula yang
sudah terkunci. Karena itu tidak ada klausa "tolak createRevision tanpa unlock".
**Pesan Error**: `Formula terkunci tidak dapat diubah.` / `FORMULA_LOCKED`
**Sumber Spec**: `03_WORKFLOW_STATE_MACHINE.yaml` rnd_pipeline Formulation; `02_DATA_OWNERSHIP.yaml` (delegation `Formulation.update`, condition `status in {DRAFT, SUBMITTED}`); `formulas.service.ts` (`assertMutable`)
**Siapa Terlibat**: RnD Chemist, RnD Manager, Head Ops
**Test Case**: Mutasi item pada formula `SAMPLE_LOCKED` dan `PRODUCTION_LOCKED` ditolak `FORMULA_LOCKED`; baris item dan nomor versi induk tidak berubah.

### BUS-RULE-110 — Artwork Approval Binds to an Exact Version
**Deskripsi**: Setiap keputusan approval desain wajib menunjuk versi artwork yang disetujui. Fakta ini disimpan, tidak disimpulkan dari urutan waktu.
**Konteks**: Entity `DesignFeedback.versionId` → `DesignVersion`, `DesignTask.kanbanState`.
**Logika**:
```
IF feedback.approvalStatus IN ('APPROVED','REJECTED') AND feedback.versionId IS NULL
   THEN reject SAVE
IF feedback.versionId != designTask.latestVersion.id THEN reject APPROVE
```
**Pesan Error**: `Keputusan desain harus menunjuk versi artwork.` / `DESIGN_VERSION_REQUIRED`
**Sumber Spec**: `01_DOMAIN_MODEL.md` DesignFeedback; DEC-2026-09-20-051
**Siapa Terlibat**: Desain, APJ, BusDev
**Test Case**: Approval tanpa `versionId` ditolak; approval yang menunjuk versi lama saat versi baru sudah ada ditolak.

### BUS-RULE-111 — Design Revision Bound, Lock, and Supervisor Reopen
**Deskripsi**: Desain yang sudah disetujui klien TIDAK terkunci permanen. Revisi masih boleh sampai batas 3 kali; desain terkunci hanya setelah batas itu. Setelah terkunci, supervisor boleh membuka dan jatah revisi dihitung ulang dari nol.
**Konteks**: Entity `DesignTask.revisionCount`, `DesignTask.isLocked`, `DesignTask.isFinal`.
**Logika**:
```
REVISION_BOUND = 3
ON client.request_revision:
   IF designTask.isLocked == true THEN reject BOUND_REACHED
   IF designTask.revisionCount >= REVISION_BOUND THEN reject BOUND_REACHED
   revisionCount += 1
   IF revisionCount >= REVISION_BOUND THEN isLocked = true
ON supervisor.reopen:
   IF actor.role NOT IN ('Director','SuperAdmin') THEN reject UNAUTHORIZED
   IF designTask.isLocked != true THEN reject NOT_LOCKED
   IF reopen_reason IS NULL THEN reject REASON_REQUIRED
   revisionCount = 0          # jatah dihitung ulang
   isLocked = false
   record the reopen in DesignFeedback history
```
**Pesan Error**: `Batas revisi desain sudah tercapai.` / `DESIGN_REVISION_BOUND_REACHED`
**Sumber Spec**: `creative.service.ts:29,127-152,384-437`; DEC-2026-09-20-052/055/056
**Siapa Terlibat**: BusDev (klien), Desain, Direktur
**Test Case**: Revisi ke-4 ditolak `DESIGN_REVISION_BOUND_REACHED`; reopen oleh non-Director ditolak; reopen oleh Director mengembalikan `revisionCount` ke 0 dan revisi berikutnya diterima.

### BUS-RULE-112 — Permit Record and Single Expiry Policy
**Deskripsi**: Izin (BPOM / HKI-Merek / Halal) dicatat dan dipantau kadaluarsanya. Tidak ada alur pengajuan izin di dalam P08. Satu kebijakan kadaluarsa berlaku untuk ketiga jenis izin.
**Konteks**: Entity `BpomRecord`, `HkiRecord`, `HalalRecord`, field `expiryDate`.
**Logika**:
```
daysLeft = ceil((expiryDate - today) / 1 day)
IF expiryDate IS NULL THEN status = NO_EXPIRY        # jangan dianggap hari ini
IF daysLeft <= 0  THEN status = EXPIRED
IF daysLeft <= 30 THEN status = CRITICAL
IF daysLeft <= 90 THEN status = WARNING
ELSE                   status = SAFE
Threshold set is identical for BPOM, HKI and Halal.
```
**Pesan Error**: `Izin sudah kadaluarsa.` / `PERMIT_EXPIRED`
**Sumber Spec**: `legality.service.ts:26-27,594-672,1113-1215`; DEC-2026-09-20-053
**Siapa Terlibat**: Legalitas, APJ
**Test Case**: Izin tanpa `expiryDate` berstatus `NO_EXPIRY` (bukan EXPIRED); izin dengan sisa 20 hari berstatus `CRITICAL` pada ketiga jenis izin.

### BUS-RULE-113 — Audit and Outbox Atomicity for Governed Writes
**Deskripsi**: Setiap penulisan terpantau P08, catatan auditnya, dan event outbox wajib commit bersama tepat sekali, atau gagal bersama.
**Konteks**: `platform/audit/audit.service.ts`, `platform/outbox/outbox.service.ts`.
**Logika**:
```
WITHIN one prisma.$transaction:
   businessWrite
   AND auditLog.create
   AND outboxEvent.create
IF audit deferred outside the transaction THEN reject AUDIT_NOT_ATOMIC
IF outbox opens its own transaction THEN reject OUTBOX_NOT_ATOMIC
Same idempotency key twice MUST produce exactly one business effect.
```
**Pesan Error**: `Penulisan tidak atomik dengan audit/outbox.` / `AUDIT_NOT_ATOMIC`
**Sumber Spec**: `_SSOT_AUTH.md`; DEC-029/DEC-031; `p07-negative-audit-outbox.unit-spec.ts`
**Siapa Terlibat**: semua modul P08
**Test Case**: Kegagalan antara penulisan bisnis dan audit menggulung keduanya; idempotency key yang sama dua kali hanya menghasilkan satu efek.

### BUS-RULE-114 — Adjustment Lineage Never Rewrites the Parent
**Deskripsi**: Penyesuaian atau rework membuat garis keturunan sendiri dan tidak pernah menulis ulang revisi yang sudah disetujui atau terkunci.
**Konteks**: Konsep kanonik `FormulationAdjustment` + `FormulaRevision`; kendaraan live-nya adalah `Formula.version` + `createRevision()` (tidak ada tabel adjustment terpisah di skema live — DEC-2026-09-20-062).
**Logika**:
```
ON adjustment.create (live: createRevision):
   copy parent.targetYieldGram, phases, items, qcparameter into a NEW row
   new.version = max(version of sampleRequest) + 1
   parent.version, parent.targetYieldGram, parent rows MUST remain unchanged
   parent.status := SUPERSEDED          # 03: old_formulation.marked_superseded
Rework of a LOCKED parent is ALLOWED and is the only sanctioned change path.
Adjustment MUST NOT mutate any parent phase or item row.
```
**Pesan Error**: `Penyesuaian tidak boleh mengubah revisi induk.` / `ADJUSTMENT_PARENT_IMMUTABLE`
**Sumber Spec**: `03_WORKFLOW_STATE_MACHINE.yaml` rnd_pipeline Formulation + FormulationAdjustment, `rnd_formulation_revisions`; `formulas.service.ts` (`createRevision`)
**Siapa Terlibat**: RnD Chemist, RnD Manager
**Test Case**: Membuat penyesuaian pada formula terkunci tidak mengubah nomor revisi induk, tidak mengubah satu baris item induk, dan meninggalkan baris induk tetap ada.

---

## Lampiran A — Coverage Matrix

### A.1 REQUIREMENT.md Coverage (34 Poin)

| Poin | Topik | BUS-RULE |
|---|---|---|
| 1 | Master Vendor + Import Excel | BUS-RULE-026 |
| 2 | Customer Card (Sample/Produksi/Legalitas) | BUS-RULE-001, NEX_FINANCE §3.1 |
| 3 | Kategori Vendor by COA | BUS-RULE-020, BUS-RULE-063 |
| 4 | Invoice Date Custom | BUS-RULE-003 |
| 5 | Import Excel Faktur | (implisit di Faktur Pembelian/Penjualan) |
| 6 | Disk-on + Hide Akurasi | BUS-RULE-017, BUS-RULE-023 |
| 7 | Navbar Filter + Notes | NEX_FINANCE §2.2 + §3.2 |
| 8 | Hide Akurasi 3-way | BUS-RULE-023 |
| 9 | Pola Bayar/DP | NEX_FINANCE §2.3 + §2.4 |
| 10 | AP Aging Color | BUS-RULE-059 |
| 11 | AP Aging Card | NEX_FINANCE §2.5 |
| 12 | Saldo Bank di AP Aging Navbar | NEX_FINANCE §2.5 |
| 13 | Faktur Penjualan sama dgn Pembelian | BUS-RULE-003, BUS-RULE-007 |
| 14 | DP Penjualan tab + Report Penjualan rename | BUS-RULE-004, BUS-RULE-008, BUS-RULE-069 |
| 15 | AR Aging di BusDev | BUS-RULE-010, BUS-RULE-058, BUS-RULE-084 |
| 16 | Kas Bank Masuk only Total Kas + date picker | NEX_FINANCE §4.2 |
| 17 | Kas Bank Keluar same as 16 | NEX_FINANCE §4.2b |
| 18 | Rekonsiliasi Bank date picker | NEX_FINANCE §4.3 |
| 19 | Filter COA di Rekonsiliasi | NEX_FINANCE §4.3 |
| 20 | Pengajuan Dana = Google Form | NEX_FINANCE §2.6 |
| 21 | Tiered Approval Staff/Head/Acc/Dir | NEX_FINANCE §2.6 |
| 22 | Pengajuan Dana = Persetujuan Pembelian | NEX_FINANCE §2.6 |
| 23 | Jurnal Umum filter periode | BUS-RULE-057, NEX_FINANCE §1.3 |
| 24 | Jurnal Umum format G-SERP | NEX_FINANCE §1.3 (perlu screenshot Upii) |
| 25 | Hapus Dimensi Finansial | NEX_FINANCE §0.1 |
| 26 | Search/autocomplete | NEX_FINANCE §0.7, DEC-013 |
| 27 | History pembelian aset | NEX_FINANCE §6.1 |
| 28 | Kode aset auto-generate | BUS-RULE-102, BUS-RULE-103, NEX_FINANCE §6.1 |
| 29 | Masa Manfaat (Inventaris 4 / Motor 4 / Mobil 8 / Bangunan 20) | BUS-RULE-067, NEX_FINANCE §6.2 |
| 30 | Buku Besar + Laba Rugi filter periode | NEX_FINANCE §1.4 + §11.2 |
| 31 | Card total Laba Rugi | NEX_FINANCE §11.2 |
| 32 | Tukar posisi card HPP & Laba Operasional | BUS-RULE-070, NEX_FINANCE §11.2 |
| 33 | Format Laba Rugi gabungan G-SERP + ERP Baru | NEX_FINANCE §11.2 (perlu screenshot Upii) |
| 34 | Modul Pajak tidak perlu (skip e-Faktur) | NEX_FINANCE §5.1 |
| 44 | Penerimaan Barang: free, reject, good | BUS-RULE-018 |
| 50 | (sama 44) | BUS-RULE-018 |
| 51 | (sama 44) | BUS-RULE-018 |
| 53 | (sama 44) | BUS-RULE-018 |
| 55 | Diskon & Ongkir wajib di PO | BUS-RULE-017 |
| 56 | (sama 55, + Format Kode Universal) | BUS-RULE-017, BUS-RULE-102 |
| 64-65 | Format Kode Universal | BUS-RULE-102, BUS-RULE-103 |

### A.2 Orphan Inputs/Outputs Coverage (5 items)

| Orphan | BUS-RULE |
|---|---|
| Input 1: sales-target → realization | BUS-RULE-105 + KPI dashboard recommendation (sales-target dengan `realizationPct` di API response) |
| Input 2: supplier.pajak auto-applied | BUS-RULE-063 (auto-calc PPN dari vendor PKP) + BUS-RULE-020 (Kategori COA) |
| Input 3: foto_opsional surfaced | (out of scope MVP — Surface di Surat Jalan Cetak dengan `<img>` tag, bukan rule bisnis terpisah) |
| Output 1: Stock Intelligence empty array | BUS-RULE-105 (REMOVE per DEC-007) |
| Output 2: Finance FALLBACK arrays | BUS-RULE-105 (REMOVE per DEC-019) |
| Output 3: HPP Request Board MOCK_CUSTOMERS | BUS-RULE-105 (replace dengan Master Customer/Formula backend) |
| Output 4: CRM Client Manager DUMMY arrays | BUS-RULE-105 (replace dengan SalesLead/LostDeal backend) |

### A.3 Broken Lineage Fix Coverage

| Broken Lineage | BUS-RULE |
|---|---|
| Production → FG stock auto-decrement | BUS-RULE-037 (NEW: auto-increment pada "Selesai Packaging") |

### A.4 Locked Decisions Coverage (DEC-001 to DEC-034)

| DEC | Topik | BUS-RULE |
|---|---|---|
| 001 | SSOT folder | (proses, no rule) |
| 002 | Doc-first workflow | (proses, no rule) |
| 003 | JWT auth | (covered in `_SSOT_AUTH.md`, NFR §7) |
| 004 | No real-time chat | BUS-RULE-095 |
| 005 | KPI scope (historical restriction; superseded 2026-09-17) | BUS-RULE-072, BUS-RULE-106 |
| 006 | Old ERP shutdown | (migration phase, no business rule) |
| 007 | Stock Intel REMOVE | BUS-RULE-105 |
| 008 | Finance SSOT | (referenced in all finance rules) |
| 009 | REQUIREMENT wins | Prioritas chain §1.4 |
| 010 | Live ERP baseline | (migration parity) |
| 011 | Auth data extraction | (Phase 6 task, no runtime rule) |
| 012 | Tag user feature | BUS-RULE-091 |
| 013 | Cross-ref limited | BUS-RULE-094 |
| 014 | Crawl coverage | (crawl strategy) |
| 015 | Cart pattern | BUS-RULE-013 |
| 016 | Child entity creation | NEX_FINANCE §0.3 |
| 017 | sales_details_id bridge | BUS-RULE-028 |
| 018 | Finance parallel routes | RESOLVED — kedua route berbagi satu store selama migrasi; canonical public route dipilih saat P7 cutover |
| 019 | Finance mock remove | BUS-RULE-105 |
| 020 | Format Kode Universal | BUS-RULE-102 |
| 021 | reCAPTCHA rotation | (security config, NFR §13) |
| 022 | Legacy hash verify | (Phase 6 migration task) |
| 023 | Orphan role cleanup | (Phase 6 migration task) |
| 024 | Permission slug preserve | (NFR §8 RBAC) |
| 025 | Legacy role ID preserve | (Phase 6 migration task) |
| 026 | Auth extraction complete | (completed) |
| 027 | Soft-delete middleware | BUS-RULE-096 |
| 028 | IDR integer | BUS-RULE-062 |
| 029 | Audit 3-tier retention | BUS-RULE-097 (high-level) |
| 030 | Canonical error code | BUS-RULE-100 |
| 031 | Idempotency keys | BUS-RULE-101 |
| 032 | Performance floor + coverage gate | (NFR §12 + CI gate) |
| 033 | Data residency ID | (hosting config, NFR §18) |
| 034 | S3 presigned upload | (file upload, NFR §10) |

### A.5 Validation Summary

- **37 requirement IDs covered**: 37/37 (100%), including REQ-035..037 for per-person KPI and communication evidence
- **5 Orphan inputs/outputs covered**: 5/5 (100%)
- **Broken lineage fixed**: 1/1 (100%)
- **DEC-001 to DEC-034 translated**: 23/34 (67% — sisanya proses/migration/NFR yang tidak butuh rule bisnis)
- **Total rules defined**: 114 (BUS-RULE-001 to BUS-RULE-114)
- **Owner decisions 2026-09-20 (long form `DEC-2026-09-20-051..059`)** translated: 8/8 — see §15 and `process/_PROCESS_DECISIONS_LOG.md`. These are additive and do not amend any DEC-001..034 entry.

---

## Lampiran B — Resolution Notes

1. Route `/finance/jurnal-umum` dan `/finance/general-journal` dipertahankan selama migrasi tetapi menggunakan backend/store yang sama; canonical public route dipilih saat P7 cutover (DEC-018).
2. Presisi visual Jurnal Umum dan Laba Rugi mengikuti screen contract dan dapat dibandingkan ulang saat live UI tersedia; screenshot bukan sumber perilaku bisnis.
3. Sales Target vs Realization memiliki halaman, API, RBAC, dan model canonical (`SalesTarget`); dashboard boleh memakai agregat dari sumber yang sama.
4. Foto Surat Jalan disimpan sebagai `photoUrl`/attachment dan ditampilkan pada detail/verification view; bukan field wajib cetak.
5. Tidak ada pengecualian diam-diam terhadap performance floor. Perubahan SLA endpoint harus melalui NFR dan decision log.
6. Threshold Stock Opname tetap Rp 500.000 sesuai BUS-RULE-052 dan RBAC approval threshold sampai ada keputusan bisnis baru.

---

## BUS-RULE-AUDIT-ATOMIC (P05)

Setiap governed mutation (state-changing business operation) WAJIB menulis audit row
dalam transaksi database yang sama dengan mutasi itu sendiri. Setelah mutasi
berhasil, audit row HARUS sudah ada (`AUDIT_NOT_ATOMIC` jika sebaliknya). Audit
row immutable: UPDATE/DELETE pada `audit_logs` selalu gagal
(`AUDIT_MUTATION_FORBIDDEN`). Lihat `09_NON_FUNCTIONAL_CONTRACT.md §8` dan
`backend/src/platform/audit/audit.service.ts`.

## BUS-RULE-OUTBOX-ATOMIC (P05)

Setiap mutasi yang menghasilkan event eksternal WAJIB menulis outbox row dalam
transaksi database yang sama dengan mutasi (`OUTBOX_NOT_ATOMIC` jika sebaliknya).
Idempotency key = sha256(eventType + aggregateType + aggregateId + payloadDigest).
Worker reclaim lease (30s) — duplicate key ditolak unique constraint
(`OUTBOX_DUPLICATE`). Backoff 1s/5s/30s/2m/10m, 5 attempt lalu `DEAD_LETTER`.
Lihat `08_INTEGRATION_EVENT_CONTRACT.yaml`, `09_NON_FUNCTIONAL_CONTRACT.md §8`,
dan `backend/src/platform/outbox/outbox.service.ts`.

---

**Dokumen ini FINAL untuk dirujuk. Update WAJIB lewat DEC baru di `_PROCESS_DECISIONS_LOG.md`. | Versi: 1.1 | Tanggal: 2026-09-18**
