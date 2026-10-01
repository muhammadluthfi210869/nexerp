# [SCR-028] Retur Penjualan (Sales Return & Credit Notes)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/retur-penjualan`
- **Legacy GsERP URL:** `/sales-return`
- **Menu Sidebar:** `7. PENJUALAN & TRANSAKSI > Retur Penjualan` (DIPULIHKAN DARI STATUS HILANG)
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `FINANCE`, `WAREHOUSE`, `SUPERADMIN`
- **Tujuan Operasional:** Pencatatan pengembalian produk jadi dari klien karena reject/cacat kemasan/kesalahan kirim, penerbitan Credit Note pengurang piutang, dan karantina barang retur.

---

## 2. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Retur`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Retur | `returnDate` | `DD/MM/YYYY` | Left |
| 3 | No. Retur | `returnNumber` | Clickable Link: `SR-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. Faktur / SO | `invoiceRef` | Link Dokumen Faktur Terkait | Left |
| 5 | Pelanggan / Brand | `customerBrand` | Pelanggan (Bold) + Brand | Left |
| 6 | Nilai Retur | `totalReturnValue` | `Rp #.##0` (Font tabular-nums) | Right |
| 7 | Tipe Penyelesaian | `settlementType` | Badge 1 Baris: `POTONG_TAGIHAN`, `GANTI_BARANG`, `REFUND` | Center |
| 8 | Status Dokumen | `status` | Badge 1 Baris: `PROSES_INSPEKSI`, `QC_PASSED`, `SELESAI`, `DITOLAK` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat`, `Approval Credit Note`, `Cetak Form Retur` | Center |

---

## 3. Secondary Window: Form Input Retur Penjualan (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Buat Retur Penjualan`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| No. Retur | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format: `SR-{YYYYMMDD}-{XXXX}` |
| Tanggal Retur | Manual Input | DatePicker | Mandatory | Default: Hari ini |
| Pilih Faktur Penjualan | Manual Input | SearchSelect | Mandatory | Mengambil Faktur berstatus `POSTED` atau `PAID` |
| Gudang Penerima | Manual Input | Select | Mandatory | Default: Gudang Karantina / Retur |
| Tabel Item Retur | Dynamic Grid | Table Input | Mandatory | Pilih barang dari faktur, input Qty Retur (<= Qty Faktur) |
| Alasan Retur | Manual Input | Select | Mandatory | Cacat Kemasan, Rusak Ekspedisi, Salah Formula, Kadaluarsa |
| Tindakan Penyelesaian | Manual Input | Select | Mandatory | Potong Piutang (Credit Note), Ganti Barang Baru, Refund Kas |
| Foto Bukti Kerusakan | File Upload | UploadBox | Mandatory | Foto kemasan rusak dari klien |

---

## 4. Jurnal Otomatis & Dampak Akuntansi
* Saat Status = `SELESAI (Potong Tagihan)`:
  - *Debit:* 410201 Retur Penjualan
  - *Debit:* 210801 PPN Keluaran (jika faktur berpajak)
  - *Kredit:* 110301 Piutang Usaha (AR)
