# Temuan Baru — Ditemukan Saat Menyiapkan F2 (2026-10-01)

Tiga temuan ini **tidak** muncul di F1. Semuanya ketemu karena membangun infrastruktur
isolasi untuk F2, bukan karena membaca kode. Semuanya `TERBUKTI` — ada perintah repro.

---

## [F2N-001] `?schema=` di DATABASE_URL diam-diam tidak berlaku — MAJOR

**Lokasi:** `backend/src/prisma/prisma/prisma.service.ts:71`

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
super({ adapter, ... });
```

**Bukti.** Driver adapter resmi Prisma (`PrismaPg`) menerima *connection string* dan
**mengambil `?schema=` darinya untuk mengatur search_path**. Tapi aplikasi ini tidak
memberikan string — ia membuat `pg.Pool` sendiri lalu menyerahkan *pool*-nya. Setelah
itu, Prisma tidak punya jalan untuk tahu schema mana yang aktif, jadi **default ke
`public`** dan menulis SQL-nya fully-qualified (`FROM "public"."sales_leads"`).

Diukur:

```
?schema=audit_f2_finance        → search_path = "$user", public   ← diabaikan
?options=-c search_path=...     → search_path = audit_f2_finance  ← pool ikut, tapi Prisma tetap ke public
```

Write dari keenam instance dengan `?schema=` berbeda **semuanya mendarat di `public`**,
 dikonfirmasi dengan query explicitly schema-qualified.

**Repro:**
```bash
cd backend
node -e "
require('dotenv').config();const {Client}=require('pg');
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL.replace(/\?schema=.*/,'')+'?schema=audit_f2_finance'});
await c.connect();console.log((await c.query('show search_path')).rows[0].search_path);await c.end();})();
"
```

**Dampak ke client.** Single-tenant sekarang tidakugikan — `public` memang yang
diinginkan, jadi tidak ada yang rusak hari ini. Yang rusak adalah **cara memperbaiki
dan cara menguji**: begitu tim memakai `?schema=` untuk test isolation, staging terpisah,
atau multi-tenant, tidak akan ada error — hanya data yang diam-diam ditulis ke tempat
yang salah. Ini bom waktu, bukan bug yang meledak sekarang.

**Perbaikan.** Beri `PrismaPg` connection string, bukan `Pool`:
```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
```
Atau, jika `Pool` wajib (untuk logging/timeout), set `search_path` di level database
role, bukan di URL.

---

## [F2N-002] `_prisma_migrations` tidak ada — CRITICAL

**Lokasi:** database `erp_db_test`, schema `public`

**Bukti.**
```
select to_regclass('public._prisma_migrations');  →  null
select count(*) from information_schema.tables where table_schema='public';  →  212
```
212 tabel, nol riwayat migrasi. Tidak ada tabel bernama migration sama sekali.
Artinya database ini dibangun dengan `prisma db push`, bukan `prisma migrate deploy`.

**Repro:**
```bash
cd backend
node -e "
require('dotenv').config();const {Client}=require('pg');
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});await c.connect();
console.log((await c.query(\"select to_regclass('public._prisma_migrations')::text x\")).rows[0]);
await c.end();})();
"
```

**Dampak ke client.** `backend/init-db.sh:28-39` menjalankan `prisma migrate deploy`
lalu — kalau gagal — **lanjut saja** ke `exec node dist/main` (D7-005). Pada database
yang tidak punya `_prisma_migrations`, `migrate deploy` akan mencoba memutar **56
migrasi dari awal** di atas 212 tabel yang sudah ada. Yang pertama akan gagal
(`relation already exists`), dan karena error diabaikan, aplikasi tetap start dengan
skema yang **tidak pernah diverifikasi terhadap migrasi**.

Ini memperbesar D2-001 dan D7-005, bukan menggantikannya: sekarang kita tahu tidak
cuma "migrasi P04 belum dijalankan" — kita tahu **mekanisme migrasi itu sendiri tidak
pernah teruji di lingkungan ini**, karena tidak pernah berhasil dipakai.

**Yang harus dijawab sebelum deploy berikutnya:** apakah `erp_db_test` (dan produksi)
pernah menjalankan `prisma migrate deploy` sampai selesai? Kalau tidak, "58 migrasi
terpasang" di laporan deploy adalah klaim yang tidak benar.

---

## [F2N-003] `npm run start:prod` menunjuk file yang tidak ada — MINOR

**Lokasi:** `backend/package.json` (`"start:prod": "node dist/src/main"`)
vs `backend/nest-cli.json` (`sourceRoot: "src"`, builder `swc`, tanpa `entryFile`)

**Bukti.** Build menghasilkan `dist/main.js` (632 file, 688ms). `dist/src/main.js`
tidak pernah ada. `npm run start:prod` akan berhenti dengan `MODULE_NOT_FOUND`.

**Repro:**
```bash
cd backend && npx nest build && ls dist/main.js dist/src/main.js
```

**Dampak ke client.** Tidak menyentuh produksi: `Dockerfile:60` memakai
`CMD ["sh", "./init-db.sh"]` dan `init-db.sh` berakhir dengan `exec node dist/main`,
yang benar. Jadi ini laten — hanya menyesatkan siapa pun yang menjalankan backend
secara manual atau yang nanti menuliskan `start:prod` ke runbook. Severity MINOR
karena tidak ada jalur produksi yang memakainya.

---

## Catatan metodologi

Ketiganya adalah pengingat bahwa **audit statik punya batas teto**. F1 membaca 632
file dan tidak menemukan satu pun dari ini, karena tidak satupun bisa terlihat dari
membaca kode — semuanya baru muncul saat mencoba benar-benar menjalankan sistem.

Rekomendasi: tambahkan D9 (Evidence) gate — "setiap konfigurasi runtime yang
diklaim harus punya satu perintah yang membuktikannya" — supaya kelas temuan
ini tertangkap gate, bukan kebetulan.
