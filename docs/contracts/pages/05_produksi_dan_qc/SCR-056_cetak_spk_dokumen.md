# [SCR-056] Cetak Dokumen SPK Pabrik (Factory Work Order Print Document)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/production/spk` (Terintegrasi via `SpkPrintModal.tsx` & Print Dialog)
- **Menu Sidebar:** `6. R&D & PRODUKSI > SPK & Work Orders`
- **Hak Akses (RBAC):** `PPIC`, `PRODUCTION`, `SUPERADMIN`
- **Tujuan Operasional:** Pencetakan dokumen resmi Surat Perintah Kerja (SPK) untuk lantai pabrik sesuai standar CPKB & ISO.

---

## 2. Pembenahan Masalah "Print Cetak SPK Tidak Jelas dan Hanya Seperti UI Window"
> **Koreksi Arsitektural:** 
> SPK lantai produksi kosmetik adalah dokumen legal internal yang menjadi pedoman tim gudang, penimbangan, mixing, filling, dan packaging.
> Tampilan saat ditekan tombol Print / `Ctrl + P` menghasilkan **Dokumen Manufaktur Pabrik Standar ISO/CPKB (`DnaPrintDocument`)**.

---

## 3. Komponen Dokumen Cetak SPK A4 Resmi (`.dna-print-document`)
1. **Header Dokumen:**
   - KOP Pabrik: PT. Karya Impian Laboratoris (Dreamlab).
   - Judul Besar: **SURAT PERINTAH KERJA MANUFAKTUR (SPK)**.
   - Kotak Nomor SPK, Tanggal Terbit, Nomor Sales Order (SO), Target Selesai, dan Revisi.
2. **Identitas Produk & Klien:**
   - Nama Klien & Merk/Brand.
   - Nama Produk Resmi & Nomor Registrasi BPOM NA.
   - Bentuk Sediaan (Cream/Serum/Lotion) & Isi Bersih (Netto).
   - Jumlah Pesanan Total (Pcs).
3. **Parameter Manufaktur PPIC:**
   - Ukuran Batch Mixing (Kg).
   - Jumlah Batch yang harus dikerjakan (misal: 2 Batch @ 250 Kg).
   - Nomor Lot/Batch yang dialokasikan.
   - Tanggal Rencana: Penimbangan, Mixing, Filing, Packaging.
4. **Resep Penimbangan Bahan Baku (BOM Matrix):**
   - Tabel: Kode Bahan, Nama Bahan, Fase (A/B/C/D), Persentase (%), Berat Teoretis (Kg), Paraf Timbang Gudang, Paraf Terima Produksi.
5. **Instruksi Spesifikasi Kemasan (Packaging BOM):**
   - Botol Primer, Tutup/Pump, Label Depan/Belakang, Box Satuan, Karton Master Box.
6. **Kotak Pengesahan 4 Pihak:**
   - *Diterbitkan (PPIC)*, *Diterima (Kepala Produksi)*, *Diverifikasi (QC / APJ)*, *Disetujui (Plant Manager / Direktur)*.
