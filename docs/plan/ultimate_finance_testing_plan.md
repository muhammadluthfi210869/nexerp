# Ultimate Finance Backend & E2E Testing Plan
**Version:** 1.0
**Role:** World-Class QA Backend Audit
**Status:** Draft / Ready for Execution

## 1. Executive Summary
Dokumen ini merancang strategi pengujian menyeluruh untuk modul Finance pada Porto Aureon ERP. Fokus utama adalah memastikan integritas data keuangan, akurasi perhitungan otomatis (HPP & MAP), serta keamanan logika akuntansi (Double-Entry & Period Locking).

---

## 2. Core Testing Strategy

### A. Integrated E2E Lifecycle Testing
Menguji aliran data lintas divisi yang bermuara di Finance. Kita tidak hanya mengetes API Finance, tapi bagaimana trigger dari divisi lain (Sales, SCM, Production) berdampak pada buku besar.

### B. Accounting Integrity Audit
Memastikan setiap `JournalEntry` memenuhi kaidah akuntansi:
*   Balance Check (Debit = Credit).
*   Correct Account Mapping (Asset/Liability/Equity/Revenue/Expense).
*   Reclassification validation on reports.

### C. Stress & Concurrency Testing
Menguji ketahanan sistem saat terjadi transaksi masal (misal: 1000 inbound material secara simultan) untuk memastikan Moving Average Price (MAP) tidak mengalami *Race Condition*.

---

## 3. Test Scenarios

### Scenario 1: Revenue Lifecycle (The "Gatekeeper" Test)
**Goal:** Memastikan Finance benar-benar menjadi gembok validasi untuk Sales & R&D.
*   **Step 1:** Create Sample Request via Bussdev API.
*   **Step 2:** Upload Payment Proof (Mock image).
*   **Step 3:** Finance API `verifyArHubPayment` execution.
*   **Validation:**
    *   Check `JournalEntry`: Apakah Pendapatan Sampel (4102) ter-credit?
    *   Check `EventEmitter`: Apakah status R&D terbuka?
    *   Check Balance: Apakah Kas/Bank bertambah?

### Scenario 2: Manufacturing & HPP Automator
**Goal:** Audit akurasi perhitungan HPP otomatis saat produksi selesai.
*   **Step 1:** Inbound Bahan Baku dengan harga berbeda (Testing MAP logic).
*   **Step 2:** Production Work Order completion trigger.
*   **Step 3:** Auto-trigger `handleProductionPassed`.
*   **Validation:**
    *   **Logic Audit:** Apakah HPP = `(MAP Bahan Baku * Qty Produksi)`?
    *   **Inventory Audit:** Debit Finished Goods vs Credit Raw Materials.
    *   **Edge Case:** Test jika `targetQty` != `actualQty`.

### Scenario 3: Opex & Fund Request Protocol
**Goal:** Memastikan tidak ada "leak" pada pengeluaran operasional.
*   **Step 1:** Create Fund Request (Status: Pending).
*   **Step 2:** Manager Approval.
*   **Step 3:** Finance Disbursement (`disburseFundRequest`).
*   **Validation:**
    *   **CRITICAL:** Pastikan Journal Entry benar-benar tercipta (Fixing the detected bug).
    *   Check Attachment: Pastikan error jika expense > 0 tapi tidak ada attachment proof.

### Scenario 4: Period Locking & Security
**Goal:** Melindungi integritas data masa lalu.
*   **Step 1:** Lock Financial Period (e.g., April 2026).
*   **Step 2:** Attempt to post Journal with date in April 2026.
*   **Validation:**
    *   API harus mengembalikan `400 BadRequest` dengan pesan "Periode sudah dikunci".
    *   Test "Soft Lock" vs "Closed".

### Scenario 5: Financial Report Integrity
**Goal:** Memastikan laporan Laba Rugi dan Neraca akurat secara matematis.
*   **Step 1:** Injeksi berbagai transaksi manual & otomatis.
*   **Step 2:** Generate Trial Balance, P&L, and Balance Sheet.
*   **Validation:**
    *   `isBalanced` flag pada API harus `true`.
    *   Check Reclassification: Jika Bank minus, pastikan pindah ke Liabilities (Overdraft) di laporan Neraca.

---

## 4. Edge Cases & Logic Audit List

| Area | Skenario | Ekspektasi |
| :--- | :--- | :--- |
| **Tax** | Journal Line dengan taxRate | Otomatis create line PPN Masukan/Keluaran. |
| **MAP** | Inbound Qty 0 atau Harga 0 | Sistem tidak boleh crash (Division by zero check). |
| **Reverse** | Reversal of Reversal | Harus di-block (Tidak boleh mereverse jurnal yang sudah hasil reverse). |
| **Hierarchy** | Delete Account dengan Journal | Harus di-block (Restricted deletion). |
| **Currency** | Transaksi dengan Selisih Kurs | Selisih masuk ke akun `Beban Selisih Kurs (8xxx)`. |

---

## 5. Tools & Execution Plan

1.  **Backend Unit/Integration Tests:**
    *   Framework: **Jest** (NestJS default).
    *   Target: `finance.service.ts`, `valuation.service.ts`.
2.  **End-to-End (E2E) Tests:**
    *   Framework: **Playwright**.
    *   Focus: UI Finance Dashboard -> Flow Verifikasi AR -> Laporan Keuangan.
3.  **Database Audit Scripts:**
    *   Custom SQL scripts untuk mendeteksi `JournalLine` yang tidak balance secara periodik.

---

## 6. Known Logic Defects to Fix (Priority 1)
*   [ ] **Fix disbursement journal creation**: Saat ini fungsi disbursement hanya update status tanpa membuat jurnal.
*   [ ] **HPP Calculation Refinement**: Gunakan `actualQty` dari QC passed daripada `targetQty`.
*   [ ] **AR Hub Validation**: Tambahkan guard agar `taxAmount` tidak lebih besar dari `totalPayment`.

---
**Prepared by:** Antigravity (World-Class QA Backend Agent)
**Date:** 2026-04-27
