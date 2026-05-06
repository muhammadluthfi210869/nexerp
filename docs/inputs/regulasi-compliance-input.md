
# FASE 7: REGULASI & COMPLIANCE (HALAL, CKPB, APJ)
*Dokumen Spesifikasi Input UI - Modul Kepatuhan & Otoritas Legal*

## 1. Form Sertifikasi Halal & Bahan Baku (Role: Irma - Halal)
*Fungsi: Memastikan setiap material yang dibeli SCM memiliki dokumen halal yang valid sebelum bisa digunakan di Produksi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Pilih Material | Dropdown (Search) | Wajib | Filter material yang belum divalidasi Halal |
| No. Sertifikat Halal | Teks | Wajib | Dari dokumen supplier |
| Masa Berlaku | Date | Wajib | Trigger notifikasi jika akan kadaluarsa |
| Upload Sertifikat | File (PDF/JPG) | Wajib | Bukti fisik untuk audit |
| Status Halal | Dropdown | Wajib | `APPROVED` / `REJECTED` |

---

## 2. Form Audit Internal CKPB (Role: Irma - CKPB)
*Fungsi: Checklist harian/mingguan untuk memastikan standar Cara Pembuatan Kosmetik yang Baik (CPKB) terpenuhi di area produksi.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| Area Audit | Dropdown | Wajib | Ruang Mixing, Filling, Gudang, dll |
| Tanggal Audit | Date | Wajib | Waktu pengecekan |
| Parameter Sanitasi | Checklist | Wajib | Kebersihan alat, pakaian kerja, dll |
| Temuan Ketidaksesuaian| Teks (Area) | Opsional | Jika ada pelanggaran prosedur |
| Batas Perbaikan | Date | Opsional | Kapan harus selesai diperbaiki |

---

## 3. Form Otoritas Legal & Product Release (Role: APJ - Legal)
*Fungsi: Keputusan final apakah sebuah batch produk boleh keluar dari pabrik secara hukum.*

| Label di Layar | Tipe Input | Validasi | Keterangan / Opsi Dasar |
| :--- | :--- | :--- | :--- |
| No. Batch Record | Dropdown (Search) | Wajib | Batch yang sudah lolos QC Final |
| Review Dokumen | Checklist | Wajib | Cek kelengkapan Batch Record, QC Lab, Label |
| No. Izin Edar (NIE) | Teks (Readonly) | Otomatis | Menampilkan Nomor BPOM produk tersebut |
| Keputusan Akhir | Dropdown | Wajib | `RELEASED` (Siap Kirim) / `RECALL` / `HOLD` |
| Tanda Tangan Digital | Input Canvas | Wajib | Otoritas legal APJ |
