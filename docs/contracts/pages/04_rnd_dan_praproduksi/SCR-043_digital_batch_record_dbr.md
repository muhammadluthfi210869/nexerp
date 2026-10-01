# [SCR-043] Digital Batch Record / DBR (Batch Production Record)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/production/batch-records`
- **Legacy GsERP URL:** `/batch-record` & `/batch-record/create`
- **Menu Sidebar:** `10. PRA PRODUKSI (PPIC) > Digital Batch Record`
- **Hak Akses (RBAC):** `PPIC`, `PRODUCTION`, `QC`, `APJ`, `SUPERADMIN`
- **Tujuan Operasional:** Dokumen kendali induk pembuatan batch kosmetik sesuai standar CPKB BPOM, mencatat penimbangan bahan riil, instruksi proses per fase, dan parameter kritis mutu.

---

## 2. Klarifikasi Operasional: Auto-Generate Turunan vs Manual Input
* **100% Dokumen Turunan:** DBR **BUKAN** dokumen yang diketik manual bahannya dari nol!
* DBR dibuat dengan memilih **Nomor Sales Order (SPK)** yang sudah disetujui (`status = PROCESS`).
* Sistem otomatis menarik Formula Resmi yang terikat, mengalikan persentase bahan dengan target berat batch (Kg), dan menyusun resep penimbangan otomatis (*Bill of Materials per Batch*).

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal DBR`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal DBR | `recordDate` | `DD/MM/YYYY` | Left |
| 3 | Kode Batch Record | `dbrCode` | Clickable Link: `DBR-{YYYYMMDD}-{XXXX}` | Left |
| 4 | No. Sales Order (SPK) | `soNumber` | Link ke dokumen SO | Left |
| 5 | Pelanggan / Brand | `customerBrand` | Pelanggan (Bold) + Nama Brand | Left |
| 6 | Produk & Formula | `productFormula` | Nama Produk • Kode Formula | Left |
| 7 | Ukuran Batch (Batch Size) | `batchSizeKg` | Angka Kg / Liter (misal: `500.00 Kg`) | Right |
| 8 | Status Batch | `status` | Badge 1 Baris: `DRAFT`, `SIAP_TIMBANG`, `SEDANG_MIXING`, `QC_BULK_PASSED`, `SELESAI` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Lembar DBR`, `Cetak Dokumen CPKB`, `Mulai Penimbangan` | Center |

---

## 4. Secondary Window: Form Pembuatan DBR Baru (Input Minimal PPIC)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-3xl`).
- **Trigger:** Tombol `+ Buat Batch Record Baru`.

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan & Auto-Rules |
|---|---|---|---|---|
| Nomor Batch Record | **AUTO-GENERATE** | Text (Read-Only) | Mandatory | Format: `DBR-{YYYYMMDD}-{XXXX}` |
| Pilih Sales Order | **SEARCH-SELECT** | SearchSelect | Mandatory | **Hanya menampilkan SO yang berstatus `PROCESS`** |
| Produk & Formula | **AUTO-POPULATE** | Text (Read-Only) | Auto | Otomatis ditarik dari rincian SO terpilih |
| Tanggal Rencana Produksi | Manual Input | DatePicker | Mandatory | Tanggal mulai penimbangan & mixing |
| Ukuran Batch (Kg) | Manual Input | NumberInput | Mandatory | Berat total adonan ruahan (misal: `300 Kg`) |
| Tangki / Mesin Mixing | Manual Input | Select | Mandatory | Pilihan mesin: Tangki Homogenizer 1, Mixer 2, dll. |
| Catatan PPIC | Manual Input | TextArea | Opsional | Instruksi khusus keselamatan/suhu pemanasan |

---

## 5. Lembar DBR CPKB BPOM (Universal Print A4)
Saat tombol cetak ditekan, sistem menghasilkan **Dokumen Batch Record Lengkap (CPKB BPOM Standard)**:
1. Cover Lembar Produksi (Nama Produk, No Notifikasi BPOM, No Batch, Tgl Produksi, Expired Date).
2. Tabel Penimbangan Bahan Baku (Nama Bahan, Lot Gudang, Berat Teoretis, Berat Aktual Timbang, Paraf Penimbang & Saksi QC).
3. Log Instruksi Proses Mixing (Suhu Pemanasan Fase A/B, Kecepatan Homogenizer RPM, Waktu Pengadukan, Paraf Operator).
4. Hasil Uji QC Ruahan (pH, Viskositas, Berat Jenis, Organoleptis, Paraf Analis Lab).
