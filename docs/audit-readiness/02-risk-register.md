# 02 — Risk Register (F2 interim)

Status: **INTERIM** — 3 dari 6 domain F2 selesai. Diperbarui 2026-10-01.
Sumber: `f2/finance-report.md` (10), `f2/master-report.md` (8), `01b-infra-findings.md` (3).
Warehouse, HR, CRM, Production masih berjalan. Angka di bawah akan naik.

**Rekaman: 6 BLOCKER · 6 CRITICAL · 8 MAJOR · 1 MINOR = 21 temuan, semua TERBUKTI.**

Semua temuan di bawah bukan hasil membaca kode. Semuanya ada perintah repro-nya dan sudah
dijalankan. F1 membaca 632 file dan tidak menemukan satu pun dari 21 ini.

---

## BLOCKER (6)

### B-1 · F2-FIN-001 + F2-FIN-002 — Faktur penjualan tidak pernah masuk pembukuan
`sales-invoices.service.ts:150-171`. `if (arAcc && revAcc)` mencari akun `4001`; COA punya
`4101`. `findFirst` null → `if` false → transaksi commit, invoice `postedAt` terisi, **0 journal
entry**. Diuji: 3 invoice POST → 201, `journal_entries` = 0.
Dampak: seluruh pendapatan yang difaktur tidak pernah terlihat akuntansi; AR dan pendapatan
understated 100%, sementara UI bilang "posted".

### B-2 · F2-FIN-004 — Sama seperti B-1, dan lebih fatal: tidak ada konfigurasi yang memperbaikinya
Bukti: dengan `4001` dipaksa ada, `POST /:id/post` balas **400 JOURNAL_UNBALANCED — Debit
111.000.000, Credit 100.000.000**. Selisih 11.000.000 **tepat sama dengan PPN**. Jadi:
| State | HTTP | Journal? |
|---|---|---|
| COA apa adanya (tanpa 4001) | 201 | 0 entry — diam |
| COA diperbaiki (4001 ada) | 400 | 0 — seluruh penagihan macet |
Memperbaiki COA tidak memperbaiki penagihan; ia mengubah penghapusan senyap menjadi
pemblokiran total.

### B-3 · F2-MASTER-001 — Tabel `customers` tidak punya satu pun produser
`customers.service.ts` 383 baris: `prisma.salesLead` ×8, `prisma.customer` **×0**.
`POST /v1/master/customers` → 201, UUID mendarat di `sales_leads`. UUID itu di-probe ke tiga FK
keuangan → **`23503` Foreign Key Violation** di `sales_invoices`, `ar_receipts`,
`client_escrows`. Sementara `work_orders`/`purchase_orders`/`sales_orders`/`sample_requests`
resolve normal.
Dampak: **split brain** — lead hidup di sisi komersial, mati di sisi keuangan. `sales_invoices`
tidak bisa menyimpan satu baris pun dari UI. Lihat [[customer-saleslead-are-two-entities]].

### B-4 · F2-FIN-003 — Konsekuensi ujung B-3, dibuktikan independen
`POST /v1/master/customers` → `.id` → `POST /v1/finance/sales-invoices` → **404 Customer not
found**. Dua agent, dua database berbeda, kesimpulan sama. Layar "Buat Invoice" tidak bisa menghasilkan
invoice valid.

### B-5 · F2-FIN-006 — Laporan neraca tidak pernah menampilkan isi database yang sebenarnya
`journal_entries.date` adalah `timestamp without time zone`; session DB = `Asia/Bangkok`
(UTC+7). Prisma mengirim `new Date()` sebagai **UTC**, sedangkan baris tersimpan sebagai
**wall-clock Bangkok** — dua jam dinding yang berbeda dipakai untuk hal yang sama.

Diukur ulang sendiri (bukan hasil agent), DB `audit_f2_finance`, request pada
`2026-10-01T05:58:53Z`:

| sumber | jumlah |
|---|---|
| **Kenyataan di `journal_lines`** (4 entri: 70 jt + 50 jt + 50 jt + 50 jt) | **170.000.000** |
| `GET /balance-sheet` (default) | **70.000.000** |
| `GET /balance-sheet?date=2026-12-31` | **120.000.000** |

Tiga angka berbeda, untuk detik yang sama. Selisih default vs bertanggal = **50.000.000**;
dan **tidak ada pun** yang sama dengan kenyataan database — reports yang diberi tanggal juga
kehilangan 50.000.000. `isBalanced` = `false` di keduanya, jadi penandanya tidak bohong di
kasus ini.
Dampak: **jalur ordinary, bukan edge case** — tidak ada satu pun pemanggilan neraca yang
bernilai benar, dan angka yang tampil berbeda tergantung parameter mana yang dipakai.

> Catatan: B-1, B-2, B-3, B-4 saling mengunci. Satu perbaikan COA saja tidak cukup; nomor 3
> harus beres dulu supaya ada customer yang bisa di-tagih.

---

## CRITICAL (6)

| ID | Temuan | Bukti satu baris |
|---|---|---|
| C-1 | F2-FIN-007 — Cancel invoice yang sudah posted tidak membalik jurnalnya | `postedAt` **dan** `cancelledAt` terisi bersamaan; `cancel()` cuma satu `update`, tidak baca jurnal, tidak buat kontra. Route pembalik yang benar ada (`POST /finance/journals/:id/reverse`, teruji benar) tapi tidak dipakai |
| C-2 | F2-FIN-010 — Dashboard eksekutif balas 200 dengan angka nol saat query-nya crash | 12 `catch` di `executive.service.ts`; `nominalValue` di-rename → `revenue.mtd` 777.000.000 → **0**, HTTP **200**, seksi lain utuh, tanpa penanda degrade |
| C-3 | F2-MASTER-002 — "Hapus Permanen" hanya set `status: LOST` | `DELETE` → 200; baris masih ada; **tabel `sales_leads` tidak punya kolom `deletedAt`** sama sekali; baris masih muncul di list, dropdown, dan pencarian |
| C-4 | F2-MASTER-003 — Tidak ada kontrak soft-delete di domain customer | `remove()` = `findUnique` → `NotFoundException` → `update status:LOST`. Tanpa kolom `deletedAt`, soft delete mustahil tanpa migrasi |
| C-5 | F2-MASTER-006 — Duplikat `brandCode` → HTTP 500 dengan stack trace + path server bocor | `@unique` tanpa handler; response memuat `C:\GAWE\...\dist\...customers.service.js:328:38` + potongan source. Duplikat `clientName`/`email` justru **201 diterima** → 2 pelanggan berbeda |
| C-6 | F2N-002 — `_prisma_migrations` tidak ada di DB lokal | 212 tabel, nol riwayat. `init-db.sh:28-39` jalankan `migrate deploy`, **abaikan error**, lalu tetap start. Mekanisme migrasi belum pernah teruji. Lihat [[local-db-has-no-migration-history]] |

---

## MAJOR (8)

| ID | Temuan | Lokasi |
|---|---|---|
| M-1 | F2-FIN-005 — **D1-003 F1 salah.** Target-nya dead code; kedua endpoint live pakai `Math.abs(a-b) < 0.01` dan benar melaporkan `isBalanced:false` | `reports.controller.ts` hanya 9 route, `balance-sheet` bukan salah satunya |
| M-2 | F2-FIN-008 — Jurnal invoice tidak pernah diisi `salesInvoiceId`; `sourceDocumentType` ditulis `'SALES_ORDER'` untuk sales invoice | `sales-invoices.service.ts:155-170` |
| M-3 | F2-FIN-009 — Tidak ada route edit/void invoice; `PATCH`/`PUT`/`DELETE` → 404 | `sales-invoices.controller.ts:24-61` |
| M-4 | F2-MASTER-004 — **Koreksi F1 (D5-005).** Audit interceptor **menyala** 4/4 untuk mutasi sukses; yang hilang adalah isinya, bukan lognya. Tapi gagal = **0/4** dan `void this.record()` fire-and-forget | `audit.interceptor.ts:152,161` |
| M-5 | F2-MASTER-005 — `beforeSnapshot` diisi dari `req.body`, jadi "before" = nilai **baru**; DELETE → `null` | `audit.interceptor.ts:147` |
| M-6 | F2-MASTER-007 — Pesan validasi tidak pernah menyebut field yang salah; 4 payload berbeda → body identik | `customer.dto.ts`, `@IsString()` tanpa `@IsNotEmpty()` |
| M-7 | F2-MASTER-008 — UUID tidak valid → 500, bukan 400; membocorkan path server | tidak ada `ParseUUIDPipe` |
| M-8 | F2N-001 — `?schema=` di `DATABASE_URL` diam-diam tidak berlaku | `prisma.service.ts:71` |

---

## MINOR (1)

F2N-003 — `start:prod` → `node dist/src/main`; build menghasilkan `dist/main.js`. Tidak
menyentuh produksi (`Dockerfile` pakai `exec node dist/main`), tapi menyesatkan runbook.

---

## Pola yang berulang (bukan daftar bug, tapi desain)

Enam BLOCKER pertama bukan enam kesalahan terpisah. Empat berasal dari **satu** keputusan:
`if (arAcc && revAcc)` diperlakukan sebagai "kondisi yang mungkin gagal" alih-alih invariant yang harus
dilempar. Akibatnya sistem lebih memilih diam daripada berteriak. Pola yang sama berulang di
`executive.service.ts` (12 catch), di `init-db.sh` (error migrasi diabaikan), dan di
`audit.interceptor.ts` (void fire-and-forget). **Perbaikannya bukan 6 patch, tapi satu aturan:
kegagalan harus mengubah status HTTP, tidak boleh pernah menghasilkan 200 yang-isinya bohong.**

## Catatan metodologi

- Isolasi box diverifikasi ulang per-database dengan `schema.table` eksplisit:
  `erp_db_test` tetap 0 invoice; tiap `audit_f2_*` hanya berisi datanya sendiri. Klaim
  "isolation nominal" di laporan finance **overstated** — 7 schema kosong ikut ter-clone,
  tapi `public` tiap database benar-benar terpisah.
- Sisa probe di `audit_f2_finance` (akun `4001` Buatan agent dan baris `F2-AUDIT-Buyer`
  di `customers`) adalah bypass yang disengaja untuk membuktikan B-2. Database ini
  sekali pakai; jangan dipakai sebagai bukti apa pun soal COA.
- `F2-AUD-UNBAL` (Dr 70 jt / Cr 50 jt) masuk lewat SQL langsung **tanpa** ditolak guard.
  Guard `assertJournalBalanced` hanya menutup `journalEntry.create` Prisma. App saat ini punya
  0 penulis raw-SQL ke journal, jadi belum bisa dieksploitasi — tapi plafonnya nyata.
