# [SCR-032] Faktur Pembelian (Purchase Invoices / AP Bills)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/faktur-pembelian`
- **Legacy GsERP URL:** `/purchase-invoice`
- **Menu Sidebar:** `4. PEMBELIAN & PENGADAAN > Faktur Pembelian`
- **Hak Akses (RBAC):** `PURCHASING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan tagihan invoice vendor atas penerimaan barang (PO) untuk membentuk saldo Hutang Usaha (AP).

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Faktur`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Faktur | `invoiceDate` | `DD/MM/YYYY` | Left |
| 3 | No. Faktur Internal | `invoiceNumber` | Clickable Link: `INV-PO-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. PO Terkait | `poNumber` | Link ke dokumen PO terkait | Left |
| 5 | Vendor / Supplier | `supplierName` | Nama Supplier (Bold) | Left |
| 6 | No. Tagihan Vendor | `vendorBillRef` | Teks No Faktur Fisik dari Vendor | Left |
| 7 | Total Tagihan | `grandTotal` | `Rp #.##0` (Font tabular-nums) | Right |
| 8 | Sisa Hutang | `remainingBalance` | `Rp #.##0` (Warna amber jika belum lunas) | Right |
| 9 | Tanggal Jatuh Tempo | `dueDate` | `DD/MM/YYYY` (Merah jika lewat jatuh tempo) | Left |
| 10 | Status | `status` | Badge 1 Baris: `BELUM_DIBAYAR`, `DIBAYAR_SEBAGIAN`, `LUNAS`, `BATAL` | Center |
| 11 | Aksi | `actions` | Tombol: `Lihat`, `Bayar Sekarang`, `Cetak Faktur` | Center |

---

## 3. Secondary Window: Form Input Faktur Pembelian (Centered Floating Window)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`) dengan backdrop overlay (BUKAN side drawer).
- **Trigger:** Tombol `+ Buat Faktur Pembelian`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| No. Faktur Internal | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Otomatis dibuat sistem: `INV-PO-{YYYYMMDD}-{XXXX}` |
| Pilih Dokumen PO | **SEARCH-SELECT** | SearchSelect Dropdown | Mandatory | **Hanya memunculkan PO yang statusnya `RECEIVED`**. Read-only setelah dipilih |
| Tanggal Faktur | Manual Input | DatePicker | Mandatory | Default: Hari ini |
| Tanggal Jatuh Tempo | Auto / Manual | DatePicker | Mandatory | **Otomatis dihitung:** Tanggal Faktur + Term of Payment Supplier |
| No. Faktur / SJ Vendor | Manual Input | TextInput | Opsional | Nomor fisik faktur atau surat jalan dari supplier |
| Rincian Barang & Nilai | **AUTO-POPULATE** | Table Grid | Read-Only | Otomatis ditarik dari penerimaan PO (Qty, Harga Satuan, Diskon) |
| Pajak PPN 11% | Auto Toggle | Select | Mandatory | Otomatis tercentang jika PO berpajak |
| Catatan Faktur | Manual Input | TextArea | Opsional | Instruksi rekening pembayaran vendor |

---

## 4. Jurnal Otomatis (Saat Status = POSTED)
* *Debit:* 110401 Persediaan Bahan Baku (atau Biaya Operasional)
* *Debit:* 110801 PPN Masukan
* *Kredit:* 210101 Hutang Usaha Vendor (AP)
