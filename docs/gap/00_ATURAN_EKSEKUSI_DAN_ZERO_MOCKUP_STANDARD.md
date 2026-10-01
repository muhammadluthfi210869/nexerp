# 🏛️ PIAGAM STANDAR OPERASIONAL (SOP): EKSEKUSI GAP & ZERO-MOCKUP GUARANTEE

> **Tujuan Dokumen**: Dokumen ini adalah kontrak dan aturan eksekusi mutlak bagi AI Agent dan Developer dalam menyelesaikan kesenjangan (gap) antara ERP lama (`kil.gserp.id`) dan NexERP.  
> **Prinsip Utama**: *"Tidak ada perubahan yang hanya menyentuh kosmetik frontend. Setiap modul wajib diselesaikan secara vertikal utuh: Database $\rightarrow$ Backend Business Logic $\rightarrow$ API Route $\rightarrow$ Frontend DNA $\rightarrow$ Verifikasi Pengujian Nyata."*

---

## 1. 🚫 Aturan Mutlak Bebas Mockup (Zero-Mockup & Zero-Static-Data Policy)

Kesalahan kecil pada sistem ERP dapat mengacaukan operasional perusahaan secara fatal (salah stok gudang, salah hitung piutang/hutang, faktur ganda, atau jurnal selisih). Oleh karena itu:

1. **Dilarang Keras Mock Data / Hardcoded Data**:
   - Dilarang membuat `const dummyData = [...]` di dalam komponen React untuk menampilkan data tabel atau dropdown.
   - Dilarang membuat form modal yang hanya memanggil `toast.success("Berhasil disimpan")` dan memanipulasi local React state tanpa mengirim HTTP request ke backend.
2. **Konektivitas Database Riil**:
   - Seluruh data tabel overview **wajib diambil dari PostgreSQL** melalui API backend yang aktif.
   - Seluruh aksi input (Create), edit (Update), dan hapus (Delete) **wajib ter-persistensi ke database**.
   - Jika halaman di-refresh oleh user (`F5`), data yang baru saja diinput harus tetap ada dan konsisten.
3. **Empty State & Error State Riil**:
   - Jika data kosong di database, tampilkan Empty State resmi dari `@/components/dna`, bukan data rekayasa.
   - Tangani error network / 400 / 500 dengan `DnaToast` atau Banner peringatan yang jelas agar user operasional mengetahui jika ada kendala koneksi atau validasi gagal.

---

## 2. 🧱 Standar Eksekusi Full-Stack Vertikal (Vertical Slice Standard)

Setiap gap yang ditemukan pada audit browser tidak boleh langsung di-"patch" di file `.tsx` frontend. Setiap pekerjaan wajib mengikuti urutan arsitektur 5 lapisan berikut:

```
[ Lapisan 1: Database (Prisma Schema & PostgreSQL) ]
                     ⬇
[ Lapisan 2: Business Logic & State Machine (NestJS Service) ]
                     ⬇
[ Lapisan 3: API Endpoints & DTO Validation (NestJS Controller) ]
                     ⬇
[ Lapisan 4: Frontend UI Component (@/components/dna) ]
                     ⬇
[ Lapisan 5: Automated Testing & Browser Verification (Playwright) ]
```

### Lapisan 1: Database (Prisma)
- Pastikan field, tipe data, foreign key, index, dan enum sudah terdefinisi di `prisma/schema.prisma`.
- Multi-tenancy wajib dijaga: seluruh model wajib memiliki `organizationId` (atau terkait dengan entitas induk ber-tenant).
- Lakukan migrasi / update schema secara aman tanpa merusak data yang sudah ada.

### Lapisan 2: Logika Bisnis & Alur (Business Logic & State Machine)
- Validasi logika bisnis tidak boleh ditaruh semata-mata di frontend. Backend service wajib menolak data jika tidak memenuhi aturan (contoh: harga tidak boleh negatif, kode SKU tidak boleh duplikat, jurnal harus balance).
- Operasi multi-tabel (seperti PO $\rightarrow$ Penerimaan Barang $\rightarrow$ Stok $\rightarrow$ Jurnal) **wajib dibungkus dalam database transaction (`prisma.$transaction`)** untuk mencegah data separuh jadi jika terjadi kegagalan server.

### Lapisan 3: Route, API & DTO
- Setiap endpoint harus memiliki DTO dengan validasi ketat (`class-validator`).
- Mendukung fitur standar tabel: Pagination (`page`, `limit`), Pencarian (`search`), dan Filter (`filter_user`, `category_id`, dll).
- Format response terstandarisasi (`{ success: true, data: [...], total: ... }`).

### Lapisan 4: Frontend UI DNA
- Patuh pada aturan ADR-007: **Hanya gunakan komponen primitif dari `@/components/dna`** (`DnaPageHeader`, `DnaDataTableCard`, `DnaModal`, `DnaInput`, `DnaSelect`, `DnaCell`, dll).
- Semua input teks yang merujuk pada entitas relasi (Customer, Vendor, Barang, CoA) **wajib menggunakan mode Search / Autocomplete**, bukan ketik manual (Sesuai `REQUIREMENT.md` Poin 58).
- Menggunakan `@tanstack/react-query` untuk caching, loading indicator, dan otomatis invalidate query setelah mutasi sukses.

### Lapisan 5: Verifikasi Pengujian (Testing Verification)
- Setiap fitur baru/perbaikan wajib diakhiri dengan pengujian operasional nyata:
  - Input form dengan data valid $\rightarrow$ pastikan tersimpan di DB.
  - Input form dengan data tidak valid $\rightarrow$ pastikan validasi error muncul dan tidak tersimpan.
  - Tombol aksi (Edit, Hapus, Print/Export, Filter) diuji langsung via browser automation atau automated test runner.

---

## 3. 🛡️ Matrix Pencegahan Gangguan Operasional Perusahaan

| Risiko Operasional | Penyebab Potensial | Aturan Pencegahan (SOP) |
| :--- | :--- | :--- |
| **Data Stok / Finansial Selisih** | State frontend tidak sinkron dengan DB | Seluruh kalkulasi total, diskon, pajak, dan kuantitas dihitung ulang di backend service. Frontend hanya menampilkan preview. |
| **Data Nyasar Antar Perusahaan** | Kurang filter `organizationId` | Backend wajib memvalidasi tenant isolation pada setiap query database. |
| **Transaksi Menggantung** | Server error di tengah proses majemuk | Wajib menggunakan Prisma Transaction untuk proses yang mengubah lebih dari satu tabel. |
| **Sistem Macet saat Data Besar** | Query tanpa pagination | Wajib ada server-side pagination dan indexing pada kolom pencarian utama (code, name, date). |
| **Fitur Rusak Tanpa Disadari** | Mengubah kode tanpa pengujian | Wajib menjalankan smoke test browser Playwright sebelum menandai tugas selesai. |

---

## 4. 🏁 Definisi Selesai (Definition of Done - DoD)

Suatu halaman atau gap di dalam file `docs/gap/` **HANYA BOLEH** ditandai sebagai `[x] VERIFIED` apabila telah memenuhi seluruh 5 kriteria berikut:

1. [x] **Database Verified**: Schema Prisma terdefinisi, kolom database tersedia, dan relasi integritas terpasang.
2. [x] **Backend Verified**: Endpoint controller dan service logic menangani validasi, transaksi, dan audit trail tanpa mock.
3. [x] **Zero-Mock Verified**: Frontend 100% membaca dan menulis data ke database melalui API real. Tidak ada objek static dummy di komponen.
4. [x] **Visual DNA & Requirement Verified**: Menggunakan komponen `@/components/dna`, field input autocomplete, dan seluruh kolom/tombol parity dengan G-SERP / `REQUIREMENT.md`.
5. [x] **CRUD & Action Test Passed**: Telah diuji melalui Playwright browser test dari klik tombol "Buat", mengisi form, menekan tombol simpan, hingga record muncul di tabel dan modal detail/print terbuka tanpa error console.

---

Dokumen ini menjadi pedoman mutlak yang mengikat seluruh eksekusi perbaikan gap. Setiap fase audit dan implementasi wajib merujuk pada standar ini.
