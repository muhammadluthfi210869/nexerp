# [SCR-024] Penjualan Sample (Sample Orders & Request)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/sample-sales`
- **Legacy GsERP URL:** `/sales-sample` & `/sales-sample/create`
- **Menu Sidebar:** `7. PENJUALAN & TRANSAKSI > Penjualan Sample`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `RND`, `SUPERADMIN`
- **Tujuan Operasional:** Registrasi permintaan sample trial maklon dari klien oleh BusDev, yang kemudian diteruskan ke R&D Lab untuk formulasi.

---

## 2. Klarifikasi Operasional: Siapa yang Menginput?
* **Penginput Utama:** **BusDev (Business Development)**. Klien menyampaikan brief kebutuhan produk ke BusDev $\rightarrow$ BusDev menginput spesifikasi target sample ke dalam form ini.
* **Peran R&D:** Tim Formulator R&D membaca data ini di `/samples/inbox` untuk meracik formula fisik di laboratorium.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Permintaan`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal | `requestDate` | `DD/MM/YYYY` | Left |
| 3 | Kode Sample | `sampleCode` | Clickable Link: `SMP-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Pelanggan / Brand | `customerBrand` | Pelanggan (Bold) + Brand | Left |
| 5 | Nama Produk | `productName` | Teks Nama Produk yang diminta | Left |
| 6 | Formulator PIC | `formulatorName` | Nama Staff R&D yang ditugaskan | Left |
| 7 | Total Biaya Sample | `totalFee` | `Rp #.##0` (Sample fee yang dibayar klien) | Right |
| 8 | Status | `status` | Badge 1 Baris: `PENDING`, `PROCESS_LAB`, `SENT_TO_CLIENT`, `ACC_APPROVED`, `REVISE` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Detail`, `Cetak Form Sample`, `Offset ke DP` | Center |

---

## 4. Secondary Window: Form Input Permintaan Sample (Centered Floating Window)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`) dengan tabs/sections (BUKAN side window).
- **Trigger:** Tombol `+ Buat Permintaan Sample`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| Kode Dokumen | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format: `SMP-{YYYYMMDD}-{XXXX}` |
| Tanggal | Manual Input | DatePicker | Mandatory | Default: Hari ini |
| Pelanggan / Klien | Manual Input | SearchSelect | Mandatory | Pilih dari Master Pelanggan |
| Nama Produk | Manual Input | TextInput | Mandatory | Contoh: "Centella Calming Gel Cream" |
| Bentuk Fisik (Form) | Manual Input | Select | Mandatory | Liquid, Gel, Cream, Serum, Powder, Lotion |
| Warna (Color) | Manual Input | TextInput | Opsional | Contoh: "Translucent Light Green" |
| Aroma / Rasa (Flavor) | Manual Input | TextInput | Opsional | Contoh: "Floral Tea (tanpa parfum sintetis)" |
| Netto / Volume | Manual Input | TextInput | Mandatory | Contoh: "30 ml", "50 gram" |
| Klaim Manfaat | Manual Input | TextArea | Opsional | Contoh: "Anti-acne, barrier repair, non-comedogenic" |
| Bahan yang Diminta | Manual Input | TextArea | Opsional | Klien request active: Niacinamide 5%, Centella 2% |
| Biaya Sample Fee | Manual Input | CurrencyInput | Mandatory | Default: Rp 500.000 / sample (atau 0 jika promo) |
| Formulator R&D | Manual Input | SearchSelect | Opsional | Menugaskan formulator spesifik |
| File Brief / Acuan | File Upload | UploadBox | Opsional | PDF/Gambar acuan tekstur dari klien |

---

## 5. Spesifikasi Cetak (Lembar Kerja Sample A4)
- Mencetak form serah terima spesifikasi sample ke tim R&D lengkap dengan checklist sensori (aroma, warna, viskositas, pH).
