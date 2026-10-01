# SOP & PROTOKOL PENDAMPINGAN DUAL-RUN 2 MINGGU (CLIENT PILOT IMPLEMENTATION)

**Nomor Dokumen**: SOP-IMP-ERP/2026/09/DUALRUN-01  
**Versi**: 1.0 (Enterprise Release)  
**Target Klien**: Perusahaan Manufaktur & Trading  
**Masa Berlaku**: 14 Hari Kalender (2 Minggu Transisi Paralel)  

---

## 🎯 1. Tujuan & Filosofi Dual-Run

Tujuan utama dari fase **Dual-Run (Paralel 2 Minggu)** adalah menjamin kelancaran transisi sistem tanpa risiko kerugian finansial (*Zero Financial Loss*) dan tanpa disrupsi operasional pabrik (*Zero Factory Downtime*). Karyawan klien tidak langsung dilepas ke sistem baru secara mendadak, melainkan didampingi hingga terbentuk kenyamanan operasional dan pembuktian kecocokan data 100%.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ROADMAP 14 HARI DUAL-RUN                         │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               MINGGU 1               │               MINGGU 2               │
│         "SHADOW RECORDING"           │          "PRIMARY CUT-OVER"          │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Sistem Lama = Master Utama         │ • NexERP = Master Utama (Input First)│
│ • NexERP = Sistem Bayangan (Shadow)  │ • Sistem Lama = Safety Net Backup    │
│ • Fokus: Adaptasi UI/UX & Keyboard   │ • Fokus: Kecepatan & Kemandirian Staf│
│ • Rekonsiliasi Selisih Sore Hari     │ • Validasi 0 Selisih Menuju Go-Live  │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 👥 2. Struktur Tim Pendampingan & Tanggung Jawab

| Peran | Pihak | Tugas Utama |
| :--- | :--- | :--- |
| **Lead Implementation Consultant** | Tim ERP Vendor | Memimpin jadwal harian, memvalidasi rekonsiliasi sore, dan eskalasi teknis. |
| **Technical Support / Bug Fixer** | Tim ERP Vendor | *Standby on-site* di lantai pabrik dan kantor untuk merespons kendala < 5 menit. |
| **Project Sponsor / CFO Klien** | Pihak Klien | Mengesahkan berita acara penutupan harian dan persetujuan Go-Live final. |
| **Lead Accounting Klien** | Pihak Klien | Memeriksa kecocokan saldo kas, bank, piutang, utang, dan jurnal penyesuaian. |
| **Supervisor Gudang & Produksi** | Pihak Klien | Memastikan seluruh penerimaan barang, batch mixing, dan surat jalan diinput serentak. |

---

## 📅 3. Jadwal Operasional Harian (Daily Routine Protocol)

Setiap hari kerja selama 14 hari, alur kerja diatur dengan disiplin ketat berikut:

### Pagi (08:00 – 08:30) — *Morning Standup & Sync*
- Verifikasi saldo awal kas/bank hari ini sama persis antara sistem lama dan NexERP.
- Cek ketersediaan perangkat keras di pos operasional: barcode scanner kasir/gudang, printer faktur dot-matrix/thermal, koneksi LAN lokal.

### Siang (08:30 – 16:30) — *Live Dual-Entry Transaction*
- **Minggu 1**: Operator menginput transaksi di sistem lama klien terlebih dahulu, lalu mengulang input di NexERP (didampingi tim technical support di sebelahnya).
- **Minggu 2**: Operator langsung menginput di NexERP secara cepat, lalu mencatatkan rekapitulasi ringkas di sistem lama untuk jaminan keamanan.

### Sore (16:30 – 18:00) — *Automated Audit & 4-Pillar Daily Reconciliation*
Tim gabungan auditor klien dan vendor membuka menu **Executive Reconciliation Dashboard** di NexERP untuk mencocokkan **4 Pilar Kritis**:

```
[1. PILAR PENJUALAN] ➔ Jumlah SO, Total Nilai Faktur, Pajak PPN/PPh
[2. PILAR PENGADAAN] ➔ Jumlah PO Masuk, GRN Gudang, Faktur Tagihan Vendor
[3. PILAR GUDANG]    ➔ Kartu Stok Akhir per SKU, Karantina vs Stok Siap Jual
[4. PILAR KEUANGAN]  ➔ Saldo Kas Fisik, Rekening Koran Bank, Neraca Saldo
```

---

## ⚖️ 4. Matriks Penanganan Selisih (Discrepancy Resolution Protocol)

Jika terjadi perbedaan angka antara sistem lama klien dan NexERP saat rekonsiliasi sore:

| Jenis Selisih | Akar Penyebab Umum | Tindakan Wajib (Action Plan) |
| :--- | :--- | :--- |
| **1. Selisih Desimal / Pembulatan (< Rp 100)** | Perbedaan algoritma *round-half-up* vs pembulatan ke bawah pada sistem lama klien. | Konfigurasikan aturan pembulatan di NexERP (`Accounting Setting -> Rounding Tolerance`) agar sesuai regulasi perpajakan yang diakui klien. |
| **2. Selisih Stok Fisik vs Sistem** | Operator gudang lupa scan salah satu batch saat penerimaan barang (human error). | Lakukan opname cepat terhadap lot tersebut, masukkan koreksi *adjustment* dengan otorisasi supervisor melalui PIN manager. |
| **3. Nomor Dokumen Melompat** | Pengguna menekan tombol submit berkali-kali pada jaringan lambat. | NexERP memiliki *idempotency-key guard* dan sequence lock: periksa audit log untuk melihat siapa yang memicu dan batalkan draft kosong. |
| **4. Selisih Saldo Kas / Bank** | Potongan biaya admin bank atau transfer terlambat dicatat di sistem lama. | Gunakan fitur Bank Reconciliation di NexERP untuk mengimpor mutasi rekening koran (MT940/CSV) dan melakukan auto-matching. |

---

## 🚦 5. Kriteria Gerbang Kelulusan Go-Live (Go / No-Go Decision Gate)

Pada hari ke-14 (Jumat sore Minggu ke-2), rapat dewan direksi diadakan untuk memutuskan pemutusan penuh (*full cut-over*) sistem lama ke NexERP.

### Kriteria Wajib "GO" (Semua Harus Centang Hijau):
- [ ] **Selisih Keuangan = Rp 0,00**: Neraca saldo NexERP cocok 100% dengan buku besar bank dan kas fisik selama 3 hari berturut-turut di akhir Minggu ke-2.
- [ ] **Akurasi Stok Gudang $\ge$ 99,8%**: Seluruh stok barang baku dan barang jadi tidak memiliki deviasi tanpa penjelasan sah.
- [ ] **Kenyamanan Staf $\ge$ 90%**: 100% operator (kasir, gudang, purchasing, RnD) lulus uji coba mandiri tanpa bantuan konsultan vendor.
- [ ] **Zero Open Critical Bugs (P0/P1 = 0)**: Tidak ada tiket eror yang menyebabkan crash sistem atau terhambatnya pengiriman barang.

---

## 📋 6. Lembar Checklist Verifikasi Harian (Formulir Dual-Run)

```markdown
TANGGAL DUAL-RUN: [____/____/2026]           HARI KE: [___ dari 14]
LOKASI/CABANG   : [______________________]   PIC AUDITOR: [______________________]

1. REKONSILIASI PENJUALAN & AR:
   • Total Faktur Terbit Sistem Lama: Rp [__________________] (Qty: [____])
   • Total Faktur Terbit NexERP     : Rp [__________________] (Qty: [____])
   • Selisih (Delta)                : Rp [__________________] [ ] MATCH [ ] SELISIH

2. REKONSILIASI KAS & BANK:
   • Saldo Akhir Kas/Bank Sistem Lama: Rp [__________________]
   • Saldo Akhir Kas/Bank NexERP     : Rp [__________________]
   • Selisih (Delta)                 : Rp [__________________] [ ] MATCH [ ] SELISIH

3. REKONSILIASI INVENTORI:
   • Total SKU Mengalami Pergerakan  : [____] SKU
   • SKU dengan Selisih Fisik        : [____] SKU
   • Status Kartu Stok               : [ ] 100% COCOK   [ ] BUTUH ADJ

CATATAN KENDALA OPERATOR HARI INI:
_______________________________________________________________________________

Tanda Tangan Lead Klien: ______________     Tanda Tangan Lead Vendor: ______________
```
