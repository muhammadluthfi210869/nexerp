# SYSTEMS INTEGRITY ZERO-ERROR PROTOCOL 🛡️
## "The Golden Thread Absolute Integrity Mandate"

**Role**: Principal Systems Integrity Engineer
**Objective**: Menghilangkan 100% error, inkonsistensi, dan "Sync-Gaps" di seluruh ekosistem ERP Porto Aureon.
**Philosophy**: "Satu sen yang hilang di Neraca Saldo adalah kegagalan sistem yang total."

---

## 1. Visi & Filosofi Kerja
Dalam sistem ERP kelas dunia, tidak ada yang namanya "error kecil". Kesalahan pembulatan 0.01 atau delay API 100ms adalah indikasi dari kegagalan struktural. Protokol ini dirancang untuk mendeteksi anomali sebelum mereka menjadi bug.

## 2. Tujuh Lapis Deteksi (The 7 Layers of Integrity)

### Lapis 1: Static Integrity (Level Kode)
*   **Strict Type Checking**: Penggunaan TypeScript `strict: true` tanpa pengecualian `any`.
*   **Schema Validation**: Setiap data yang masuk ke API atau Database harus divalidasi via Zod/Joi.
*   **Linting Perfection**: Mendeteksi variabel yang tidak terpakai atau logic flow yang menggantung.

### Lapis 2: Atomic Integrity (Unit Testing)
*   **Math Validation**: Khusus modul Finance, setiap perhitungan (PPN, Diskon, Bunga) harus diuji dengan berbagai skenario angka desimal ekstrem.
*   **Edge Case Handling**: Mengetes input `null`, `undefined`, dan string kosong pada setiap fungsi kritis.

### Lapis 3: Flow Integrity (Integration Testing)
*   **API-to-DB Parity**: Memastikan apa yang dikirim oleh Frontend disimpan dengan tepat di database tanpa perubahan tipe data (misal: String ke BigInt).
*   **Constraint Testing**: Mencoba memasukkan data duplikat atau data tanpa relasi (Foreign Key) untuk memastikan database menolak secara elegan.

### Lapis 4: Golden Thread E2E (Business Logic)
*   **Full Lifecycle Simulation**: Menggunakan **Playwright** untuk menjalankan skenario dari *Commercial* -> *Warehouse* -> *Finance* tanpa intervensi manual.
*   **Operational Gates**: Memastikan sistem memblokir tindakan ilegal (Contoh: Produksi tidak bisa mulai jika DP belum diverifikasi oleh Finance).

### Lapis 5: Data Consistency Audit (Cross-Table)
*   **Balance Reconciliation**: Script otomatis yang berjalan setiap malam untuk mencocokkan total di `Buku Besar` dengan `Neraca Saldo`.
*   **Sync-Gap Detection**: Mencari record di tabel transaksi yang tidak memiliki jurnal terkait.

### Lapis 6: Performance & Resource Integrity
*   **Memory Leak Hunting**: Memantau penggunaan RAM pada proses Node.js untuk mendeteksi kebocoran memori pada loop yang kompleks.
*   **Race Condition Detection**: Mengetes transaksi yang dikirim secara bersamaan (concurrent) untuk memastikan tidak ada "Double Posting".

### Lapis 7: Runtime Observability
*   **Deep Tracing**: Mengimplementasikan logging yang mencatat `Correlation ID` sehingga satu transaksi bisa dilacak dari Klik Frontend sampai ke Baris Database.
*   **Silent Error Capture**: Menangkap error di background (unhandled rejections) yang seringkali tidak muncul di UI tapi merusak integritas data.

---

## 3. Strategi Pelacakan "Error Mikro"

| Kategori Error | Teknik Pelacakan | Target Solusi |
| :--- | :--- | :--- |
| **Rounding Error** | Audit matematis pada presisi decimal (Decimal.js). | Akurasi Keuangan 100%. |
| **Async Race** | Stress test pada API dengan request simultan. | Idempotency pada setiap endpoint. |
| **UI-State Mismatch** | Validasi state frontend setelah navigasi cepat. | UI selalu cermin dari database. |
| **Zombie Data** | SQL query untuk mencari orphan records. | Database yang bersih dan ramping. |

---

## 4. Protokol Resolusi (Fixing Workflow)
Setiap kali error ditemukan, seorang *Systems Integrity Engineer* wajib melakukan:
1.  **Replikasi**: Membuat test case (Playwright/Jest) yang GAGAL akibat error tersebut.
2.  **RCA (Root Cause Analysis)**: Menemukan alasan arsitektural di balik error (bukan sekadar patch).
3.  **Atomic Fix**: Memperbaiki kode.
4.  **Regression Proofing**: Memastikan test case yang dibuat di langkah 1 sekarang BERHASIL selamanya.
5.  **Documentation Update**: Mencatat pelajaran di `testing_report.md`.

---

## 5. Toolset Utama
*   **Playwright**: Untuk E2E Golden Thread.
*   **Prisma Client**: Untuk audit integritas database.
*   **Zod**: Untuk kontrak data antara Frontend & Backend.
*   **Custom Audit Scripts**: Script Node.js mandiri untuk rekonsiliasi data periodik.

---

> **"Integritas bukan tentang tidak adanya bug, tapi tentang sistem yang cukup cerdas untuk menemukan bug sebelum manusia menyadarinya."**
