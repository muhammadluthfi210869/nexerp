# Laporan Audit Kesiapan F2 — Domain CRM & Bussdev

- Tanggal: 2026-10-01
- Auditor: F2-CRM
- Box: Port 3215, Database `audit_f2_crm`
- Base URL: `http://localhost:3215/v1`
- Cakupan Entitas: `sales_leads`, `sample_requests`, `lead_activities`, `lost_deals`, `lead_captures`, `crm_leads`, `guestbook_events`, `guest_logs`

---

### [F2-CRM-001] Tenant guard fail-close mengunci semua operasi lead karena organizationId user bernilai null
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/bussdev/services/lead-query.service.ts:32-40
- Bukti:       `assertTrustedOrganization` menolak `organizationId` non-UUID dengan HTTP 400 `TENANT_UNRESOLVED`. Pada database `audit_f2_crm`, 0 dari 8 user memiliki nilai `organizationId` (semua NULL) dan tabel `tenant_scopes` kosong (0 baris). Setiap pemanggilan `POST /v1/bussdev/lead` dan `GET /v1/bussdev/leads` oleh akun `SUPER_ADMIN` (`zaki@dreamlab.com`) gagal dengan HTTP 400 `Tenant wajib diisi dari konteks server.`.
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3215/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -X GET http://localhost:3215/v1/bussdev/leads -H "Authorization: Bearer $TOKEN"
```
- Dampak ke client: Semua staf komersial dan admin tidak dapat membaca maupun membuat data lead baru melalui antarmuka web.
- Lapis:       AUTH

### [F2-CRM-002] Public webhook kommo memodifikasi baris database lead_captures tanpa autentikasi atau verifikasi signature
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/lead-capture/lead-capture.controller.ts:187-210
- Bukti:       Endpoint `POST /v1/lead-capture/kommo-webhook` tidak memiliki `JwtAuthGuard`, tidak memiliki verifikasi HMAC token/secret, dan mengeksekusi `updateLeadFromKommo` langsung ke database. Pengiriman payload kontak dengan nomor telepon yang cocok berhasil menimpa `waProfileName` dan `fullName` pada baris `lead_captures` dengan status 200 `{ "received": 1, "updated": 1 }`.
- Repro:
```bash
curl -s -X POST http://localhost:3215/v1/lead-capture/kommo-webhook \
  -H "Content-Type: application/json" \
  -d '{"contacts":{"update":[{"name":"INJECTED_NAME","phone":"081299991234"}]}}'
```
- Dampak ke client: Penyerang anonim dapat memalsukan nama kontak dan nomor profil lead di database tanpa token.
- Lapis:       API

### [F2-CRM-003] Selisih nama field customerName vs customerId pada sample sales memicu crash Prisma HTTP 500
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      frontend/src/app/(dashboard)/penjualan/sample-sales/_hooks/useSampleSalesOperations.ts:265
- Bukti:       Frontend mengirim `{ customerName: formData.customer }` ke `POST /v1/bussdev/samples`. Backend controller `bussdev.controller.ts:367` membaca `dto.customerId` lalu memanggil `prisma.salesLead.findUnique({ where: { id: dto.customerId } })`. Karena `id` bernilai `undefined`, Prisma melempar `InvalidInvocationError` yang menghasilkan HTTP 500 Internal Server Error.
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3215/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -X POST http://localhost:3215/v1/bussdev/samples \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"PT Kosmetik Prima","productName":"Serum Glow"}'
```
- Dampak ke client: Tombol pengajuan sample sales pada antarmuka pengguna gagal dengan pesan error server setiap kali ditekan.
- Lapis:       FE-BE

### [F2-CRM-004] Endpoint sample-request tanpa class-validator crash HTTP 500 saat menerima payload kosong
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/bussdev/bussdev.controller.ts:383-398
- Bukti:       `createSampleRequest` menggunakan tipe inline `dto: { leadId: string; ... }` tanpa DTO tervalidasi. Pengiriman payload kosong `{}` tidak ditolak dengan HTTP 400 melainkan crash dengan HTTP 500 karena Prisma `salesLead.findUnique({ where: { id: undefined } })`.
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3215/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -X POST http://localhost:3215/v1/bussdev/sample-request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
- Dampak ke client: Kesalahan transmisi data menghasilkan kegagalan fatal server 500 tanpa penjelasan validasi ke pengguna.
- Lapis:       API

### [F2-CRM-005] Penghapusan lead dengan histori aktivitas memicu unhandled foreign key violation HTTP 500
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/bussdev/services/lead-stage.service.ts:736
- Bukti:       Relasi `LeadActivity.lead` di `backend/prisma/schema/bussdev.prisma` tidak memiliki konfigurasi `onDelete: Cascade`. Eksekusi `DELETE /v1/bussdev/lead/:id` pada lead yang memiliki baris di `lead_activities` ditolak PostgreSQL dengan error constraint `lead_activities_leadId_fkey`. Service melempar Prisma KnownRequestError P2003 tanpa ditangkap sehingga filter menghasilkan HTTP 500.
- Repro:
```bash
# Buat lead, tambahkan activity via POST /v1/bussdev/lead/:id/activity, lalu panggil:
curl -s -X DELETE http://localhost:3215/v1/bussdev/lead/<lead-id-with-activity> \
  -H "Authorization: Bearer $TOKEN"
```
- Dampak ke client: Operasi hapus data pada lead yang telah diproses komunikasi gagal total dengan error 500.
- Lapis:       DB

### [F2-CRM-006] GlobalExceptionFilter membuang rincian fieldErrors pada response validasi RFC 7807
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/common/filters/global-exception.filter.ts:50-65
- Bukti:       `validationExceptionFactory` meletakkan rincian per-field di properti `fieldErrors`. `GlobalExceptionFilter` hanya mengekstrak `Array.isArray(r.message)` atau `r.details`, sehingga properti `fieldErrors` diabaikan. Response HTTP 400 hanya mengembalikan string generik `"detail": "Request validation failed."` tanpa menyertakan daftar field yang salah.
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3215/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -X POST http://localhost:3215/v1/bussdev/lead \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```
- Dampak ke client: Frontend form tidak dapat menampilkan pesan validasi spesifik di bawah field input yang bermasalah.
- Lapis:       API

### [F2-CRM-007] Rute navigasi pipeline penjualan mengarahkan pengguna ke halaman 404
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      frontend/src/app/(dashboard)/penjualan/pipeline/page.tsx:8
- Bukti:       Halaman `penjualan/pipeline` mengeksekusi `router.replace("/bussdev/client-manager")`. Di routing tree Next.js App Router, direktori `frontend/src/app/(dashboard)/bussdev/client-manager` tidak ada karena telah dipindahkan ke `/penjualan/client-manager`. User yang mengklik menu Pipeline terdampar di halaman HTTP 404.
- Repro:
Akses URL `http://localhost:3000/penjualan/pipeline` di browser; halaman langsung redirect ke `/bussdev/client-manager` yang menghasilkan Next.js 404.
- Dampak ke client: Menu pipeline penjualan pada sidebar navigasi tidak dapat digunakan oleh pengguna.
- Lapis:       FE-BE

### [F2-CRM-008] Perbedaan regex validasi UUID tenant antara modul Bussdev dan R&D
- Severity:    MINOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/rnd/rnd.service.ts:65-66
- Bukti:       `bussdev` menggunakan regex UUID umum (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`), sedangkan `rnd.service.ts` menggunakan regex ketat RFC 4122 v4 (`/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`). UUID non-v4 (seperti `a0000000-0000-0000-0000-000000000001`) lolos di `bussdev` (HTTP 200) namun ditolak dengan HTTP 400 `TENANT_UNRESOLVED` di seluruh endpoint R&D.
- Repro:
Set `users.organizationId` menjadi `a0000000-0000-0000-0000-000000000001`. `GET /v1/bussdev/leads` mengembalikan 200 OK, sedangkan `GET /v1/rnd/samples` mengembalikan 400 `TENANT_UNRESOLVED`.
- Dampak ke client: Integrasi multi-tenant yang menggunakan format ID organisasi non-v4 mengalami kegagalan fungsi di domain R&D.
- Lapis:       API

### [F2-CRM-009] Evaluasi ulang klaim audit F1 D3-011 dan D3-012 pada domain CRM
- Severity:    MINOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/auth/roles.guard.ts:37-39
- Bukti:       Klaim D3-011 menyatakan `roles.guard.ts` fail-open saat `@Roles` kosong. Secara implementasi guard hal ini benar, namun audit pada 48 endpoint terlindungi di controller CRM (`bussdev`, `crm/leads`, `crm/lost-deals`, `crm/guestbook`) membuktikan seluruh 48 endpoint memiliki deklarasi `@Roles(...)` eksplisit. Pengujian dengan akun role `QC_LAB` (`ribut@dreamlab.com`) menghasilkan HTTP 403 Forbidden di seluruh 8 rute komersial. Klaim F1 bahwa role rendah dapat membobol data komersial DIBANTAH untuk domain CRM. Klaim D3-012 bahwa endpoint terbuka tanpa auth juga DIBANTAH karena 100% rute terlindungi mengembalikan HTTP 401 Unauthorized tanpa token.
- Repro:
```bash
QC_TOKEN=$(curl -s -X POST http://localhost:3215/v1/auth/login -H "Content-Type: application/json" -d '{"email":"ribut@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -o /dev/null -w "%{http_code}\n" -X GET http://localhost:3215/v1/bussdev/leads -H "Authorization: Bearer $QC_TOKEN"
# Output: 403
```
- Dampak ke client: Otorisasi berbasis peran pada modul komersial berjalan efektif menolak akses staf non-komersial.
- Lapis:       AUTH
