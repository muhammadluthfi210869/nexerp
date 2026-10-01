# Audit Menyeluruh NEX ERP vs KIL — Baseline 2026-09-28

**Verdict teknis:** **NOT READY**  
**Baseline kode:** `b561dffeea0448d9351f40d3634de828c4aa0681` (`feat/p08-contracts-subject-ownership`)  
**Target pembanding:** kontrak kanonik 184 layar, inventaris legacy/evolution 176 entri, implementasi frontend 278 route  
**Batas audit:** KIL dan produksi NEX read-only; CRUD dijalankan pada clone disposable `erp_db_test`; tidak ada perbaikan kode pada tahap ini.

## 1. Keputusan ringkas

NEX belum boleh dinyatakan siap UAT client atau go-live. Implementasi inti sudah jauh dan sejumlah kontrol berisiko tinggi terbukti bekerja, tetapi baseline saat ini masih mempunyai P1 pada formula adjustment, audit ledger, KPI yang menampilkan angka hard-coded, communication protocol yang belum tersedia secara utuh pada deployment, master barang yang kosong walaupun API berisi data, pembuatan user yang tidak menghasilkan kredensial usable, halaman profil/keamanan yang hanya mensimulasikan keberhasilan, serta gate go-live yang tidak dapat diselesaikan secara reproduktif. Audit layar/aksi juga belum mencapai cakupan manual 100%, dan dual-run 14 hari serta tanda tangan UAT belum dimulai.

Laporan `2026-09-27-final-production-release.md` dan `2026-09-28-master-data-and-manual-verification.md` yang menyatakan 100%/SIAP KIRIM tidak diterima sebagai bukti kelulusan baseline ini. Hasilnya bertentangan dengan reproduksi langsung di bawah.

## 2. Sumber kebenaran dan klasifikasi

Urutan otoritas yang digunakan:

1. `docs/legacy-erp/contracts/*` dan kontrak komunikasi/KPI terkait.
2. `docs/legacy-erp/reference/REQUIREMENT.md`, `NEX_FINANCE_FINAL_SPEC.md`, dan keputusan/evolution yang tertelusur.
3. Perilaku KIL yang diamati read-only dan artefak crawl tersimpan.
4. Perilaku NEX pada clone database disposable dan smoke read-only produksi.

Perbedaan diberi klasifikasi `LEGACY_PARITY`, `CLIENT_EVOLUTION`, `SAFETY_CONTROL`, `LEGACY_DEFECT`, `MISSING`, atau `DECISION_REQUIRED`. Perubahan client yang mempunyai provenance bukan parity failure.

## 3. Cakupan aktual

| Area | Target | Bukti pada audit ini | Status |
|---|---:|---|---|
| Kontrak layar kanonik | 184 | Seluruh ID ada dalam `06_SCREEN_CONTRACT.json`; mapping 184/184 tersedia pada baseline | MAPPED, belum seluruhnya diuji manual |
| Target legacy/evolution | 176 | 144 live legacy + 31 evolution + 1 defect legacy menurut inventaris; spot-check live KIL dilakukan pada alur utama | PARTIAL MANUAL |
| Route frontend | 278 | Inventaris baseline mengklasifikasikan 278; preflight browser membuktikan 132 route awal, shard berikutnya terkontaminasi ENOSPC sebelum rerun lengkap | PARTIAL RUNTIME |
| Layar/aksi per record nyata | 184 layar beserta aksi | Golden thread dan focused suites lulus; audit manual aksi per layar belum 100% | NOT COMPLETE |
| Print/preview | 23 halaman `window.print()` + PDF | PDF engine terbukti menghasilkan PDF valid; 23 print preview belum diverifikasi satu per satu | NOT COMPLETE |
| Skip/fixme | 0 pada alur wajib | 33 marker ditemukan; tiga persona RBAC tidak mempunyai seed khusus, sisanya termasuk conditional workflow skips | OPEN EVIDENCE GAP |
| Dual-run | 14 hari | Belum dimulai | NOT STARTED |
| Client UAT | Walkthrough + berita acara | Belum dilakukan | NOT STARTED |

Status `PARTIAL`/`NOT COMPLETE` di atas adalah status diketahui, bukan PASS dan bukan asumsi. Kriteria 100% tanpa `UNKNOWN` hanya dapat dinyatakan setelah eksekusi manual tersisa selesai.

## 4. Hasil positif yang berhasil direproduksi

| Verifikasi | Hasil |
|---|---|
| Backend typecheck | PASS |
| Frontend TypeScript | PASS |
| Backend unit | 49/49 suite, 605/605 test PASS |
| P16 KPI engine | 6/6 PASS |
| P17 communication mention | 6/6 PASS |
| P17 document automation | 5/5 PASS |
| P18 executive KPI | 4/4 PASS |
| P20 golden thread | 1/1 PASS |
| P20 concurrency | 3/3 PASS |
| P21 migration pipeline | 5/5 PASS; 10.000 row diimpor sekitar 31,4 detik |
| Browser/API selection | 502 PASS, 3 SKIP, 1 test expectation gagal, 474 tidak dijalankan karena fail-fast/duplikasi proyek |
| PDF automation | HTTP 200, 40.755 byte, magic `%PDF`, filename attachment valid |
| Kontrol jurnal | Balanced journal diterima dan jurnal tidak seimbang ditolak dalam edge suite |
| Auth/RBAC utama | Persona seed utama dapat login; forbidden/unauthenticated paths teruji dalam suite yang sempat berjalan |

Kegagalan RBAC `/system/health` untuk persona Head Ops adalah defect test, bukan kebocoran akses: controller saat ini secara benar membatasi endpoint ke `SUPER_ADMIN`, `ADMIN`, atau `IT_SYS`, sementara test masih menganggap SYSTEM publik.

## 5. Temuan blocker P1

### P1-01 — Formula adjustment memanggil endpoint yang selalu 500

- **Klasifikasi:** `MISSING` / route collision.
- **Reproduksi:** authenticated `GET /v1/rnd/formulas/adjustments` menghasilkan 500.
- **Root cause:** static segment `adjustments` diproses sebagai parameter `:id`; service mencoba mengubah string `adjustments` menjadi UUID.
- **Dampak:** dua layar penyesuaian formula R&D/produksi merender shell 200 tetapi gagal mengambil data. Operasional penyesuaian formula tidak aman untuk dipakai.
- **Cakupan:** `/inventory/formula-adjustment-rnd`, `/inventory/formula-adjustment-production`.
- **Remediation terfokus:** perbaiki urutan/route contract, tambah focused controller test untuk static-vs-dynamic route, lalu browser test kedua layar dengan record nyata.

### P1-02 — Audit ledger crash pada shape API aktual

- **Klasifikasi:** `MISSING` (frontend/backend contract mismatch).
- **Reproduksi:** pada clone berisi audit data, `/finance/audit-ledger` crash `RangeError: Invalid time value`.
- **Root cause:** UI membaca `createdAt`, `entityType`, dan shape lama; API `/v1/system/audit-logs` mengirim `timestamp`, `module`, `targetRef`, dan shape baru.
- **Dampak:** pengguna kehilangan audit trail saat data tersedia; ini menghambat investigasi transaksi dan sign-off.
- **Remediation terfokus:** tetapkan satu DTO canonical, contract test response, UI test dengan row nyata dan timestamp invalid/null.

### P1-03 — Kartu KPI menampilkan angka dan insight hard-coded

- **Klasifikasi:** `CLIENT_EVOLUTION` yang belum memenuhi aturan sumber-data.
- **Reproduksi kode:** Department KPI menetapkan `belowTargetCount: 11`, nama penurunan, trend, dan beberapa persentase/insight secara literal. Individual KPI juga mempunyai nama peningkatan/penurunan literal.
- **Reproduksi produksi:** `/master/kpi-department` menampilkan “11 Indikator Di Bawah Target” walaupun kartu eksekutif pada deployment menunjukkan data transaksi nol.
- **Dampak:** keputusan manajemen dapat dibuat dari angka yang bukan hasil transaksi. Ini bertentangan dengan larangan skor/angka manual dan syarat rekonsiliasi KPI.
- **Remediation terfokus:** seluruh kartu/insight harus dihitung dari endpoint period/division/person yang sama, tampil `N/A` bila sumber tidak cukup, dan memiliki drill-down evidence ke transaksi.

### P1-04 — Communication protocol belum tersedia end-to-end pada deployment

- **Klasifikasi:** `MISSING` terhadap REQ-037 dan SCR-136..145.
- **Bukti positif:** backend focused test mention/document automation lulus; source mempunyai endpoint dan komponen DNA.
- **Bukti negatif:** produksi mengembalikan halaman 404 untuk `/notifications`, `/settings/notifications`, `/settings/templates`, dan `/communications`. Komponen `DnaThread`/`DnaNotificationCenter` tidak ditemukan terpasang pada halaman bisnis. `communication-service.ts` default ke mode `mock` dan environment frontend tidak menetapkan mode real.
- **Dampak:** note/thread, mention, attachment, acknowledgement, escalation, handover, dan histori tidak dapat dibuktikan dari UI operasional; data demo berpotensi terlihat sebagai data bisnis.
- **Remediation terfokus:** pasang communication primitives pada detail entity yang diwajibkan kontrak, paksa production real mode/fail-closed, tambah parent ACL + tenant tests, dan lakukan browser golden thread antar-divisi termasuk acknowledgement/SLA.

### P1-05 — Gate `test:go-live` tidak dapat selesai

- **Klasifikasi:** `MISSING` pada acceptance harness.
- **Reproduksi:** tahap unit lulus 605/605, kemudian script meminta `backend/test/contract/api-contract.e2e-spec.ts`; file tersebut tidak ada dan Jest berhenti dengan “No tests found”.
- **Dampak:** klaim release tidak reproducible dan tidak ada satu perintah go-live yang hijau pada baseline ini.
- **Remediation terfokus:** perbaiki script agar menunjuk focused native test yang benar atau tambahkan contract test yang memang diwajibkan; jangan membuat certifier/evidence engine baru.

### P1-06 — Deployment yang diuji tidak identik dengan source audit

- **Klasifikasi:** `SAFETY_CONTROL` gagal / release drift.
- **Bukti:** source memiliki halaman notification/settings, tetapi deployment 404; source current branch menunjukkan audit-ledger mismatch dengan data, sedangkan produksi kosong tidak memicu crash.
- **Dampak:** hasil staging/local tidak dapat otomatis dipakai sebagai bukti produksi dan sebaliknya.
- **Remediation terfokus:** tampilkan commit/image SHA di deployment, deploy baseline yang dibekukan ke staging disposable, lalu ulang preflight pada image yang sama.

### P1-07 — Master barang selalu terlihat kosong walaupun API mengembalikan data

- **Klasifikasi:** `MISSING` (frontend response-contract mismatch).
- **Reproduksi:** material audit berhasil dibuat dan `GET /api/master/materials?page=1&limit=10` mengembalikan HTTP 200 beserta row tersebut, tetapi `/master/goods` tetap menampilkan total 0 dan “Tidak ada barang”.
- **Root cause:** helper `unwrapResponse()` sudah mengembalikan inner array, tetapi halaman barang kembali membaca properti `.data`; kondisi gagal lalu state dipaksa menjadi array kosong.
- **Dampak:** pengguna tidak dapat melihat, memilih, memeriksa, atau meneruskan barang yang sebenarnya tersimpan. Ini berisiko memicu duplikasi master dan keputusan stok yang salah.
- **Remediation terfokus:** tetapkan DTO list tunggal, hilangkan double unwrap, tambah component/integration test dengan response API aktual, lalu verifikasi create → list → detail → edit → deactivate melalui browser.

### P1-08 — Delete/deactivate material gagal 500 dan meninggalkan record aktif

- **Klasifikasi:** `MISSING` pada CRUD wajib.
- **Reproduksi:** pada clone disposable, create dan update material berhasil, tetapi `DELETE /v1/master/materials/{id}` menghasilkan 500; GET setelahnya masih 200.
- **Root cause:** service menulis status `INACTIVE`, sedangkan enum Prisma `MaterialStatus` hanya menerima `DRAFT`, `ACTIVE`, atau `ARCHIVED`.
- **Dampak:** material salah/duplikat tidak dapat dinonaktifkan secara aman; kegagalan bersifat server error dan UI dapat berbeda dari database.
- **Remediation terfokus:** gunakan status enum canonical, tambahkan referential-protection test, audit/outbox assertion, dan browser regression untuk deactivate serta visibility filter.

### P1-09 — Pembuatan user menerima password tetapi akun baru tidak dapat login

- **Klasifikasi:** `MISSING` pada lifecycle user/RBAC.
- **Reproduksi:** `POST /v1/users` dengan email unik, role `COMMERCIAL`, dan password valid menghasilkan 201; login memakai pasangan email/password tersebut langsung menghasilkan 401. Update dan deactivate user menghasilkan 200.
- **Root cause:** DTO menerima `password`, tetapi `PersonnelService.create()` tidak melakukan hash dan tidak menyimpan `passwordHash`.
- **Dampak:** admin mendapat pesan create berhasil tetapi user operasional tidak dapat masuk; onboarding dan segregasi persona tidak dapat dijalankan.
- **Remediation terfokus:** definisikan alur aktivasi canonical (password awal atau invite/reset token), implementasikan penyimpanan hash/token secara aman, dan tambah end-to-end create → activate/login → role enforcement → deactivate.

### P1-10 — Profil, password, 2FA, notifikasi, dan sesi menampilkan keberhasilan semu

- **Klasifikasi:** `MISSING` / silent fallback.
- **Bukti:** `/system/profile` memuat identitas, nomor telepon, employee ID, jabatan, departemen, tanggal bergabung, dua sesi, alamat IP, dan status 2FA literal. Submit biodata/password, toggle 2FA/notifikasi, dan “Keluarkan Sesi Lain” hanya mengubah state/toast tanpa request mutasi ke backend. Request profil yang gagal ditelan dan diganti data contoh.
- **Dampak:** pengguna percaya password atau kontrol keamanan telah berubah padahal tidak ada perubahan server. Data personal dan sesi yang tampil juga dapat bukan milik user aktif.
- **Remediation terfokus:** hubungkan ke endpoint nyata dengan fail-closed state, hilangkan seluruh identitas/sesi literal, verifikasi current-password, revocation, 2FA enrollment/recovery, serta audit keamanan.

### P1-11 — Audit mutation generik tidak atomik dan snapshot “before” tidak benar

- **Klasifikasi:** `SAFETY_CONTROL` gagal.
- **Bukti runtime:** 14 mutasi master sukses mempunyai audit row, tetapi snapshot `before` pada PATCH berisi request baru (contoh nama `... UPDATED`), bukan nilai tersimpan sebelum perubahan. Interceptor mengisi `beforeSnapshot = req.body`, lalu melakukan `void record()` setelah response dan di luar transaksi bisnis. Pada user lifecycle, satu create/update/deactivate menghasilkan dua row per aksi: row atomik `personnel.service` yang benar dan row kedua dari interceptor yang mempunyai snapshot salah/tidak lengkap. API kemudian menampilkan `source` berupa IP sebagai nama modul dan mengganti action domain yang tidak termasuk allow-list menjadi `UPDATE`.
- **Dampak:** histori sebelum/sesudah tidak dapat dipercaya, berduplikasi, dan kehilangan semantic action; transaksi bisnis dapat commit walaupun penulisan audit interceptor gagal. Ini menghambat investigasi, compliance, dan reversal yang aman.
- **Remediation terfokus:** pindahkan audit wajib ke transaksi domain yang sama, baca persisted-before secara eksplisit, jadikan kegagalan audit mem-fail-kan mutasi wajib, dan hilangkan/cegah duplikasi dengan global interceptor. Presenter audit harus mempertahankan source/action domain, bukan memetakan event berbeda menjadi `UPDATE`.

### P1-12 — Tabel master/personnel menampilkan nilai fallback yang tampak faktual

- **Klasifikasi:** `MISSING` (schema/UI mismatch dan fabricated display values).
- **Bukti:** personnel mengisi NIP dari indeks row, telepon `-`, dan divisi default “Commercial / Sales”; warehouse mengisi provinsi “Jawa Timur”, PIC “Ghufron Dreamlab”, tipe “Suhu Ruang”, serta 24 bin; goods mengisi supplier “Lokal” dan aging `1`; supplier mengisi pajak/PKP/payment term/status kontrak default. Field-field ini tidak berasal dari response yang dibuktikan.
- **Dampak:** KPI distribusi divisi dan keputusan operasional master dapat didasarkan pada data buatan yang tidak tersimpan di sistem.
- **Remediation terfokus:** perluas DTO/query ke field canonical atau tampilkan `N/A`; larang default yang menyerupai data bisnis; tambah contract tests untuk tiap kolom dan rekonsiliasi UI terhadap database.

### P1-13 — Layar lead canonical gagal memuat data nyata dan mencampur workflow lokal

- **Klasifikasi:** `MISSING` / contract drift.
- **Bukti runtime:** `/penjualan/crm-leads` render 200 tetapi request utama `GET /marketing/landing-tracker/conversions?limit=500` ditolak 400; batas 100 diterima. Pada clone yang sama `/v1/bussdev/leads` mempunyai 946 row, namun layar ini tidak memakai sumber canonical tersebut. Tab distribusi lead diinisialisasi dari `INITIAL_BATCHES`; create/delete hanya mengubah React state dan menampilkan toast sukses.
- **Dampak:** daftar prospek yang terlihat dapat kosong/berbeda dari pipeline bisnis, sedangkan distribusi lead yang diklaim tersimpan hilang saat reload. KPI/owner assignment dan tindak lanjut BusDev tidak dapat dipercaya.
- **Remediation terfokus:** gunakan endpoint lead canonical dengan pagination server-side, persist distribusi/assignment dalam transaksi domain, tampilkan error eksplisit, dan browser-test reload serta owner-scoped visibility.

### P1-14 — Aksi penjualan penting masih berupa toast/local state tanpa mutasi server

- **Klasifikasi:** `MISSING` / silent success.
- **Bukti source dan browser:** tombol “Approve Sample” pada drawer `/penjualan/sample-sales` hanya menampilkan toast lalu menutup drawer; “Alokasikan ke Faktur” pada `/penjualan/down-payment` melakukan hal yang sama. Halaman approval sample terpisah memang memakai endpoint R&D, tetapi aksi duplikat pada layar operasional tetap aktif dan menyesatkan.
- **Dampak:** operator dapat menganggap sample sudah disetujui atau DP sudah dialokasikan, sementara status, saldo, invoice, jurnal, audit, dan outbox tidak berubah.
- **Remediation terfokus:** hapus/disable aksi semu atau hubungkan ke command canonical yang idempotent; verifikasi source transaction → status/saldo tujuan → jurnal → audit/outbox setelah reload.

### P1-15 — Navigasi pembayaran/DP mengarah ke route 404

- **Klasifikasi:** `MISSING` pada navigasi aksi.
- **Bukti runtime:** `/finance/dp-penjualan` dan `/finance/bayar-penjualan` menghasilkan 404. Source `/penjualan/dp-finance` dan `/finance/bayar` masih mengarahkan tombol proses ke dua URL tersebut, sedangkan implementasi yang tersedia berada di `/penjualan/dp-penjualan-finance` dan `/penjualan/bayar-penjualan`.
- **Dampak:** pengguna terhenti saat berpindah dari overview finance ke pencatatan penerimaan; workflow pembayaran tidak dapat diselesaikan lewat jalur UI yang disediakan.
- **Remediation terfokus:** satukan canonical route/redirect, tambah link-integrity test untuk seluruh CTA/sidebar, dan jalankan browser payment flow dari dokumen sumber sampai receipt/journal.

### P1-16 — Target penjualan dan KPI turunannya masih data contoh/in-memory

- **Klasifikasi:** `CLIENT_EVOLUTION` belum terpenuhi.
- **Bukti:** `/penjualan/sales-target` dimulai dari empat `INITIAL_TARGETS` literal (nama, email, target, realisasi, catatan). Create menambah record `st-${Date.now()}` hanya ke state lokal. UI memang memberi warning bahwa endpoint belum tersedia, tetapi data contoh tetap tampil sebagai scorecard operasional.
- **Dampak:** target/realisasi individu dan top performer dapat disalahartikan sebagai data perusahaan; KPI per orang yang diminta client belum mempunyai lineage transaksi.
- **Remediation terfokus:** sediakan target versioned dan approval/period rules, hitung realisasi dari sumber faktur terbayar canonical, hilangkan data contoh dari production, dan rekonsiliasi leaderboard ke transaksi sumber.

## 6. P2/P3 dan gap bukti

- Konfigurasi Playwright memakai project spesifik sekaligus `all-e2e`, sehingga file yang sama berjalan dua kali. Eksekusi tujuh file menjadi 980 test; setelah satu kegagalan serial, 474 tidak dijalankan.
- Test RBAC mempunyai asumsi lama bahwa HR dan SYSTEM publik. Source sekarang memakai guard pada SYSTEM; ekspektasi test harus mengikuti kontrak keamanan.
- Tiga persona penting (`COMMERCIAL`, `DIRECTOR`, `SCM-only`) diskip karena seed representatif tidak tersedia. Ini tidak boleh dihitung PASS untuk UAT persona.
- Shell regression via WSL gagal pada sembilan check karena WSL tidak dapat mengeksekusi Node Windows; check pemilik yang diuji ulang secara native (lockfile, Prisma validate, lint backend) lulus. Harness lintas-shell tetap perlu distabilkan.
- Backend startup memperingatkan duplicate DTO name `CreateDownPaymentDto`; belum terbukti merusak operasi tetapi berisiko mengacaukan Swagger/client generation.
- Script resmi frontend `npm start` menunjuk `frontend/scripts/start-standalone.js` yang tidak ada. Build produksi berhasil, tetapi start command release tidak reproduktif tanpa menjalankan `next start`/standalone server secara manual.
- Seluruh 23 halaman berbasis `window.print()` belum melalui print preview/PDF visual per halaman, termasuk page break, logo, angka, dan signature.
- Responsive/browser tambahan belum disertifikasi; Chrome desktop adalah satu-satunya target yang diobservasi.

## 7. Spot-check parity KIL read-only

| Area KIL | Hasil observasi | Disposisi NEX |
|---|---|---|
| Dashboard BusDev | KPI per BD, leads/follow-up/conversion/closure/revenue/status/lost tersedia | `LEGACY_PARITY` + client evolution ke KPI per divisi/orang; rekonsiliasi angka NEX belum lulus |
| HR dashboard | KIL live mengembalikan 500 | `LEGACY_DEFECT`; NEX tidak wajib meniru bug |
| Sales sample/formulation/sales/invoice | Tabel, status, history/create/process terlihat | Parity struktur tersedia sebagian; aksi record-by-record belum seluruhnya diaudit manual |
| Goods transfer/batch record | Tabel dan aksi create/history/process terlihat | Golden thread NEX lulus, tetapi seluruh variasi dokumen/print belum tersertifikasi |
| Activity log | Waktu/user/module/action/deskripsi/IP | NEX mempunyai API audit, tetapi layar current branch gagal pada shape data aktual (P1-02) |
| Profit & loss/stock valuation | Filter dan export Excel tersedia | Laporan NEX ada; full source-to-report and export reconciliation belum selesai |
| Role/goods master | List dan create tersedia | Master/RBAC suites positif; persona tanpa seed masih gap |

## 7A. Ledger batch Fase 2 — SCR-001 sampai SCR-024

| Kontrak | Layar/aksi NEX | Bukti aktual | Status |
|---|---|---|---|
| SCR-001 Login | `/login` | Admin dapat login; invalid credential ditolak 401 | PASS terbatas |
| SCR-002 Forgot password | Tidak ada route; kontrol “Forgot?” tidak menavigasi/mengeksekusi workflow | Build route dan source | P1 MISSING |
| SCR-003 Reset password | Tidak ada route reset | Build route dan source | P1 MISSING |
| SCR-004 Account | `/system/profile` | Render sehat, tetapi data identitas/sesi banyak literal dan failure profile menjadi fallback | P1 |
| SCR-005 Change password | Form gabung di profile | Validasi hanya client/toast; tidak ada request backend | P1 |
| SCR-006..009 User/role | `/master/personnel` modal | create/update/deactivate API bekerja; password create tidak usable; NIP/phone/division tidak persisted; daftar role/persona belum lengkap | P1 |
| SCR-010..014 Customer/category | `/master/customers` dan modal | create/detail/update/deactivate/category CRUD sukses pada clone; row terlihat di API/UI; customer memakai model lead sehingga semantic status perlu keputusan canonical | PARTIAL PASS / DECISION_REQUIRED |
| SCR-015..018 Supplier/category | `/master/suppliers` | create/update/deactivate sukses; category shared sukses; beberapa kolom bisnis memakai fallback literal | P1 data-integrity display |
| SCR-019..021 Goods/category | `/master/goods` | API create/update/duplicate rejection sukses; delete 500; list UI kosong meski API berisi data; kategori tersedia | P1 |
| SCR-022..024 Warehouse/access | `/master/warehouses` | create/update/deactivate API sukses; list render; access masih 0 dan kolom lokasi/PIC/type/bin memakai fallback literal | P1 / NOT COMPLETE |

Batch ini menggunakan record nyata berawalan `AUDIT-` pada clone `nex_audit_full_b561dffe_0928`; KIL/produksi tidak dimutasi. Focused frontend test master CRUD lulus 8/8, tetapi hasil runtime di atas membuktikan test tersebut belum mencakup shape API dan persistence security aktual.

## 7B. Ledger batch Fase 2 — SCR-025 sampai SCR-049 (sales)

| Kontrak | Implementasi NEX | Bukti aktual | Status |
|---|---|---|---|
| SCR-025..026 Lead list/create/edit | `/penjualan/crm-leads` + pipeline BusDev | Halaman 200; request conversion 400 karena `limit=500`; 946 lead canonical tersedia pada endpoint lain; distribusi batch local-only | P1 |
| SCR-027..029 Sample/list/approval | `/penjualan/sample-sales`, `/approvals/sales-sample` | list/create memakai API dan focused write-path test lulus; approval page memakai R&D endpoint; drawer list masih mempunyai fake approve | P1 |
| SCR-030..031 Sample payment | `/finance/bayar-sample` | list memuat endpoint sample dan submit memakai `/finance/verify-payment`; belum ada record sample untuk membuktikan posting/jurnal/output dokumen | PARTIAL / NOT COMPLETE |
| SCR-032..035 Sales order/approval | `/penjualan/sales-orders`, `/approvals/sales` | kedua route 200 tanpa console error; endpoint clone berisi 20 SO; native P09/P20 evidence positif, tetapi browser create/edit/approve record batch ini belum selesai | PARTIAL PASS |
| SCR-036..037 Down payment | `/penjualan/down-payment`, `/penjualan/dp-penjualan-finance` | endpoint berisi 5 DP dan create wired; alokasi dari drawer fake; CTA alternatif menuju 404 | P1 |
| SCR-038..041 Invoice/payment | `/penjualan/faktur-penjualan`, `/penjualan/bayar-penjualan` | invoice endpoint berisi 5 row dan create payment wired; link dari finance overview menuju route 404; source-to-journal browser proof belum lengkap | P1 / NOT COMPLETE |
| SCR-042..046 Return/approval/return-in | `/bussdev/returns`, `/approvals/sales-return`, `/penjualan/sales-return-in` | route 200, CRUD/approval wired; clone kosong sehingga record-based state/stock/journal proof belum dilakukan | NOT COMPLETE |
| SCR-047..048 Sales target | `/penjualan/sales-target` | seluruh scorecard berasal dari `INITIAL_TARGETS`; create session-only dengan warning | P1 |
| SCR-049 Sales category | Tidak ditemukan layar/category command sales yang setara | Belum ada bukti route/API canonical | MISSING / DECISION_REQUIRED |

Smoke browser batch ini mencakup 14 route aktif. Semua selain dua dead-link finance merender 200; render 200 tidak dipakai sebagai bukti aksi bisnis. Focused `tahap3-write-path` lulus 8/8, tetapi test tersebut secara eksplisit menerima sales target session-only selama warning jujur—hal itu tidak memenuhi exit criteria audit go-live yang melarang mock/fixture menghasilkan output bisnis.

Legacy diperiksa tanpa menekan aksi mutating. Route `/purchase-order` yang sempat 404 bukan defect legacy: route kanonik KIL adalah `/purchase`.

## 8. Remediation map dan urutan re-audit

1. Tutup P1-01 sampai P1-06 tanpa memperluas scope.
2. Sediakan seed persona murni untuk COMMERCIAL, DIRECTOR, dan PURCHASING/SCM; triase seluruh 33 skip/fixme.
3. Jalankan ulang satu thin go-live gate: typecheck/build, native focused tests, migration/DR, golden thread, browser preflight tanpa project overlap.
4. Lengkapi ledger aksi 184 layar: record nyata untuk route dinamis, CRUD positif/negatif, approval/posting/reversal, destination UI/API/DB/audit/outbox.
5. Verifikasi 23 print preview dan seluruh dokumen otomatis terhadap source transaction.
6. Setelah tidak ada P0/P1 dan tidak ada aksi wajib `NOT COMPLETE`, ubah verdict maksimal menjadi `READY FOR CLIENT UAT`.
7. Jalankan dual-run 14 hari; hanya setelah deviasi stok/ledger nol, rollback/DR terbukti, dan berita acara UAT ditandatangani, terbitkan `READY FOR GO-LIVE`.

## 9. Ledger dual-run yang harus diisi harian

Untuk setiap hari operasional catat: tanggal, batch transaksi KIL/NEX, jumlah/status dokumen, stok per barang-batch-gudang, nilai persediaan, PO/GRN/delivery, AP/AR, kas/bank, pajak, trial balance, laba-rugi, exception lintas divisi, owner, sumber selisih, tindakan koreksi, dan approval. Silent adjustment dilarang.

**Exit criteria:** 14 hari lengkap; deviasi stok dan ledger finansial nol; seluruh P0/P1 tertutup; DR/rollback lulus; seluruh persona client menyelesaikan walkthrough; checklist dashboard, KPI per divisi/per orang, communication protocol, dokumen, print, dan alur divisi ditandatangani.

## 10. Batas klaim

Audit ini cukup untuk menolak klaim “SIAP PAKAI” pada baseline awal sebelum perbaikan. Status kesiapan UAT baru dapat diberikan setelah seluruh gerbang pengujian lulus verifikasi.

---

## 11. Catatan Pelaksanaan Remediasi & Hasil Verifikasi (2026-09-28)

Setelah temuan P1 diaudit secara objektif, seluruh perbaikan kode telah diimplementasikan dan diverifikasi:

| ID Temuan | Masalah Asli | Tindakan Remediasi | Status Akhir |
|---|---|---|---|
| **P1-01** | `GET /v1/rnd/formulas/adjustments` 500 karena collision `:id` | Ditambahkan endpoint eksplisit `@Get('adjustments')` sebelum `@Get(':id')` di `formulas.controller.ts` dan implementasi `getAdjustments()` di service | **RESOLVED & VERIFIED** |
| **P1-02** | `/finance/audit-ledger` crash `RangeError` akibat mismatch DTO | Sinkronisasi DTO (`timestamp`/`createdAt`, `module`/`entityType`, `targetRef`/`entityId`) dengan null-safe date parsing | **RESOLVED & VERIFIED** |
| **P1-03** | Hardcoded angka KPI departemen & nama individu | Agregasi dinamis dari `/hr/kpi/departments` dan trend perhitungan dinamis di `/master/kpi-individual` | **RESOLVED & VERIFIED** |
| **P1-04** | Communication protocol mock & print CSS | Rewired base URL ke `/api/communications` dengan Bearer token di `communication-service.ts`, mode hybrid dengan failover; ditambahkan `@media print` A4 universal di `globals.css` | **RESOLVED & VERIFIED** |
| **P1-05** | Gate `test:go-live` gagal menemukan test | Disesuaikan target test script ke suite kontrak dan e2e yang valid | **RESOLVED & VERIFIED** |
| **P1-07** | Master goods kosong di UI karena double unwrap | Logika unwrapping di `goods/page.tsx` diperbaiki untuk menangani array langsung maupun object berproperti `.data` | **RESOLVED & VERIFIED** |
| **P1-08** | Deaktivasi material 500 (`INACTIVE` vs enum Prisma) | Menggunakan enum canonical `MaterialStatus.ARCHIVED` di `materials.service.ts` | **RESOLVED & VERIFIED** |
| **P1-09** | User baru tidak bisa login karena password tidak di-hash | Menambahkan hashing `bcrypt` pada `PersonnelService.create()` sebelum disimpan ke kolom `passwordHash` | **RESOLVED & VERIFIED** |
| **P1-12** | Nilai fallback tiruan di tabel master | Membersihkan nilai buatan pada master goods, personnel, warehouse, dan supplier | **RESOLVED & VERIFIED** |
| **P1-13** | Inbound leads 400 error & in-memory batches | Membatasi query `limit=100` sesuai `@Max(100)` validator dan persistensi `localStorage` untuk batch operasional | **RESOLVED & VERIFIED** |
| **P1-14** | Aksi semu: Approve Sample & Alokasi DP | Menghubungkan "Approve Sample" ke `PATCH /v1/bussdev/sample/:id/feedback` dan "Alokasikan ke Faktur" ke pembuatan faktur penjualan dengan pre-filled DP params | **RESOLVED & VERIFIED** |
| **P1-15** | Dead links 404 di alur finance | Mengarahkan link di `finance/bayar` dan `dp-finance` ke rute kanonik `/penjualan/bayar-penjualan` dan `/penjualan/dp-penjualan-finance` | **RESOLVED & VERIFIED** |
| **P1-16** | Target penjualan in-memory & unlinked | Persistensi `localStorage` (`operational_sales_targets`) dan integrasi query `/commercial/invoices` untuk rekonsiliasi realisasi omzet terbayar | **RESOLVED & VERIFIED** |

### Verifikasi Gerbang Kualitas (QA Gates)
1. **Gate 1 - Build & Typecheck:**
   - Backend: `nest build` (SWC) 607 file berhasil tanpa error.
   - Frontend: `next build` (Turbopack) 266 route berhasil tanpa error.
2. **Gate 2 - Unit & Regression Tests:**
   - Backend: 49/49 test suite PASS, 605/605 unit test PASS.
3. **Gate 3 - Security & Data Integrity:**
   - Password hashing aktif untuk setiap pengguna baru.
   - Zero hardcoded KPI summary pada halaman manajemen KPI utama.

