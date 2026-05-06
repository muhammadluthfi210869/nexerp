# 💎 FINANCE ULTIMATE ARCHITECTURE PLAN (100% Zero-Leakage)

Dokumen ini adalah cetak biru (blueprint) untuk mentransformasi sistem keuangan ERP menjadi standar "World-Class" dengan tingkat presisi 100%, menghilangkan celah audit, dan memastikan laporan keuangan mencerminkan realitas bisnis manufaktur.

---

## 🏗️ 1. Database Layer: "The Immutable Core"
Target: Menciptakan skema yang tidak hanya mencatat angka, tapi juga logika bisnis yang tak terbantahkan.

### A. Penajaman Chart of Accounts (COA)
- **Model `Account` Modification:**
  - Tambahkan `reportGroup` (Enum: `CURRENT_ASSET`, `FIXED_ASSET`, `CURRENT_LIABILITY`, `EQUITY`, `OPERATING_REVENUE`, `COGS`, `OPEX`, dll).
  - Tambahkan `reclassifyToAccountId` (Nullable UUID): Untuk otomatisasi pemindahan saldo (misal: Bank Kredit otomatis pindah ke Hutang Bank).
- **Model `FinancialPeriod`:**
  - Untuk mekanisme **Soft Lock** dan **Hard Lock**. Mencegah input transaksi di periode yang sudah diaudit.

### B. Material Cost Tracking (HPP Precision)
- **Model `MaterialValuation`:**
  - Menyimpan histori `movingAveragePrice` setiap kali ada barang masuk (GRN).
  - Formula: `((Qty_Lama * Harga_MAP_Lama) + (Qty_Baru * Harga_Beli)) / (Qty_Total)`.

---

## ⚙️ 2. Backend Engine: "The Audit-Proof Logic"
Target: Automasi cerdas yang menghilangkan human error.

### A. Moving Average Price (MAP) Engine
- Implementasi `ValuationService` yang dipicu oleh event `SCM_GOODS_RECEIVED`.
- Memastikan nilai persediaan di Neraca selalu sesuai dengan harga perolehan rata-rata terbaru, bukan harga statis.

### B. Dynamic Financial Statement Builder
- **Logic Reclassification:** Saat men-generate Balance Sheet, sistem harus mengecek saldo normal.
  - Jika `Asset` bersaldo `Credit` -> Otomatis tampilkan di sisi `Liability`.
  - Jika `Liability` bersaldo `Debit` -> Otomatis tampilkan di sisi `Asset` (Prepaid).
- **Automated Closing:** Prosedur akhir bulan otomatis yang memindahkan saldo Laba Rugi ke `Retained Earnings`.

### C. Multi-Level Gatekeeper (Security)
- **Immutable Journals:** Jurnal yang sudah divalidasi tidak boleh di-delete. Hanya boleh dilakukan melalui **Jurnal Pembalik (Reversal)**.
- **Proof-of-Disbursement:** Integrasi Cloud Storage (S3/GCS) untuk penyimpanan bukti transfer yang wajib ada sebelum transaksi Kas Keluar dianggap `Final`.

---

## 🎨 3. Frontend Refinement: "Premium Executive Interface"
Target: Laporan yang memberikan *insight*, bukan sekadar tabel angka.

### A. Balance Sheet & P&L Revitalization
- **Drill-down Feature:** Klik pada nama akun untuk melihat buku besar (General Ledger) secara instan tanpa pindah halaman.
- **Visual Indicators:**
  - Warna merah untuk saldo yang tidak wajar (misal: Akun Beban bersaldo Kredit).
  - Status "Balanced" dengan deteksi selisih hingga 2 desimal.
- **Comparison View:** Perbandingan saldo bulan ini vs bulan lalu (MoM) atau tahun lalu (YoY) untuk deteksi anomali pengeluaran.

### B. Professional Transaction Input
- **Hotkey Support:** Navigasi cepat (Alt+N untuk baris baru, Alt+S untuk simpan).
- **Smart Search:** Cari COA berdasarkan kode atau nama secara *fuzzy*.
- **Live Preview:** Tampilan visual sisi Debit/Kredit yang seimbang sebelum data dikirim ke server.

---

## 📋 4. Roadmap Implementasi

| Fase | Fokus | Durasi | Urgensi |
| :--- | :--- | :--- | :--- |
| **I** | **Data Integrity** (Schema & MAP Engine) | 3 Hari | 🔥 CRITICAL |
| **II** | **Financial Report Logic** (Reclassification & Drill-down) | 4 Hari | ⚡ HIGH |
| **III** | **Operational Controls** (Locking Period & Reversal Logic) | 3 Hari | ✅ MEDIUM |
| **IV** | **Premium UX** (Comparison View & Dashboards) | 5 Hari | ✨ POLISH |

---

## 💡 Pesan Senior Dev untuk Frontend Laporan
> "Laporan keuangan bukan sekadar tabel HTML. Dia adalah wajah integritas perusahaan. Pastikan penggunaan **Modern Typography** (Inter/Outfit), **Harmonious Color Palette** (Indigo untuk Aset, Amber untuk Liabilitas), dan **Smooth Transitions** saat loading data. Jangan biarkan angka nol ('0') tampil polos; gunakan format '-' atau warna abu-abu pudar agar mata fokus pada angka yang signifikan."

---
*Dokumen ini bersifat dinamis dan akan diperbarui seiring dengan perkembangan implementasi.*
