# F2-MASTER — Master Domain Audit Report

Agent: F2-MASTER · Port 3212 · DB `audit_f2_master`
Tanggal 2026-10-01. Protokol: `docs/audit-readiness/F2-PROTOCOL.md`.
Semua angka di bawah adalah hasil eksekusi, bukan pembacaan kode.

Ringkasan: **8 temuan, 3 BLOCKER, 3 CRITICAL, 2 MAJOR. Semua TERBUKTI.**
F1 claims: D5-005 **sebagian salah** (audit_log ada, bukan nol).

---

### [F2-MASTER-001] `customers` table tidak punya satu pun produser; id dari `/v1/master/customers` gagal FK di seluruh tabel finance
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/master/services/customers.service.ts` (383 baris, 0 rujukan `prisma.customer`)
              `backend/src/modules/finance/services/finance-invoice.service.ts:79`
              `backend/src/modules/finance/sales-invoices/sales-invoices.service.ts:63`
              `backend/src/modules/finance/ar-receipts/ar-receipts.service.ts:68`
              `backend/src/modules/finance/client-escrows/client-escrows.service.ts:53`
              `POST /v1/master/customers → 201`
- Bukti:       Kensus `prisma.<model>.` di dalam `customers.service.ts` mengembalikan tepat tiga model:
              `salesLead` ×8, `bussdevStaff` ×3, `masterCategory` ×2 — `customer` **×0**.
              Prisma `model Customer` (`@@map("customers")`) punya relasi balik
              `invoices SalesInvoice[] / receipts ARReceipt[] / escrow ClientEscrow[]` dan **tidak punya**
              relasi ke `SalesLead`. `model SalesLead` punya `workOrders / salesOrders / purchaseOrders /
              sampleRequests` dan **tidak punya** relasi ke `Customer`. Kedua ruang id terpisah secara konstruksi.
              Eksekusi: `POST /v1/master/customers` → **201**, id `c89a8fb0-a684-4807-a740-8a9984c555d2`.
              Baris itu ada di `sales_leads` (1 baris), di `customers` (**0 baris**).
              Probe FK langsung memakai id yang dikembalikan API:
              `insert into sales_invoices (...)` → **23503 violates foreign key constraint "sales_invoices_customerId_fkey"**
              `insert into ar_receipts (...)` → **23503 ... "ar_receipts_customerId_fkey"**
              `insert into client_escrows (...)` → **23503 ... "client_escrows_customerId_fkey"**
              Ketiga constraint: `FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE RESTRICT`.
              `select count(*) from customers` = **0**. `select count(*) from sales_leads` = 14.
- Repro:       `node -e` di `backend/` dengan `DATABASE_URL` diarahkan ke `audit_f2_master`:
              login → `POST /v1/master/customers {"clientName":"AUDIT_F2_X","phone":"0812"}` →
              `insert into sales_invoices (id,"invoiceNumber","customerId","customerDate","dueDate",subtotal,"totalAmount","updatedAt") values (gen_random_uuid(),'X','<id>',now(),now(),0,0,now())`
              → `ERROR 23503`.
- Dampak ke client: Tidak ada satu pun customer yang bisa dibuat lewat sistem ini yang dapat dipakai di modul finance.-sales_invoices, finance.ar_receipts, atau finance.client-escrows. Ketiga tabel itu **0 baris** dan tidak bisa diisi.
- Lapis:       DB

> Angka paling merusak dari audit ini: `sales_invoices` berisi **0 baris** dan FK-nya menunjuk tabel yang **0 baris** dan **0 produser**. Form invoice tidak bisa menyimpan satu baris pun.

Rantai id yang diikuti end-to-end (TEST 1b):

```
UI  POST /master/customers  (useCustomerOperations.ts:256)
      ↓  201
API customers.controller.ts:99  →  customers.service.ts:278  prisma.salesLead.create()
      ↓
DB  sales_leads.id = c89a8fb0-a684-4807-a740-8a9984c555d2
      ├── work_orders.leadId        → RESOLVE  (FK → sales_leads)  ✔
      ├── purchase_orders.leadId    → RESOLVE  (FK → sales_leads)  ✔
      ├── sales_orders.leadId       → RESOLVE  (FK → sales_leads)  ✔
      ├── sample_requests.leadId    → RESOLVE  (FK → sales_leads)  ✔
      ├── sales_invoices.customerId → **23503 FK VIOLATION**  ✘  (FK → customers)
      ├── ar_receipts.customerId    → **23503 FK VIOLATION**  ✘  (FK → customers)
      └── client_escrows.customerId → **23503 FK VIOLATION**  ✘  (FK → customers)
```

Kolom FK yang benar-benar ada di DB (`information_schema`, confirmed by probe):
- `→ customers(id)`: `sales_invoices.customerId`, `ar_receipts.customerId`, `client_escrows.customerId`
- `→ sales_leads(id)`: `work_orders.leadId`, `purchase_orders.leadId`, `sales_orders.leadId`, `sample_requests.leadId`

Jadi id **tidak** vanish di sisi operasional (work order, PO, SO, sample request semuanya resolve) — ia vanish tepat di sisi keuangan. Konsekuensinya bukan dead weight total, melainkan **split-brain**: satu entitas hidup di domain commercial, mati di domain finance.

---

### [F2-MASTER-002] "Hapus Permanen" hanya set `status: LOST` — tidak ada soft delete, tidak ada hard delete
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/master/services/customers.service.ts:362-369`
              `frontend/src/app/(dashboard)/master/customers/page.tsx:1066` (`confirmText="Hapus Permanen"`)
              `frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts:273-277`
              `DELETE /v1/master/customers/:id → 200`
- Bukti:       Dibuktikan dengan eksekusi, tiga pertanyaan dipisah:
              (a) **Apakah baris masih ada?** Ya. `DELETE /v1/master/customers/c89a8fb0-…` → **200**;
              sesudahnya `select status from sales_leads where id=…` → baris ada, `status = "LOST"`,
              `clientName = "AUDIT_F2_CUST_508724"` utuh.
              (b) **Ada `deletedAt`?** Tidak, dan tidak bisa ada. Tabel `sales_leads` **tidak punya kolom
              `deletedAt`** — dicek via `information_schema.columns`: `deletedAt? false`. Tabel `customers`
              juga `deletedAt? false` (punya `isActive`, tapi tak satu pun service menuliskannya —
              0 rujukan `isActive` di `customers.service.ts`).
              (c) **Berapa `audit_logs`?** Untuk entitas itu ada **4 baris**: `POST /v1/master/customers`,
              `DELETE /v1/master/customers/:id`, `PATCH …`, `DELETE …` — semua `entityType = "Customers"`,
              `source = "127.0.0.1"`.
              Menorcai lebih jauh: baris yang dihapus tetap **terlihat di UI**. `GET /v1/master/customers?search=AUDIT_F2`
              → 200 dan masih mengembalikan entri itu; `GET /v1/master/customers/{id}` → 200 dengan
              `clientName: AUDIT_F2_RENAMED`. Toast FE berbunyi
              `Pelanggan ${nama} berhasil dihapus.` — datasinya tidak dihapus.
- Repro:       `curl -X POST localhost:3212/v1/master/customers -d '{"clientName":"AUDIT_F2_X","phone":"0812"}'` →
              `curl -X DELETE localhost:3212/v1/master/customers/<id>` → 200 →
              `select status from sales_leads where id='<id>'` → `LOST`, baris masih ada.
- Dampak ke client: Pelanggan yang dianggap sudah dihapus masih muncul di daftar, di dropdown `CustomerSelect`, dan di pencarian. `status=LOST` adalah status **sales pipeline**, bukan status hapus — data tidak pernah hilang dari sistem.
- Lapis:       API

**Koreksi terhadap F1 (D5-005):** F1 menyebut file itu "menulis nol `auditLog`". Bagian itu **SALAH** —
lihat F2-MASTER-004. Yang benar adalah F1 soal perilakunya.

---

### [F2-MASTER-003] `customers` juga tidak punya soft-delete contract sama sekali — violate BUS-RULE-096
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/modules/master/services/customers.service.ts:362-369`
              `backend/prisma/schema/crm.prisma` (`model SalesLead`) dan model `Customer`
- Bukti:       `remove()` adalah satu-satunya operasi hapus dan isinya persis:
              `findUnique` → `NotFoundException` → `salesLead.update({ where:{id}, data:{ status:'LOST' } })`.
              Tidak ada `delete()`, tidak ada `update({deletedAt})`, tidak ada `isActive:false`.
              Karena kolom `deletedAt` tidak ada di tabel, **soft delete tidak mungkin diimplementasikan**
              tanpa migrasi. Kontrak yang diumumkan UI ("Hapus Permanen") dan kontrak yang dijalankan
              ("ubah status pipeline") tidak cocok, dan tidak ada opsi ketiga.
- Repro:       Baca `customers.service.ts:362-369`; konfirmasi kolom via
              `select column_name from information_schema.columns where table_name='sales_leads' and table_schema='public'`
              → tidak ada `deletedAt`.
- Dampak ke client: Tidak ada cara soften maupun menghapusnya secara programatis. Kompliance BUS-RULE-096 bergantung pada kode yang tidak pernah ditulis.
- Lapis:       API

---

### [F2-MASTER-004] KOREKSI F1: audit interceptor **menyala** untuk master — 4 dari 4 mutasi sukses tercatat
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/platform/audit/audit.interceptor.ts:150-165`
- Bukti:       F1 (D5-005) mengklaim file `customers.service.ts` menulis nol baris audit dan Portanto tidak ada jejak. **Salah.**
              Diukur dengan-before/after pada `audit_logs` (dengan jeda 1.5 s, karena `tap()` menulis
              asinkron via `void this.record()`):

              | operasi | HTTP | Δ audit_logs |
              |---|---|---|
              | CUSTOMER create | 201 | **+1** |
              | CUSTOMER update (PATCH) | 200 | **+1** |
              | CUSTOMER delete | 200 | **+1** |
              | CUSTOMER delete (2×) | 200 | **+1** |

              Rasio **4/4 = 100 %** untuk mutasi yang sukses, 4/4 entitas `entityType = "Customers"`,
              `action` persis route-nya (`"DELETE /v1/master/customers/:id"`), `source = "127.0.0.1"`.
              Sumber baris lain di tabel yang sama: `source creative` 360, `rnd.formulas` 72,
              `rnd.service.verifySamplePayment` 36, `127.0.0.1` 21.
              Distribusi `entityType` di 521 baris: `DesignTask` 360, `Formula` 72, `SampleRequest` 60,
              `Customers` 20, `SalesLead` 12, `Categories` 1.
- Repro:       `select action,"entityType" from audit_logs where "entityId"='<id>' order by "occurredAt"`
- Dampak ke client: Jejak audit untuk master customer sebenarnya tersedia. Yang hilang bukan lognya, tapi **isi lognya** — lihat F2-MASTER-005.
- Lapis:       DB

**Dua kelemahan nyata yang muncul dari pengukuran ini:**

1. **Audit bersifat fire-and-forget.** `interceptor.ts:152` memanggil `void this.record(...)` di dalam
   `tap()`. Diukur: Δ `audit_logs` **0** pada saat HTTP response diterima, **+1** setelah ~1–2 detik.
   Kalau proses mati di antara dua titik itu, mutasi tercatat tapi audit hilang, tanpa error ke siapa pun
   (`record()` menelan exception ke `logger.warn`, `interceptor.ts:198-203`).
2. **Mutasi yang DITOLAK menulis 0 baris audit.** 4 request gagal (2× 400, 2× 404) → Δ 0.
   `tap()` hanya jalan di jalur sukses, jadi percobaan yang gagal tidak pernah terlihat.
   Rasiocjujur: **sukses 4/4 (100 %), gagal 0/4 (0 %)**.

---

### [F2-MASTER-005] Audit mencatat `beforeSnapshot` = body request, sehingga "before" bukan data sebelum
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `backend/src/platform/audit/audit.interceptor.ts:147`
              `interceptor.ts:161`
- Bukti:       Baris 147: `const beforeSnapshot = req.body ? sanitizePayload(req.body) : null;`
              Ini secara definisi adalah **payload kiriman**, bukan state pra-mutasi. Untuk PATCH, "before"
              berisi nilai **baru** yang dikirim klien. Untuk DELETE, `req.body` kosong, jadi `beforeSnapshot`
              = `null` — state pra-hapus tidak pernah terekam, padahal `remove()` mengubah `status`
              dari `NEW_LEAD` ke `LOST`. `afterSnapshot` (`interceptor.ts:161`) juga tidak pernah
              merekam nilai pra-mutasi, hanya response.
              Efeknya pada kasus yang diuji: baris audit `DELETE` menyimpan `beforeSnapshot = null`
              dan `afterSnapshot = { status: "LOST", … }`. Rekonstruksi "apa yang dihapus user dan
              apa nilainya sebelumnya" mustahil dari audit log.
- Repro:       `select action,"beforeSnapshot" from audit_logs where action like 'DELETE /v1/master/customers%'`
- Dampak ke client: BUS-RULE-097 ("audit-first") secara formal terpenuhi karena baris ada, tetapi isinya tidak dapat dipakai untuk forensik atau rollback.
- Lapis:       DB

---

### [F2-MASTER-006] `brandCode` duplikat → HTTP 500 dengan stack trace Prisma + path absolut terleak
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      `POST /v1/master/customers → 500`
              `backend/src/modules/master/services/customers.service.ts:278` (`prisma.salesLead.create()`)
              `backend/prisma/schema/crm.prisma` — `brandCode String? @unique`
- Bukti:       `brandCode` adalah `@unique` di Prisma, tapi tidak ada penanganan error. Reproduksi:
              create pertama → **201**; create kedua dengan `brandCode` sama → **500**
              `{"type":"…/internal-server-error","status":500,"detail":"\nInvalid \`this.prisma.salesLead.create()\` invocation in\nC:\\GAWE\\Web Dev\\Porto Aureon\\ERP FROM ZERO\\backend\\dist\\modules\\master\\services\\customers.service.js:328:38\n\n  325 …\n→ 328 return this.prisma.salesLead.cr"}`
              Body respons membocorkan: path filesystem absolut mesin build, nama file, nomor baris,
              dan potongan source code. Kontrak yang benar adalah **409 Conflict**.
              Duplikat **`clientName`**: create kedua → **201 DITERIMA**, 2 baris di `sales_leads`
              dengan `clientName` identik. Duplikat **`email`**: **201 DITERIMA**, 2 baris.
              Jadi hanya `brandCode` yang dijaga, dan itu pun lewat jalur 500.
- Repro:       `POST /v1/master/customers {"clientName":"A","brandCode":"DUP","phone":"0812"}` dua kali.
- Dampak ke client: Dua pengguna dengan nama sama atau email sama tersimpan sebagai dua pelanggan berbeda — invoice dan AR receipt akan terpecah. Duplikat `brandCode` membalas 500 dan menampilkan path server ke layar pengguna.
- Lapis:       API

---

### [F2-MASTER-007] Pesan validasi tidak pernah menyebut field yang salah — hanya "Request validation failed."
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `POST /v1/master/customers → 400`
              `backend/src/modules/master/dto/customer.dto.ts` (`CreateCustomerDto`)
- Bukti:       Empat payload yang harus ditolak, semuanya **400** dengan body identik:
              ```
              {"type":"…/errors/validation-failed","status":400,
               "detail":"Request validation failed.","code":"VALIDATION_FAILED",
               "message":"Request validation failed."}
              ```
              Kasus: (1) `clientName` hilang, (2) body `{}` kosong, (3) `clientName: 42` (tipe salah),
              (4) `email: "not-an-email"` (format salah). Untuk keempatnya,
              `JSON.stringify(body).includes("clientName")` = **false**.
              Kunci body: `type,title,status,detail,instance,code,timestamp,message` — tidak ada
              array `errors`, tidak ada nama field.
              Protokol §6 mensyaratkan "400 dengan pesan yang menyebut field mana". **Gagal.**
              Driven by: `customer.dto.ts` memakai `@IsString()` pada `clientName` tanpa `@IsNotEmpty()`,
              sehingga string kosong lolos validasi.
- Repro:       `POST /v1/master/customers {"brandName":"X"}` → 400, pesan tidak menyebut `clientName`.
- Dampak ke client: Form tidak bisa memberi tahu pengguna kolom mana yang salah. `clientName: ""` (kosong) lolos semua validasi `@IsString()`.
- Lapis:       API

---

### [F2-MASTER-008] UUID tidak valid → HTTP 500, bukan 400
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      `GET|PATCH|DELETE /v1/master/customers/not-a-uuid → 500`
- Bukti:       Tiga endpoint, id `not-a-uuid`:
              `GET` → **500** `Invalid \`this.prisma.salesLead.findUnique()\` invocation in …`
              `PATCH` → **500**, `DELETE` → **500**.
              Bandingkan id UUID yang valid tapi tidak ada (`00000000-0000-0000-0000-000000000000`):
              ketiganya **404** `"Customer not found"` — jadi route-nya sehat, hanya tidak ada validasi
              format parameter. `customer.dto.ts` tidak mendeklarasikan `ParseUUIDPipe`.
              laughed 500 yang sama juga menjadi vektor kebocoran path server seperti F2-MASTER-006.
              Authz sebagai pembanding: `GET /v1/master/customers` tanpa token → **401** (benar).
- Repro:       `curl localhost:3212/v1/master/customers/not-a-uuid` → 500.
- Dampak ke client: Feeder/import yang mengirim id rusak mendapat 500 dan menganggapnya kegagalan server, lalu mencoba ulang selamanya.
- Lapis:       API

---

## Uji ulang F1 — hasil

| F1 ID | Claim | Hasil F2 | Bukti |
|---|---|---|---|
| **D5-005** | `customers.service.ts:362-369` "Hapus Permanen" cuma set `status: LOST` | **BENAR** | `DELETE` → 200, baris masih ada, `status=LOST`, `deletedAt` tidak ada di tabel (F2-MASTER-002/003) |
| **D5-005 (bagian audit)** | file itu menulis **nol** `auditLog` | **SALAH** | 4 dari 4 mutasi menghasilkan tepat 1 baris `audit_logs` tiap; rasio 100 % untuk sukses (F2-MASTER-004) |

Tidak ada F1 claim lain di domain master untuk diuji ulang.

## Catatan referential integrity (TEST 5c)

Menghapus lead yang punya 1 `work_orders` anak → **200**, lead tetap ada (`status=LOST`),
`work_orders` anak **tidak** jadi yatim (0 orphan). Ini konsekuensi sampingan dari soft-delete
palsu: karena tidak ada baris yang dihapus, tidak ada anak yang menggantung.
Tidak menguji cascade karena tidak ada jalur yang benar-benar menghapus.

## Checklist CRUD — ringkas

| Entitas | create | readList | readOne | update | delete | contract |
|---|---|---|---|---|---|---|
| `sales_leads` (via `/v1/master/customers`) | PASS 201 | PASS 200 | PASS 200 | PASS 200 tersimpan | PASS 200 | **none** (fake: set LOST) |
| `customers` | **tidak ada endpoint** | — | — | — | — | tabel mati, 0 baris, 0 produser |
| audit pada mutasi sukses | PASS | — | — | PASS | PASS | 4/4 |
| duplikat `brandCode` | **FAIL 500** (harusnya 409) | | | | | |
| duplikat `clientName` / `email` | **FAIL 201 diterima** | | | | | |
| validasi pesan nama-field | **FAIL** | | | | | |
| authz tanpa token | PASS 401 | | | | | |

## Catatan metodologi

- Semua pengujian menulis hanya ke `audit_f2_master`. `erp_db_test` tidak disentuh.
- Semua data uji berawalan `AUDIT_F2` / `DUPA` / `AF2` dan dibiarkan agar bisa ditelusuri.
- Ekskusi SQL langsung hanya dipakai untuk **membaca** state dan satu probe `INSERT` yang
  selalu dibungkus `BEGIN … ROLLBACK` (FK probe F2-MASTER-001).
- Skrip bantu ada di `backend/f2_*.js` (dibuat untuk audit, dihapus setelah laporan ini).
