# 🧪 Prototype Mode — NexERP (Frontend-Only Demo)

> Branch: `prototype-demo` (dibuat dari `main` = full ERP 28 modul, ~215 halaman)
> Tujuan: demo ke bos / calon klien TANPA menjalankan backend & database.

## ⚡ Cara menjalankan (1 perintah)

```bash
cd frontend
npm run dev        # atau: npm run build && npm start
```

Buka **http://localhost:3000** → login:

```
Email    : superadmin@nexerp.id
Password : password123
```

Semua data = **contoh** (mock). Ada badge **⚡ PROTOTYPE MODE — DATA CONTOH**
di pojok dashboard supaya jelas bukan data operasional.

## 🔧 Bagaimana ini bekerja

| File | Fungsi |
|---|---|
| `frontend/.env.local` | `NEXT_PUBLIC_PROTOTYPE_MODE=true` → menyalakan mode ini |
| `frontend/src/lib/api.ts` | Custom axios adapter: SEMUA panggilan API di-short-circuit ke `getMockData()` — tanpa jaringan, tanpa backend |
| `frontend/src/lib/mock-data.ts` | Data contoh untuk semua modul: executive, marketing, bussdev, finance, rnd, scm, produksi, qc, warehouse, hr, dll |
| `frontend/src/app/login/page.tsx` | Login `superadmin@nexerp.id`/`password123` bypass backend (dapat role SUPER_ADMIN + semua modul) |
| `frontend/src/lib/db.ts` & `prisma.ts` | Prisma dinonaktifkan di prototype mode (tidak butuh DATABASE_URL) |
| `frontend/src/app/(dashboard)/layout.tsx` | Badge "PROTOTYPE MODE" |

## ✅ Hasil verifikasi (scan otomatis 168 route, Playwright)

- **0 crash asli** — semua halaman render tanpa error.
- **105 halaman** konten kaya (data contoh tampil).
- **55 halaman** render tapi lebih tipis (halaman form/input — wajar kosong saat pertama dibuka).
- 8 "warning" tersisa hanya `ERR_CONNECTION_REFUSED`/404 dari server-fetch ke backend yang
  memang tidak ada — halaman tetap render normal (bukan crash).

## 🧠 Bagaimana mock dibuat tahan-crash

| Mekanisme | Fungsi |
|---|---|
| `getMockData()` longest-match | Endpoint spesifik di-prioritaskan |
| `smartEmptyList()` | Fallback array kosong yang punya `.data/.items/.rows/.total` → kompatibel array & paginated |
| `enrichRow()` | Isi otomatis field umum (`name`, `code`, `status`, `customer`, `supplier`, `pelanggan`, `produk`, `batch`, `reason`, `phone`, dll) → cegah crash `undefined.toLowerCase/map/filter` |
| 150+ mock endpoint | Semua modul: executive, marketing, bussdev, finance (incl. laporan), legality, rnd, scm, warehouse, production, qc, hr, master, creative, documents, system, notifikasi |

## ⚠️ Catatan

- Mutasi (create/edit/delete) **tidak tersimpan** — hanya demo tampilan.
- Untuk mode normal (backend asli): set `NEXT_PUBLIC_PROTOTYPE_MODE=false`.
- Branch ini TIDAK mengubah branch `production-light` (deployment asli).
