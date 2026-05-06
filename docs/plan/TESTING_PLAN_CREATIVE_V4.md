# Creative & Packaging Design V4: Testing Plan

Rencana ini bertujuan memvalidasi integritas data, keamanan e-signature, dan efektivitas alur kerja Kanban.

## I. Skenario Pengujian Utama (UAT)

### 1. The Happy Path (Inbox to Print)
*   **Aksi**: Desainer mengunggah Master Asset V1 (Ai) & Mockup (JPG).
*   **Ekspektasi**: 
    *   Task berpindah dari `INBOX` ke `IN_PROGRESS`.
    *   File tersimpan di `/uploads/creative_assets/`.
    *   Versi tercatat di tabel `DesignVersion`.

### 2. Digital Signature & APJ Review
*   **Aksi**: APJ melakukan review dengan memasukkan PIN 6-digit.
*   **Ekspektasi**:
    *   Jika PIN salah: Akses ditolak (401 Unauthorized).
    *   Jika PIN benar & Approved: Task pindah ke `WAITING_CLIENT`.
    *   Audit trail mencatat IP Address dan timestamp di `DesignFeedback`.

### 3. Soft-Block Revision (Edge Case)
*   **Aksi**: Desainer mencoba mengunggah revisi ke-4 (Batas Maks: 3).
*   **Ekspektasi**:
    *   Sistem menolak upload (400 Bad Request).
    *   Status task menjadi `LOCKED` (IsLocked: true).
    *   Tombol "Push Revision" di Frontend menjadi non-aktif.

### 4. SCM Interlock (Integration)
*   **Aksi**: Client memberikan approval final.
*   **Ekspektasi**:
    *   Status berubah menjadi `LOCKED`.
    *   Sistem otomatis membuat entry baru di tabel `PurchaseOrder` dengan tipe `PRINTING`.

---

## II. Pengujian Teknis (API & Performance)

### 1. File Size Hardening
*   **Test**: Upload JPG berukuran 10MB (Limit: 5MB).
*   **Ekspektasi**: Response `400 Bad Request: Mockup file too large`.

### 2. Real-time SSE Broadcast
*   **Test**: Buka dua browser (Satu BusDev, Satu Desainer). Ubah status di salah satu browser.
*   **Ekspektasi**: Browser lainnya menerima toast notifikasi instan tanpa refresh.

### 3. PIN Encryption Security
*   **Test**: Periksa tabel `User` di database.
*   **Ekspektasi**: Kolom `approvalPin` harus berupa hash (Bcrypt), bukan teks biasa.

---

## III. Matriks Penerimaan (Success Metrics)

| Feature | Pass Criteria | Status |
| :--- | :--- | :--- |
| **State Machine** | Task tidak bisa loncat status (misal: Inbox langsung Locked) | [ ] |
| **Revision Control** | Counter revisi bertambah setiap upload versi baru | [ ] |
| **Audit Logs** | Setiap feedback memiliki author, IP, dan status yang jelas | [ ] |
| **Auto PO** | PO Printing terbentuk dengan link ke ID Design yang benar | [ ] |

---

## IV. Cara Menjalankan Test (Developer Guide)
1.  **Unit Test**: `npm run test backend/src/modules/creative`
2.  **E2E Test**: Gunakan script `test/creative-v4.e2e-spec.ts` (Akan saya buatkan jika diperlukan).
