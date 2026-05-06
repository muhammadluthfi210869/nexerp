Keputusan untuk melengkapi titik buntu (*blind spots*) ini sangat tepat. Tanpa modul QC yang terintegrasi di setiap fase transformasi fisik, protokol "Tidak ada produksi tanpa QC Approved" hanya akan menjadi slogan tanpa kekuatan eksekusi mekanis.

Berdasarkan gambar struktur organisasi yang kamu berikan dan kebutuhan *Designer Packaging*, kita akan membedah **Fase 6: Quality Control** dan **Ekspansi Peran Desainer** dengan parameter input yang kaku.

---

# FASE 6: QUALITY CONTROL (THE GATEKEEPER)
*Dokumen Spesifikasi Input UI - Modul Penjaminan Mutu*

## 1. Form Incoming QC (Inspeksi Material Datang)
*Fungsi: Memvalidasi bahan baku/kemasan dari Supplier sebelum masuk ke Stok Utama.*
*Role: QC Inspector / Admin Gudang.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Barang Masuk (GR) | Dropdown (Search) | Wajib | Menampilkan daftar Goods Receipt yang belum di-QC |
| Tanggal Inspeksi | Date | Wajib | Waktu pengecekan fisik |
| Nama Material | Teks (Readonly) | Otomatis | Ditarik dari data GR |
| **Qty Lolos (Pass)** | Angka | Wajib | Masuk ke `StockLedger` (Gudang Utama) |
| **Qty Tolak (Reject)** | Angka | Wajib | Masuk ke `StockLedger` (Gudang Karantina) |
| Parameter Cek (Visual/Lab)| Checklist | Wajib | Misal: Warna sesuai, tidak bocor, COA tersedia |
| Status Akhir | Dropdown | Wajib | `PASSED` / `REJECTED` |

---

## 2. Form QC Mixing (In-Process Control - Bulk)
*Fungsi: Validasi hasil masak sebelum masuk ke tahap pengisian (Filling).*
*Role: QC Lab.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Batch Record | Dropdown (Search) | Wajib | Menampilkan batch yang sedang di posisi `Mixing` |
| Hasil Uji pH | Angka/Desimal | Wajib | Sesuai standar formula R&D |
| Hasil Uji Viskositas | Angka | Wajib | Ketebalan cairan/krim |
| Uji Organoleptik | Dropdown | Wajib | Warna, Bau, Tekstur (Pass/Fail) |
| Status Ruahan | Dropdown | Wajib | `RELEASED` (Bisa lanjut Filling) / `HOLD` |

---

## 3. Form QC Filling & Packing (Final Inspection)
*Fungsi: Cek akurasi volume pengisian dan kerapihan kemasan akhir.*
*Role: QC Produksi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Batch Record | Dropdown (Search) | Wajib | Menampilkan batch yang sedang `Filling/Packing` |
| Sampling Berat/Volume | Angka | Wajib | Misal: 100ml (+/- 1%) |
| Cek Kode Produksi & Exp | Dropdown | Wajib | Kejelasan cetakan inkjet pada botol/box |
| Cek Kerapihan (Sealing) | Dropdown | Wajib | Pastikan segel tidak miring/bocor |
| Qty Finish Good Final | Angka | Wajib | Jumlah yang sah masuk ke Gudang Jadi |

---

# EKSPANSI ROLE: DESIGNER PACKAGING
*Fungsi: Menjembatani R&D dan Komersial dalam hal estetika produk.*

## Form Input Desain Produk
*Role: Designer.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Sales Order (SO) | Dropdown (Search) | Wajib | SO yang membutuhkan desain baru |
| Nama Brand | Teks (Readonly) | Otomatis | Dari data SO |
| Upload Master Design | File (PDF/AI) | Wajib | Link ke Cloud Storage (G-Drive/S3) |
| Upload Mockup 3D | Image (JPG/PNG) | Wajib | Untuk preview klien di dashboard |
| Versi Desain | Angka | Wajib | V1, V2, dst (Tracking revisi) |
| Status Persetujuan Klien | Dropdown | Wajib | `PENDING`, `APPROVED`, `REVISION` |

---



