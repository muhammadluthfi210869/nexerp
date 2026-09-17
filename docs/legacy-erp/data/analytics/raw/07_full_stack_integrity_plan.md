# Full-Stack Integrity Plan: ERP Dreamlab Sync Audit

Dokumen ini menjelaskan strategi untuk memastikan sinkronisasi 100% antara Backend (NestJS) dan Frontend (Next.js) di seluruh divisi.

## 1. Role Terbaik: "Full-Stack Integrity Auditor" (SDET)
Untuk mengecek apakah backend sudah tertampil di UI, role terbaik adalah **Full-Stack Integrity Auditor** atau **SDET (Software Development Engineer in Test)**.

**Tanggung Jawab:**
*   **Cross-Check Data**: Memastikan setiap kolom di database muncul di UI yang relevan.
*   **Endpoint Mapping**: Memastikan tidak ada "Orphan Endpoints" (backend ada tapi tidak dipakai).
*   **Dynamic Validation**: Mengidentifikasi data yang masih bersifat hardcoded (statis) di frontend.

---

## 2. Plan Strategis: "The 360° Visibility Audit"

### Tahap 1: Audit Inventori (Automated Mapping)
*   **Backend Inventory**: Mengekstrak daftar semua API Endpoints dari Swagger/OpenAPI.
*   **Frontend Inventory**: Melakukan `grep` atau pencarian string pada direktori `frontend/src` untuk mencari pemanggilan API (misal: mencari kata kunci `fetch`, `axios`, atau `useQuery`).
*   **Gap Analysis**: Membuat tabel perbandingan untuk melihat endpoint mana yang belum dipanggil di frontend.

### Tahap 2: Audit Visual per Divisi (Manual & E2E)
Kita akan melakukan walkthrough pada 4 Fase Utama sesuai Blueprint:
1.  **Divisi BussDev**: Cek apakah Lead, PNF, dan Sample Request muncul di Pipeline.
2.  **Divisi Finance**: Cek apakah semua "Financial Gates" (1, 2, 3) menerima data yang benar dari BussDev.
3.  **Divisi R&D/Produksi**: Cek apakah Batch Record menarik data BOM dan Formulasi secara dinamis.
4.  **Divisi SCM**: Cek apakah status PO dan Stok Bahan Baku terupdate real-time.

### Tahap 3: Implementasi "Data-X-Ray"
Membuat script debugging kecil di frontend yang menampilkan status koneksi data pada setiap komponen:
*   Jika data berhasil ditarik: Tampilkan UI Normal.
*   Jika data kosong/null: Tampilkan placeholder "Data Pending/Empty" (bukan halaman kosong/putih).
*   Jika API Error: Tampilkan Error Boundary yang jelas.

---

## 3. Checklist Verifikasi per Divisi (Estimasi Awal)

| Divisi | Backend Feature | Frontend Page | Status Visibility |
| :--- | :--- | :--- | :--- |
| **BussDev** | Create Lead, Upload PNF | `/dashboard/bussdev` | 🟡 Partial |
| **Finance** | Approve DP, Pelunasan | `/dashboard/finance` | 🔴 Missing |
| **R&D** | Submit Formula, Resi | `/dashboard/rnd` | 🟡 Partial |
| **SCM** | BOM Check, PR/PO | `/dashboard/scm` | 🔴 Missing |
| **Produksi**| Batch Record Gen | `/dashboard/production`| 🔴 Missing |

---

## 4. Langkah Segera (Action Items)
1.  **Jalankan Script Audit**: Saya akan membantu melakukan scanning pada folder `backend/src` dan `frontend/src` untuk menemukan ketidaksinkronan.
2.  **Fixing Connection**: Menghubungkan page yang masih kosong ke API Service yang sudah ada di backend.
3.  **UI Data Binding**: Mengganti data dummy di frontend dengan data asli dari API.
