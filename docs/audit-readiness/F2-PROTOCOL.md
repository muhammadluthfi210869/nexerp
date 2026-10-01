# F2 — Protokol Validasi CRUD Dinamis

Status: aktif. Tanggal 2026-10-01. Melanjutkan `00-CHARTER.md`.

## 1. Why F2 exists

F1 (static read) memberi 103 temuan. F1 bekerja pada source code — dia tidak pernah menjalankan
satu pun operasi bisnis. F2 menjalankan CRUD nyata dan membandingkan tiga lapis:

```
UI  →  API  →  Database
```

Domain yang tidak cocok di antara ketiganya = temuan `TERBUKTI`.
Domain yang cocok = terkonfirmasi, Findings F1 bisa ditutup.

## 2. Your box

Setiap agent mendapat **database sendiri dan backend sendiri**. Tidak ada yang berbagi.

| Agent | Port | Database | Domain |
|---|---|---|---|
| finance | 3211 | `audit_f2_finance` | Sales, Invoice, Payment, Journal, COA, Laporan keuangan |
| master | 3212 | `audit_f2_master` | Customer, Product, Supplier, Employee, COA master |
| warehouse | 3213 | `audit_f2_warehouse` | Stock masuk/keluar, Opname, Lot, Valuation |
| production | 3214 | `audit_f2_production` | Work Order, BOM, Pemakaian material, R&D |
| crm | 3215 | `audit_f2_crm` | Lead, Sample Request, Activity, Konversi |
| hr | 3216 | `audit_f2_hr` | Employee, Attendance, KPI, Approval, Payroll |

**Base URL API:** `http://localhost:<PORT>/v1`

## 3. Login

```
POST http://localhost:<PORT>/v1/auth/login
Content-Type: application/json

{"email":"zaki@dreamlab.com","password":"password123"}
```

Response: `{"accessToken":"..."}`. Pakai `Authorization: Bearer <token>`.
`zaki@dreamlab.com` punya role `SUPER_ADMIN`. Email lain bila perlu role khusus:
lihat `backend/prisma/seeders/personnel.seeder.ts:30-70` (password semua user = `password123`).

## 4. Akses database langsung (lapisan 3)

Jalankan node dari folder `backend/`:

```bash
cd backend
node -e "
require('dotenv').config();
const {Client}=require('pg');
(async()=>{
  const c=new Client({connectionString: process.env.DATABASE_URL
    .replace(/\?schema=.*/,'')
    .replace('/erp_db_test','/audit_f2_<DOMAIN>')});
  await c.connect();
  const r = await c.query('SELECT ...');
  console.log(r.rows);
  await c.end();
})();
"
```

**WAJIB** ganti `/erp_db_test` → `/audit_f2_<domain-kamu>`. Query tanpa prefiks schema
(`SELECT * FROM x`) juga boleh karena tiap box adalah database utuh.

## 5. Hard rules

1. **Jangan sentuh `erp_db_test`.** Itu database dev milik pemilik. Menulis di sana
   merusak environment kerja dia.
2. **Jangan sentuh database agent lain.** Kalau perlu cross-check, connect read-only saja.
3. **Jangan jalankan `DROP`/`TRUNCATE`/`DELETE` tanpa filter.** Kalau memang perlu
   membersihkan data uji yang kamu buat sendiri, filter dengan awalan `AUDIT_` atau `F2_`.
4. **Jangan ubah kode.** F2 mengukur, bukan memperbaiki. Kalau nemu bug, catat
   `file:line`, jangan edit.
5. **Jangan start/stop backend.** Dikelola oleh orkes.
6. Setiap data uji yang kamu buat: prefix `AUDIT_` atau `F2_` di setiap field
   string yang bisa jadi unik (nama, kode, email). Ini yang membuat data bisa
   dibersihkan dan ditelusuri.

## 6. Apa yang diuji — definisi "CRUD penuh"

Untuk setiap entitas dalam domainmu, uji **lima operasi** dan **tiga lapis**:

| Operation | API | DB check |
|---|---|---|
| Create | `POST /v1/<resource>` | row muncul, kolom terisi sesuai, ID unik |
| Read list | `GET /v1/<resource>` | row ada di response, `total` benar |
| Read one | `GET /v1/<resource>/:id` | field lengkap, tidak null-ed |
| Update | `PATCH`/`PUT /v1/<resource>/:id` | perubahan benar-benar tersimpan, tidak hanya di response |
| Delete | `DELETE /v1/<resource>/:id` | sesuai kontrak: soft delete (`deletedAt`) atau hard delete |

Tambahan wajib per entitas:
- **Validasi input** — kirim payload dengan field wajib kosong → harus 400 dengan
  pesan yang menyebut field mana.
- **Duplikat** — buat dua record dengan kode sama → harus ditolak (unique).
- **Referential integrity** — hapus induk yang masih punya anak → harus ditolak atau
 cascade sesuai kontrak, tidak boleh jadi yatim.
- **Otorisasi** — panggil dengan token NON-admin (role biasa) → endpoint terproteksi
  harus 403. Ini cross-check D3.

## 7. Lapisan UI

Frontend Next.js dev server **tidak** terisolasi per agent — semua agent akan
berbagi satu proses dan satu browser state. Karena itu:

- **F2 = API + Database.** Lapisan UI (klik nyata di browser) ditunda ke F3 yang serial.
- Namun: **BACA** kode frontend untuk setiap endpoint yang kamu uji, dan catat
  apakah UI mengirim payload yang cocok dengan DTO backend. field name yang
  berbeda antara FE dan BE = temuan `TERBUKTI` (tombol di layar tidak akan pernah berhasil).

## 8. Format output — WAJIB

Dua file per agent:

**`docs/audit-readiness/f2/<domain>-report.md`** — Findings, format ini persis:

````markdown
### [F2-<DOMAIN>-NNN] judul ringkas
- Severity:    BLOCKER | CRITICAL | MAJOR | MINOR
- Confidence:  TERBUKTI | DIDUGA
- Lokasi:      backend/src/...ts:LINE   (untuk temuan kode)
               atau  POST /v1/x → 200   (untuk temuan runtime)
- Bukti:       1-3 kalimat, facts only. Angka, status code, isi response.
- Repro:       perintah yang bisa dijalankan ulang oleh orang lain
- Dampak ke client: 1 kalimat
- Lapis:       API | DB | FE-BE | AUTH
````

**`docs/audit-readiness/f2/<domain>-coverage.json`** — tabel CRUD:

```json
{
  "domain": "finance",
  "port": 3211,
  "entities": [
    {
      "entity": "sales_invoices",
      "create": {"api": "PASS|FAIL|SKIP", "db": "PASS|FAIL|SKIP", "note": ""},
      "readList": {"api": "", "db": ""},
      "readOne": {"api": "", "db": ""},
      "update": {"api": "", "db": ""},
      "delete": {"api": "", "db": "", "contract": "soft|hard|none"},
      "validation": "", "duplicate": "", "referential": "", "authz": "",
      "totalChecks": 0, "passed": 0, "failed": 0
    }
  ],
  "summary": {"entities": 0, "checks": 0, "passed": 0, "failed": 0, "blockers": 0}
}
```

SKIP hanya dengan alasan tertulis di note (misal "endpoint tidak ada di ROUTE_MAP").

## 9. Dilarang

- Kata "kemungkinan besar", "sepertinya", "idealnya", "biasanya"
- Menuduh tanpa bukti eksekutabel
- Menyebut severity tanpa menguji
- Menghapus data milik agent lain atau `erp_db_test`

## 10. Finding F1 yang wajib kamu uji ulang

F1 menandai ini. Uji di domainmu. Kalau ternyata SALAH, bilang — itu informasi
bernilai sama pentingnya dengan temuan baru.

| ID | Yang allegedly salah | Domain |
|---|---|---|
| D1-001 | PPN tidak pernah dikreditkan; `sales-invoices.service.ts:150-160` hanya Dr 1201 / Cr 4001 | finance |
| D1-003 | `balance-sheet-report.service.ts` menjumlahkan Decimal ke float lalu `is_balanced` pakai `===` | finance |
| D4-003 | `executive.service.ts` 12 `catch` yang return nol dengan HTTP 200 | finance (laporan) |
| D4-004 | `valuation.service.ts:78-90` catch di luar `$transaction`, valuation basi diam-diam | warehouse |
| D5-005 | `customers.service.ts:362-369` tombol "Hapus Permanen" cuma set `status: LOST` | master |
| D3-011 | `roles.guard.ts` fail-open saat `@Roles` kosong | semua (authz) |
| D3-012 | `app.module.ts:135` hanya `ThrottlerGuard` sebagai `APP_GUARD` | semua (authz) |
