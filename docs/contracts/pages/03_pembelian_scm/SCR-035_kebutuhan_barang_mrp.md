# [SCR-035] Kebutuhan Barang / MRP (Material Requirements Planning)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/kebutuhan`
- **Legacy GsERP URL:** `/material-requirement`
- **Menu Sidebar:** `4. PEMBELIAN & PENGADAAN > Kebutuhan Barang (MRP)`
- **Hak Akses (RBAC):** `PURCHASING`, `PPIC`, `SUPERADMIN`
- **Tujuan Operasional:** Perhitungan otomatis defisit material berdasarkan akumulasi Bill of Materials (BOM) seluruh Work Orders / Sales Orders yang aktif dibandingkan stok riil gudang, serta penerbitan rekomendasi pembelian otomatis.

---

## 2. Pembenahan Layout & Desain (Pembersihan Tabel Berantakan)
> **Penyelesaian Masalah:** 
> 1. Jarak spacing antara Kolom 1 dan Kolom 2 yang terlalu jauh dirapatkan menjadi proporsional.
> 2. **DILARANG MENUMPUK 2 DATA DALAM 1 SEL**. Setiap sel hanya memuat 1 metrik angka yang jelas dan terbaca.
> 3. Tombol input tidak boleh tiba-tiba berhasil tanpa validasi; wajib menampilkan konfirmasi item yang akan dimasukkan ke Purchase Request (PR).

---

## 3. Struktur Tabel Utama (1 Metrik per Sel)
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Analisis MRP`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut / Checkbox item | Center |
| 2 | Tanggal Analisis | `analysisDate` | `DD/MM/YYYY` | Left |
| 3 | Kode Bahan | `materialCode` | Kode Material (misal: `RM-NIACIN-01`) | Left |
| 4 | Nama Bahan Baku / Kemas | `materialName` | Nama Lengkap Bahan (Bold) | Left |
| 5 | Kategori | `category` | Badge 1 Baris: `BAHAN_BAKU`, `BAHAN_KEMAS` | Center |
| 6 | Stok Fisik Tersedia | `availableStock` | Angka Qty + Satuan (misal: `12.50 Kg`) | Right |
| 7 | Total Kebutuhan SPK | `totalRequired` | Angka Qty + Satuan (misal: `50.00 Kg`) | Right |
| 8 | Defisit / Kekurangan | `deficitQty` | Angka Qty (Warna merah tegas jika minus) | Right |
| 9 | Rekomendasi Beli (MOQ) | `suggestedOrderQty` | Angka Qty rekomendasi (sesuai minimum order vendor) | Right |
| 10 | Status Pengadaan | `procurementStatus` | Badge 1 Baris: `BELUM_DIPESAN` (Merah), `SUDAH_ADA_PR` (Kuning), `PO_DITERBITKAN` (Hijau) | Center |
| 11 | Aksi | `actions` | Tombol: `+ Masukkan ke PR Pembelian` | Center |

---

## 4. Secondary Window: Konfirmasi Masukkan ke PR (Floating Modal)
- **Tipe Tampilan:** Floating Modal Ringkas (`max-w-2xl`).
- **Trigger:** Klik tombol `+ Masukkan ke PR` atau centang beberapa baris lalu klik `Buat PR Massal`.
- **Validasi:** Menampilkan ringkasan bahan terpilih, vendor pemasok utama, estimasi biaya, dan meminta konfirmasi sebelum membuat dokumen PR draft.
