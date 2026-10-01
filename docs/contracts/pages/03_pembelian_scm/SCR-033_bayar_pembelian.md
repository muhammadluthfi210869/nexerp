# [SCR-033] Bayar Pembelian (Vendor Payments / AP Disbursement)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/bayar-pembelian`
- **Legacy GsERP URL:** `/purchase-payment`
- **Menu Sidebar:** `4. PEMBELIAN & PENGADAAN > Bayar Pembelian`
- **Hak Akses (RBAC):** `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pembayaran dan pelunasan faktur vendor melalui rekening kas/bank perusahaan serta pencatatan voucher pengeluaran dana.

---

## 2. Redesign Card Dana Likuid & Ringkasan AP (UI Proporsional)
> **Penyelesaian Masalah:** Card tidak boleh berukuran kerdil/menciut. Gunakan grid responsive `grid-cols-1 md:grid-cols-3 gap-4 mb-6`.

| Card Label | Rumus / Sumber Data | Format | Varian Visual |
|---|---|---|---|
| Total Dana Likuid Kas & Bank | Saldo berjalan seluruh Rekening Kas & Bank aktif | `Rp #.##0` | Emerald (Aman) |
| Total Tagihan AP Jatuh Tempo (<7 Hari) | Sum tagihan vendor jatuh tempo $\le$ H+7 | `Rp #.##0` | Amber (Perhatian) |
| Total Pembayaran Keluar Bulan Ini | Sum voucher bayar yang sudah `POSTED` bulan ini | `Rp #.##0` | Slate / Blue |

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Pembayaran`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Bayar | `paymentDate` | `DD/MM/YYYY` | Left |
| 3 | No. Voucher Bayar | `paymentNumber` | Clickable Link: `PAY-PO-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. Faktur Terbayar | `invoiceNumber` | Link ke Faktur Pembelian | Left |
| 5 | Vendor / Penerima | `supplierName` | Nama Vendor (Bold) | Left |
| 6 | Rekening Kas / Bank Asal | `bankAccount` | Nama Bank + No Rekening | Left |
| 7 | Jumlah Dibayar | `amountPaid` | `Rp #.##0` (Font tabular-nums) | Right |
| 8 | Status | `status` | Badge 1 Baris: `PROSES`, `POSTED_LUNAS`, `BATAL` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Voucher`, `Cetak Bukti Pengeluaran Kas (BKK)` | Center |

---

## 4. Jurnal Otomatis Pembayaran
* *Debit:* 210101 Hutang Usaha Vendor (AP)
* *Kredit:* 110101 Kas / 110201 Bank BCA (Rekening Asal)
