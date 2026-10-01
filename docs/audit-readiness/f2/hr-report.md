# Laporan Audit Kesiapan F2 — Domain HR & Payroll

- Tanggal: 2026-10-01
- Auditor: F2-HR
- Box: Port 3216, Database `audit_f2_hr`
- Base URL: `http://localhost:3216/v1`
- Cakupan Entitas: `employees`, `attendances`, `tickets`, `payrolls`, `payroll_items`, `candidates`, `employee_trainings`, `employee_loans`

---

### [F2-HR-001] Otorisasi payroll tidak menghasilkan jurnal akuntansi pada general ledger (GL Disconnect)
- Severity:    BLOCKER
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.service.ts:740-775
- Bukti:       Saat endpoint `POST /v1/hr/payroll/authorize/:id` dieksekusi dengan akun Super Admin / Director, status payroll berubah menjadi `AUTHORIZED` dan `totalDisbursement` terisi. Namun, pengecekan langsung pada tabel `journal_entries` dan `journal_entry_lines` di database `audit_f2_hr` menunjukkan 0 baris dibuat. Tidak ada pencatatan beban gaji (Beban Gaji Karyawan vs Hutang Gaji/Kas Bank).
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3216/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
PAYROLL_ID=$(curl -s -X GET http://localhost:3216/v1/hr/payrolls -H "Authorization: Bearer $TOKEN" | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d)[0].id))')
curl -s -X POST "http://localhost:3216/v1/hr/payroll/authorize/$PAYROLL_ID" -H "Authorization: Bearer $TOKEN"
# Verifikasi database:
# psql -d audit_f2_hr -c "SELECT COUNT(*) FROM journal_entries WHERE ref_type = 'PAYROLL';"
# Hasil: 0
```
- Dampak ke client: Departemen Keuangan tidak menerima realisasi beban gaji di laporan Laba/Rugi dan Neraca, menyebabkan distorsi finansial saat penggajian dirilis.
- Lapis:       INTEGRATION (HR ↔ Finance)

### [F2-HR-002] Frontend approve ticket memanggil TicketsController dan membypass auto-trigger FundRequest reimbursement (BUS-RULE-075)
- Severity:    CRITICAL
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/tickets/tickets.service.ts:47-54 vs backend/src/modules/hr/hr.service.ts:954-972
- Bukti:       Logika bisnis BUS-RULE-075 (pembuatan `FundRequest` otomatis saat tiket reimbursement disetujui) diimplementasikan pada `HrService.approveTicket` (`PATCH /v1/hr/tickets/:id/approve`). Namun, komponen UI Frontend memanggil endpoint generik `TicketsController` (`PATCH /v1/hr/tickets/:id`) yang hanya memperbarui status baris `tickets` tanpa membuat `FundRequest`. Terbukti di database: tiket reimbursement berstatus `APPROVED` memiliki 0 baris pasangan di tabel `fund_requests`.
- Repro:
```bash
TOKEN=$(curl -s -X POST http://localhost:3216/v1/auth/login -H "Content-Type: application/json" -d '{"email":"zaki@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
# Panggilan UI yang membypass trigger:
curl -s -X PATCH http://localhost:3216/v1/hr/tickets/$TICKET_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'
# Cek database:
# psql -d audit_f2_hr -c "SELECT COUNT(*) FROM fund_requests WHERE reason LIKE '%Reimbursement auto-trigger%';"
# Hasil: 0
```
- Dampak ke client: Klaim reimbursement staf yang disetujui HR tidak pernah diteruskan ke Finance untuk pencairan dana.
- Lapis:       FE-BE

### [F2-HR-003] Soft delete karyawan hanya mengubah flag isActive tanpa memfilter endpoint detail GET /:id
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.service.ts:210-218
- Bukti:       Saat karyawan dihapus via `DELETE /v1/hr/employees/:id`, sistem melakukan soft-delete dengan `isActive: false`. Namun pemanggilan `GET /v1/hr/employees/:id` tetap mengembalikan data lengkap karyawan (HTTP 200) tanpa indikator bahwa entitas sudah tidak aktif/dihapus, dan query generate payroll berpotensi mengikutsertakan karyawan non-aktif jika tanggal cut-off tidak diproteksi.
- Repro:
```bash
curl -s -X DELETE http://localhost:3216/v1/hr/employees/$EMP_ID -H "Authorization: Bearer $TOKEN"
# Respon DELETE: 200 {"message": "Employee deactivated"}
curl -s -X GET http://localhost:3216/v1/hr/employees/$EMP_ID -H "Authorization: Bearer $TOKEN"
# Respon GET: 200 OK dengan payload lengkap karyawan
```
- Dampak ke client: Karyawan yang telah keluar/dinonaktifkan tetap dapat diakses profilnya dan berisiko terhitung dalam kalkulasi payroll.
- Lapis:       DB-API

### [F2-HR-004] Duplicate NIK karyawan memicu unhandled 500 Prisma error bukan HTTP 409/400
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.service.ts:160-185
- Bukti:       Prisma schema mendefinisikan `@unique` pada kolom `nik` tabel `employees`. Pemanggilan `POST /v1/hr/employees` dengan NIK yang sudah ada di database tidak ditangkap oleh blok penanganan konflik, melainkan melempar `PrismaClientKnownRequestError` P2002 yang berujung pada HTTP 500 Internal Server Error ke pengguna.
- Repro:
```bash
curl -s -X POST http://localhost:3216/v1/hr/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplikat","nik":"EMP-001","departmentId":"HR","employmentStatus":"CONTRACT","baseSalary":"5000000"}'
# Respon: HTTP 500 {"statusCode": 500, "message": "Internal server error"}
```
- Dampak ke client: Antarmuka HR menampilkan toast crash generik tanpa memberitahukan bahwa NIK sudah terpakai.
- Lapis:       API

### [F2-HR-005] Endpoint clock-out kehadiran tidak memvalidasi koordinat geofence pabrik
- Severity:    MAJOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.service.ts:310-335
- Bukti:       Metode `clockIn` memvalidasi jarak koordinat latitude/longitude terhadap koordinat pabrik (toleransi radius 100 meter). Sebaliknya, metode `clockOut` (`POST /v1/hr/attendance/clock-out`) hanya menerima timestamp dan catatan tanpa memeriksa koordinat GPS pengguna.
- Repro:
```bash
# Clock out dari koordinat fiktif di luar batas pabrik:
curl -s -X POST http://localhost:3216/v1/hr/attendance/clock-out \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"'$EMP_ID'","latitude":-7.123456,"longitude":112.123456}'
# Respon: HTTP 200 OK (berhasil tanpa penolakan radius)
```
- Dampak ke client: Karyawan dapat melakukan absensi pulang (clock-out) dari lokasi mana pun tanpa verifikasi kehadiran fisik.
- Lapis:       API

### [F2-HR-006] Klaim D3-011 (Fail-Open Authorization) terbantahkan pada modul HR
- Severity:    MINOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.controller.ts:27-30
- Bukti:       Klaim audit F1 D3-011 menyatakan bahwa endpoint API menerapkan fail-open authorization. Pengujian empiris terhadap 10 endpoint HR menggunakan token role non-HR (misal: `STAFF_PURCHASING`, `CLIENT`) membuktikan bahwa `@UseGuards(JwtAuthGuard, RolesGuard)` di level class controller bekerja aktif dan mengembalikan HTTP 403 Forbidden secara konsisten.
- Repro:
```bash
USER_TOKEN=$(curl -s -X POST http://localhost:3216/v1/auth/login -H "Content-Type: application/json" -d '{"email":"staff@dreamlab.com","password":"password123"}' | node -e 'process.stdin.on("data", d => console.log(JSON.parse(d).accessToken))')
curl -s -o /dev/null -w "%{http_code}" -X GET http://localhost:3216/v1/hr/employees -H "Authorization: Bearer $USER_TOKEN"
# Hasil: 403
```
- Dampak ke client: Modul data personal dan penggajian terlindungi dengan aman dari akses staf non-otoritas.
- Lapis:       AUTH

### [F2-HR-007] Hard delete record absensi menghilangkan rekam jejak kepatuhan kerja
- Severity:    MINOR
- Confidence:  TERBUKTI
- Lokasi:      backend/src/modules/hr/hr.controller.ts:104-108
- Bukti:       Endpoint `DELETE /v1/hr/attendance/:id` melakukan hard-delete langsung pada baris tabel `attendances` tanpa pencatatan audit log ataupun soft-delete flag.
- Repro:
```bash
curl -s -X DELETE http://localhost:3216/v1/hr/attendance/$ATT_ID -H "Authorization: Bearer $TOKEN"
# Row attendance terhapus permanen dari PostgreSQL
```
- Dampak ke client: Data kehadiran rawan manipulasi jika hak akses admin disalahgunakan untuk menghapus ketidakhadiran.
- Lapis:       DB
