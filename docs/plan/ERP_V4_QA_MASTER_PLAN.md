# ERP V4: Full-Stack Integrity & QA Master Plan

## 1. Visi & Filosofi QA
Dalam sistem ERP skala besar dengan **27+ modul**, pengujian tradisional (Unit Test) saja tidak cukup. Masalah utama bukan pada logika internal fungsi, melainkan pada **Data Handover** antar divisi (Communication Protocol).

**Prinsip Utama:**
- **Backend as Source of Truth:** Kontrak data ditentukan oleh Backend.
- **Frontend as Contract Consumer:** Frontend harus gagal saat build-time jika melanggar kontrak.
- **The Golden Thread:** Pengujian harus mengikuti alur uang dan barang, bukan sekadar tombol.

---

## 2. Strategi "Triple-Lock" (Tiga Lapis Pengaman)

### Lapis 1: Static Contract Lock (Build-Time)
Memastikan Frontend dan Backend bicara dalam bahasa yang sama secara teknis.
- **Tool:** `openapi-typescript` + Swagger.
- **Mekanisme:** 
  1. Backend men-generate `swagger-spec.json`.
  2. Frontend men-generate TypeScript interfaces dari spec tersebut.
  3. Jika Backend mengubah tipe data `qty` (number) menjadi `string`, Frontend akan error saat kompilasi.
- **Status:** Diimplementasikan lewat script `npm run sync:types`.

### Lapis 2: Runtime Schema Validation (API Boundary)
Mencegah data "sampah" masuk ke sistem atau data yang tidak terduga merusak UI.
- **Tool:** `Zod` (Frontend) & `class-validator` (Backend).
- **Mekanisme:**
  - Setiap respons API di Frontend divalidasi ulang oleh Zod sebelum masuk ke State Management (Zustand/Redux).
  - Jika Backend mengirim data yang tidak sesuai kontrak, UI akan menampilkan "Audit Error Message" yang sopan daripada sekadar crash (White Screen).

### Lapis 3: Dynamic E2E Scenarios (Business Flow)
Memastikan integritas alur kerja antar divisi yang memiliki "High Communication Protocol".
- **Tool:** `Playwright`.
- **Mekanisme:** Kita tidak mengetes "tombol", kita mengetes "transaksi".

---

## 3. Peta Jalur Pengujian (The Golden Threads)

Kita akan fokus pada 3 alur kritis yang melintasi banyak divisi:

| Alur (Golden Thread) | Divisi Terlibat | Titik Kritis (Handover) |
| :--- | :--- | :--- |
| **Procurement-to-Pay** | R&D -> SCM -> Warehouse -> Finance | BOM R&D menjadi PR di SCM. PO SCM menjadi GRN di Warehouse. |
| **Order-to-Cash** | Bussdev -> Production -> Logistics -> Finance | Sales Order menjadi Work Order. WO Selesai menjadi Invoice. |
| **Quality Audit** | Production -> QC -> Warehouse | Produk jadi harus lolos QC sebelum bisa masuk Stock Warehouse. |

---

## 4. Pendekatan Per Divisi (Isolated Integration)

Untuk mencapai target "Per Divisi" namun tetap terintegrasi, kita menggunakan teknik **State Seeding**:

1. **Pre-condition Injection:** Setiap test suite divisi akan memulai dengan "menembak" API untuk menyiapkan data state.
   - *Contoh Tes Warehouse:* Script akan menembak API `/api/scm/purchase-orders/seed` untuk membuat PO yang siap di-receive, baru kemudian Playwright membuka UI Warehouse.
2. **Divisional Assertions:**
   - **R&D:** Fokus pada akurasi formula dan konversi unit.
   - **SCM:** Fokus pada workflow approval dan sinkronisasi vendor.
   - **Finance:** Fokus pada akurasi Jurnal Otomatis yang dihasilkan oleh modul lain.

---

## 5. Roadmap Implementasi

### Tahap 1: Stabilisasi Kontrak (Minggu ini)
- [ ] Audit semua Controller Backend untuk kelengkapan @ApiProperty.
- [ ] Automasi `sync:types` pada pre-commit hook.
- [ ] Implementasi Global Error Boundary di Frontend.

### Tahap 2: Implementasi Golden Thread #1 (SCM-Warehouse)
- [ ] Pembuatan `tests/e2e/procurement.spec.ts`.
- [ ] Setup `global-setup.ts` untuk login otomatis.
- [ ] Validasi sinkronisasi stock secara real-time antara UI Warehouse dan Database.

### Tahap 3: Full Audit Dashboard (Executive)
- [ ] Pengetesan modul Analytics untuk memastikan data aggregat dari semua divisi akurat.

---

## 6. Cara Menjalankan Audit
Untuk memastikan sistem "Linked", jalankan perintah berikut secara berkala:
1. `npm run sync:types` (Cek konsistensi kontrak).
2. `npx playwright test` (Cek konsistensi alur bisnis).

---
**Document Owner:** Antigravity (QA Specialist) & User
**Status:** Living Document / Draft v1.0
