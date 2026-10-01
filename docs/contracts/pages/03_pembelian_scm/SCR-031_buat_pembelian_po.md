# [SCR-031] Buat Pembelian (Purchase Orders / PO)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/scm-pembelian`
- **Legacy GsERP URL:** `/purchase` & `/purchase/create`
- **Route Alias (Fix 404):** `/scm/pembelian/create` di-redirect langsung ke `/pembelian/scm-pembelian?action=create`
- **Menu Sidebar:** `4. PEMBELIAN & PENGADAAN > Buat Pembelian (PO)`
- **Hak Akses (RBAC):** `PURCHASING`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Pembuatan dan penerbitan Purchase Order resmi kepada supplier/vendor bahan baku dan kemasan, pemantauan status pengiriman, dan pencatatan komitmen biaya.

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal PO`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal PO | `poDate` | `DD/MM/YYYY` | Left |
| 3 | No. PO | `poNumber` | Clickable Link: `PO-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. PR Terkait | `prNumber` | Link ke PR (atau `-` jika PO langsung) | Left |
| 5 | Vendor / Supplier | `supplierName` | Nama Supplier (Bold) | Left |
| 6 | Total Nilai PO | `grandTotal` | `Rp #.##0` (Font tabular-nums) | Right |
| 7 | Estimasi Tiba (ETA) | `estimatedArrival` | `DD/MM/YYYY` | Left |
| 8 | Status Dokumen | `status` | Badge 1 Baris: `DRAFT`, `WAITING_APPROVAL`, `APPROVED`, `SENT_TO_VENDOR`, `PARTIALLY_RECEIVED`, `COMPLETED`, `CANCELLED` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat`, `Cetak PO`, `Buat Faktur`, `Batal` | Center |

---

## 3. Secondary Window: Form Input PO Baru (Centered Floating Window)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-5xl`) dengan backdrop overlay gelap (BUKAN side drawer).
- **Trigger:** Tombol `+ Buat PO` atau parameter `?action=create`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| Nomor PO | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format Universal: `PO-{YYYYMMDD}-{XXXX}` |
| Tanggal PO | Manual Input | DatePicker | Mandatory | Default: Hari ini |
| Supplier | Manual Input | SearchSelect | Mandatory | Pilih Supplier aktif (auto-load TOP & Alamat) |
| Tarik dari PR | Manual Input | SearchSelect | Opsional | Pilih PR approved untuk auto-fill keranjang barang |
| Estimasi Tiba (ETA) | Manual Input | DatePicker | Mandatory | Tanggal perkiraan kiriman tiba di gudang pabrik |
| Syarat Pembayaran | Auto / Manual | Select | Mandatory | Otomatis dari Master Supplier: COD, Net 30, DP 50% |
| Keranjang Barang | Dynamic Grid | Table Multi-line | Mandatory | Item Barang, Satuan, Qty, Harga Satuan, Diskon %, Subtotal |
| Pajak PPN | Toggle Switch | Select | Mandatory | PPN 11% / Bebas Pajak |
| Ongkos Kirim | Manual Input | CurrencyInput | Opsional | Nilai freight jika ditanggung pembeli |
| Catatan / Instruksi PO | Manual Input | TextArea | Opsional | Instruksi spesifikasi COA, kemasan palet, dll. |

---

## 4. Secondary Window: Spesifikasi Cetak PO (Purchase Order Document A4)
- **KOP Surat:** PT. Karya Impian Laboratoris.
- **Isi Dokumen:** Informasi Supplier & PIC, Alamat Kirim Gudang Pabrik, Rincian Barang (Item, Qty, Satuan, Harga, Total), Term of Payment, dan 3 Kotak Tanda Tangan: *Dibuat Oleh (Purchasing), Disetujui Oleh (Direktur/Finance), Dikonfirmasi (Supplier)*.
