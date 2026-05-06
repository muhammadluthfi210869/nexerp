# Master Plan: Implementasi Full Finance & Communication Protocol V4

Dokumen ini merincikan peta jalan teknis untuk mengimplementasikan modul Keuangan dan Protokol Komunikasi Terintegrasi sesuai dengan arahan strategis.

## 1. Sinkronisasi Database (Prisma Schema)
**Target: Menciptakan "Single Source of Truth" yang mendukung jejak audit.**

### A. Modul Fund Request (Point 1)
- Pembuatan model `FundRequest` di `finance.prisma`.
- Enum Status: `PENDING_APPROVAL_MGR`, `APPROVED_BY_MGR`, `WAITING_FINANCE_DISBURSEMENT`, `PAID`, `REJECTED`.
- Relasi: `userId` (pengaju), `departmentId` (untuk kontrol anggaran), `approvedById`.

### B. Tax Splitting & Audit Trail (Point 4 & 5)
- Penambahan kolom `attachmentUrls String[]` pada `JournalEntry` dan `Payment`.
- Penambahan kolom `taxRate Decimal` dan `taxAccountId String` pada `JournalLine` untuk otomatisasi pemecahan pajak.

---

## 2. Pengembangan Backend (NestJS)
**Target: Automasi Sistemik (Zero-Bottleneck).**

### A. Alur Fund Request (Point 1)
- Endpoint `POST /finance/fund-request`: Untuk semua divisi mengajukan dana.
- Endpoint `PATCH /finance/fund-request/:id/approve`: Level Manager Divisi.
- Endpoint `POST /finance/fund-request/:id/disburse`: Level Finance (men-trigger `createJournalEntry`).

### B. HPP Automator (Point 3)
- Implementasi Listener: `@OnEvent('production.qc_final_passed')`.
- Logic:
  1. Ambil BOM dari modul R&D.
  2. Ambil Moving Average Price dari SCM.
  3. Hitung Total HPP.
  4. Posting Jurnal Otomatis: `Debit Persediaan Barang Jadi / Kredit Persediaan Bahan Baku`.

---

## 3. Revitalisasi Frontend (Next.js)
**Target: UI yang Menegakkan Protokol.**

### A. Pemisahan Guest Book & Finance (Point 2)
- [ ] **Hapus** menu "Buku Tamu" dan "Utility" dari sidebar Finance.
- [ ] Pastikan Guest Book hanya ada di modul **General Affairs / Utility**.

### B. Mandatory Upload & Tax UI (Point 4 & 5)
- Penambahan field `Upload Proof` pada Form Kas Keluar & Jurnal Umum (Status: Mandatory).
- Dropdown Pajak pada setiap baris input transaksi yang otomatis menghitung nilai DPP & PPN.

### C. Dashboard Pengajuan Dana (Untuk Semua Divisi)
- Halaman `/dashboard/my-requests`: Tempat karyawan memantau status uang yang mereka ajukan.

---

## 4. Quality Assurance & Backend Testing
**Target: Zero-Error pada Logika Keuangan.**

- **Unit Testing**: Validasi kalkulasi `tax splitting`.
- **Integration Testing**: Simulasi alur dari R&D (BOM) -> SCM (PO) -> Finance (HPP Posting).
- **Audit Simulation**: Memastikan setiap `disbursement` menghasilkan `JournalEntry` yang seimbang (Balanced).

---

## Metrik Kesesuaian Saat Ini (Audit)
- **Database**: 45% (Struktur COA & Journal OK, FundRequest & Tax MISSING)
- **Backend**: 30% (Journal Logic OK, Events & Approval MISSING)
- **Frontend**: 55% (Dashboard & Ledger UI OK, FundRequest & Mandatory Upload MISSING)
