# [SCR-044] Permintaan Barang / Bahan Baku (Material Requisition)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/production/material-requisition`
- **Legacy GsERP URL:** `/goods-request` & `/goods-request/create`
- **Menu Sidebar:** `10. PRA PRODUKSI (PPIC) > Permintaan Bahan Baku`
- **Hak Akses (RBAC):** `PPIC`, `PRODUCTION`, `WAREHOUSE`, `SUPERADMIN`
- **Tujuan Operasional:** Dokumen permohonan resmi pengeluaran bahan baku dari Gudang Bahan Baku menuju Ruang Penimbangan/Mixing Produksi berdasarkan Batch Record (DBR).

---

## 2. Klarifikasi Operasional: Mengapa Dibutuhkan di Pabrik Maklon?
Di pabrik kosmetik berstandar CPKB, operator produksi **DILARANG mengambil bahan langsung dari rak gudang**. Gudang hanya boleh mengeluarkan stok jika ada dokumen **Permintaan Barang (Goods Request)** yang terikat ke Nomor DBR / SPK resmi.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Permintaan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal | `requestDate` | `DD/MM/YYYY` | Left |
| 3 | No. Permintaan | `requisitionCode` | Clickable Link: `MR-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. DBR / SPK | `dbrRef` | Link ke dokumen DBR terkait | Left |
| 5 | Gudang Peminta | `requesterWarehouse` | Contoh: `Gudang Penimbangan / Produksi` | Left |
| 6 | Gudang Penyedia | `sourceWarehouse` | Contoh: `Gudang Utama Bahan Baku` | Left |
| 7 | Total Item Bahan | `totalItems` | Angka (misal: `8 Bahan`) | Center |
| 8 | Status | `status` | Badge 1 Baris: `PENGAJUAN`, `DISETUJUI_GUDANG`, `DISERAHKAN`, `SELESAI` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat`, `Serah Terima Bahan`, `Cetak Form Pengeluaran` | Center |

---

## 4. Secondary Window: Form Input Permintaan Bahan (Centered Floating Window)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Buat Permintaan Barang`.
- **Field:** Tanggal Permintaan, Pilih Nomor DBR (otomatis menarik seluruh daftar bahan baku yang dibutuhkan), Gudang Asal, Gudang Tujuan, Catatan Kebutuhan.
- **Dampak Stok (Mutasi):** Saat status berubah menjadi `DISERAHKAN`, sistem otomatis memutasikan stok dari Gudang Bahan Baku ke Gudang WIP/Produksi.
