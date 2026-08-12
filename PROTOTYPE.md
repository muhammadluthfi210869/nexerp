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
Email    : superadmin@dreamlab.id
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
| `frontend/src/app/login/page.tsx` | Login `superadmin@dreamlab.id`/`password123` bypass backend (dapat role SUPER_ADMIN + semua modul) |
| `frontend/src/lib/db.ts` & `prisma.ts` | Prisma dinonaktifkan di prototype mode (tidak butuh DATABASE_URL) |
| `frontend/src/app/(dashboard)/layout.tsx` | Badge "PROTOTYPE MODE" |

## ✅ Halaman yang terverifikasi (data tampil + tanpa crash)

Executive, Marketing, Bussdev, Finance, RND, SCM, Production, QC, Warehouse, HR.
~215 halaman lain bisa dinavigasi; halaman form/detail yang endpointnya belum di-mock
menampilkan state kosong (tidak crash).

## ⚠️ Catatan

- Mutasi (create/edit/delete) **tidak tersimpan** — hanya demo tampilan.
- Untuk mode normal (backend asli): set `NEXT_PUBLIC_PROTOTYPE_MODE=false`.
- Branch ini TIDAK mengubah branch `production-light` (deployment asli).
