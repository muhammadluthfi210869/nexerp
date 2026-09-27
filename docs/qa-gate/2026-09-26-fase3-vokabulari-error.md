# QA Gate — Fase 3 Refactor Arsitektur: Audit Trail yang Bisu & Vokabulari Error

Tanggal: 2026-09-26
Branch: `feat/p08-contracts-subject-ownership`
Slice: **3A** (swallow audit yang bisu) + **3B** (exception bertipe di batas HTTP)
Status: **BELUM SIAP KIRIM**

---

## 0. Ringkas

Fase 3 di rencana tertulis berbunyi "Backend Domain Decomposition & Event Decoupling",
dengan tiga klaim: God service harus dipecah, event decoupling belum ada, dan ada
3 empty catch. Pengukuran membantah dua dari tiga klaim itu (bagian 7.1), sehingga isi
nyata Fase 3 bergeser ke urutan: **suara dulu (3A) → status yang benar (3B) → baru
potong file (3C)**.

Yang dikerjakan di laporan ini:

| Slice | Isi | Jumlah titik |
|---|---|---|
| 3A | `catch {}` bisu → `logBestEffort()` | 12 |
| 3B | `throw new Error()` → exception bertipe | 19 |
| 3B | hapus translasi string-match di controller | 1 |
| 3B | hapus `kpi.computeSelf` (dead code) | 1 |

3C (pemecahan `finance.service.ts` 2614 baris / `production.service.ts` 3533 baris)
**belum dikerjakan** dan memang diletakkan paling akhir — memotong file lebih dulu
hanya memindahkan cacat, bukan menghilangkannya. Lihat bagian 5.

---

## 1. Reproduksi Lebih Dulu (Wajib per CLAUDE.md)

Aturan: bug → tulis test reproduksi yang **GAGAL** dulu → baru fix.

### 1.1 3B — sembilan test merah sebelum satu baris pun diubah

`backend/test/unit/typed-http-exceptions.unit-spec.ts` ditulis lebih dulu dan
dijalankan pada kode yang belum disentuh:

```
Test Suites: 1 failed, 1 total
Tests:       9 failed, 1 passed, 10 total
```

Satu yang lulus adalah kontrol positif ("upsert dengan versi yang benar tetap
berhasil") — memang sudah benar sebelum fix, jadi ia membuktikan suite tidak
sekadar merah karena rusak.

### 1.2 Akar masalahnya bukan kosmetik

`src/common/filters/global-exception.filter.ts` memetakan **setiap** throwable ke
RFC 7807, tapi statusnya diambil dari `HttpException.getStatus()`. Untuk apa pun yang
bukan `HttpException`, cabang `else` memberi `500 INTERNAL_SERVER_ERROR` **dan**
`logger.error('Unhandled exception on ...')`.

Akibatnya sebelum 3B:

- "HKI Record not found" dijawab **500** — kesalahan ketik klien dilaporkan sebagai
  kerusakan server.
- Baris itu masuk log sebagai *Unhandled exception*, jadi alarm error tidak bisa
  dipakai untuk membedakan bug nyata dari ID yang salah.
- Klien tidak bisa membedakan "baris tidak ada" dari "proses mati", karena `Error`
  polos tidak membawa status maupun `code`.

Filter membaca `r.code` dari body exception ke problem-details, jadi `code` adalah
jalur yang sudah ada — bukan yang dikarang di sini.

### 1.3 3A — dua belas swallow, dua di antaranya bukan audit

Sebelum fix, `grep` atas lima service SCM menemukan 12 blok `} catch {}` tanpa isi:
tiga di `purchase-requests`, dua di `purchase-orders`, lima di `purchase-payments`,
satu di `purchase-invoices`, satu di `purchase-returns`.

Sepuluh menelan baris `auditLog.create`. Dua — `purchase-invoices.service.ts` dan
`purchase-payments.service.ts` — menelan penulisan cermin `Invoice` dari `Bill`.
Bentuknya sama: baris otoritatif sudah commit, cermin bersifat best-effort, dan
desinkronisasi bisu tidak bisa dibedakan dari run bersih.

---

## 2. Yang Diubah

### 2.1 `backend/src/common/helpers/best-effort.ts` (baru, 1 fungsi)

```ts
export function logBestEffort(logger: Logger, label: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  logger.warn(`Best-effort write failed (${label}): ${message}`);
}
```

**Keputusan swallow-nya dipertahankan, kesunyiannya tidak.** Audit gagal tidak boleh
me-rollback transaksi bisnis; cermin gagal tidak boleh menggagalkan penulisan yang
otoritatif. Preseden untuk itu sudah ada di repo —
`platform/audit/audit.interceptor.ts:191-196` melakukan `logger.warn` tanpa rethrow
untuk masalah yang sama. Yang tidak ada presedennya adalah tidak mencatat apa pun.
Helper ini sengaja **bukan** rethrow.

### 2.2 Dua belas titik swallow (5 file SCM)

`} catch {}` → `} catch (err) { logBestEffort(this.logger, '<label>', err); }`,
masing-masing file juga mendapat `Logger` di import dan
`private readonly logger = new Logger(X.name)`.

Label sengaja spesifik supaya bisa di-grep: `audit:PurchaseRequest:CREATE`,
`audit:PurchaseRequest:APPROVE`, `audit:PurchaseRequest:REJECT`,
`audit:PurchaseOrder:CREATE`, `audit:PurchaseOrder:APPROVE`,
`invoice-mirror:bill-paid-sync`, `audit:APPayment:CREATE`,
`invoice-mirror:bill-reverse-sync`, `audit:APPayment:REVERSE`,
`audit:DownPayment:CREATE`, `invoice-mirror:bill-create`,
`audit:PurchaseReturn:APPROVE`.

Sengaja **tidak** disentuh: `wa-self-qr/connect-page.controller.ts:123` (JavaScript
inline di dalam template string, bukan TypeScript yang dieksekusi) dan
`marketing/__tests__/vercel-tracker.service.spec.ts:25` (pembersihan di test).

### 2.3 Sembilan belas `throw new Error()` → vokabulari yang sudah ada

Tidak ada kelas baru diperkenalkan. `src/common/exceptions/api-exception.ts` sudah
memuat kosakata ini; ia ditulis persis untuk call site seperti ini dan selama ini
tidak dipakai.

| File | Titik | Menjadi |
|---|:--:|---|
| `legality/legality.service.ts` | 11 | `ResourceNotFoundException` / `BusinessRuleViolationException` |
| `production-planning/services/production-plans.service.ts` | 3 | `BusinessRuleViolationException` / `StateTransitionInvalidException` |
| `executive/executive.service.ts` | 1 | `ResourceNotFoundException` |
| `bussdev/bussdev.service.ts` | 1 | `ResourceNotFoundException` |
| `marketing/landing-tracker.service.ts` | 1 | `BusinessRuleViolationException` |
| `marketing/omni-crm/omni-crm-state.service.ts` | 1 | `BusinessException` 409 |
| `finance/finance.service.ts` | 1 | `BusinessException` 500 berkode |

Catatan keputusan yang pantas dipertanggungjawabkan:

- **`finance.service.ts` tetap 500, dan itu disengaja.** "Akun 1110/1121 atau 6101
  belum dikonfigurasi" adalah salah kita, bukan salah pemanggil. Yang diperbaiki
  bukan statusnya melainkan `code`-nya (`FINANCE_COA_NOT_CONFIGURED`) plus daftar
  akun yang hilang di `details`. Pola 3B adalah "beri status yang jujur **dan**
  kode yang stabil", bukan "ubah semua jadi 404".
- **Tidak ada nilai karangan.** Untuk "sudah di stage terakhir" saya tidak menulis
  `to: 'END_OF_PIPELINE'` — itu nilai palsu yang terbaca seperti data.
  `StateTransitionInvalidException` hanya dipakai di tempat tujuan transisinya
  nyata (`production-plans`, `to = LifecycleStatus.PLANNING`); sisanya memakai
  `BusinessRuleViolationException` dengan `record.stage` asli di `details`.

### 2.4 `omni-crm-state.controller.ts` — translasi string-match dihapus

Sebelum:

```ts
} catch (e) {
  if ((e as Error).message === 'VERSION_CONFLICT') {
    throw new ConflictException('VERSION_CONFLICT');
  }
  throw e;
}
```

Sesudah: try/catch dihapus seluruhnya (dan `ConflictException` dicabut dari import).
Service-nya kini melempar 409 langsung. Ini contoh persis kenapa vokabulari bertipe
lebih murah daripada string-match: satu `catch` yang rapuh hilang dari controller.

`VERSION_CONFLICT` tidak direferensikan di `frontend/src` sama sekali (diverifikasi
dengan grep), jadi tidak ada kontrak frontend yang dilanggar saat `code`-nya berubah
dari `HTTP_409` menjadi `VERSION_CONFLICT` yang stabil.

### 2.5 `kpi.service.ts` — `computeSelf` dihapus

Method itu hanya berisi `throw new Error('computeSelf requires userId ...')`, dengan
komentar "used by controller" yang **salah**: `kpi.controller.ts` punya 13 route dan
tidak satu pun bernama `computeSelf`. Dead code yang selalu melempar bukan fitur yang
belum selesai, itu jebakan. Dihapus.

---

## 3. Test Regresi (permanen)

### 3.1 `backend/test/unit/best-effort-audit-swallow.unit-spec.ts` — 9 test

Tiga lapis, karena masing-masing menutup hal yang lain tidak:

1. **Perilaku helper** — termasuk rejection non-`Error` (yang justru sering dari
   driver Prisma), dan `expect(...).not.toThrow()` untuk mengunci keputusan
   "tidak rethrow".
2. **Wiring nyata** — `PurchaseRequestsService.create` dijalankan dengan `tx` tiruan
   yang `auditLog.create`-nya menolak; diasumsikan record tetap kembali **dan** label
   warn muncul. Ini membuktikan sambungannya, bukan cuma helpernya.
3. **Scan sumber** — kelima file diperiksa tidak punya `catch {}` lagi, supaya
   swallow bisu baru tidak bisa ditambahkan di kemudian hari.

### 3.2 `backend/test/unit/typed-http-exceptions.unit-spec.ts` — 10 test

1. **Perilaku nyata** — `OmniCrmStateService.upsert` dengan versi basi: lemparan
   harus `instanceof HttpException`, berstatus 409, dan `code` di body harus
   `VERSION_CONFLICT` (persis field yang dibaca filter).
2. **Kontrol positif** — versi yang benar tetap diterima, jadi suite tidak bisa
   "hijau" dengan cara melarang semua hal.
3. **Scan sumber** — ketujuh file batas HTTP nol `throw new Error(`.

### 3.3 Test itu penjaga, bukan tautologi — dibuktikan dengan run merah

Setelah 3A hijau, satu titik dikembalikan manual ke `} catch {}` dan suite dijalankan:
**2 test gagal** (assertion label warn dan scan sumber). Setelah dipulihkan, hijau
lagi. Tanpa langkah itu, suite hanya membuktikan dirinya sendiri.

### 3.4 Satu test lama ikut berubah, dan ini disengaja

`backend/test/unit/legality.unit-spec.ts:77` meng-assert **prosa**:
`toThrow('Formula not found')`. Pesannya kini berbahasa Indonesia
("Formula tidak ditemukan"), jadi assertion-nya diubah menjadi assert **tipe dan
status**:

```ts
const thrown = await service.validateFormula('VOID').catch((e) => e);
expect(thrown).toBeInstanceOf(ResourceNotFoundException);
expect((thrown as ResourceNotFoundException).getStatus()).toBe(404);
```

Ini memperkuat kontraknya (tipe + status, bukan rangkaian kata), bukan melonggarkan
test supaya lulus. Perilaku yang dijanjikan — baris tidak ada → 404 — tidak berubah.

---

## 4. Verifikasi

### 4.1 Suite yang dijalankan

| Gerbang | Perintah | Hasil |
|---|---|---|
| Typecheck backend | `npx tsc --noEmit` | **rc=0**, 0 error |
| Lint backend | `bash scripts/__tests__/backend-lint-clean.test.sh` | **rc=0** — bersih |
| Unit backend (penuh) | `npm run test:unit` | **39/39 suite, 347/347 test** |
| Suite shell | `bash scripts/__tests__/run-all.sh` | **PASS: 26, FAIL: 0, SKIP: 0** |
| SSOT | `node scripts/ssot/validate_ssot.js` | **19 pass, 0 fail — CERTIFIED** |
| Lifecycle | `node scripts/ssot/audit_lifecycle_reconciliation.js` | **14/14 PASS — OVERALL P02: PASS** |

Suite unit penuh dijalankan dengan `--max-old-space-size=8192` (heap default ~4GB OOM
bahkan untuk satu spec kecil di repo ini).

### 4.2 Yang **belum** dijalankan

- **P03 phase certification** — dijalankan setelah commit; `certify_p03_phase.js`
  menolak working tree kotor di `pre_run_source_integrity`.
- **Smoke test live** — butuh deploy. Tidak ada deploy di sesi ini.
- **Rollback teruji** — butuh deploy. Tidak ada deploy di sesi ini.

Dua yang terakhir adalah alasan verdict di bagian 8, bukan catatan kaki.

---

## 5. Yang Sengaja BELUM Dikerjakan

### 5.1 3C — pemecahan file, diletakkan paling akhir dengan sadar

`finance.service.ts` (2614 baris, 58 method) dan `production.service.ts` (3533 baris,
54 method) memang perlu dipecah. Tapi memecah file yang masih memuat cacat hanya
memindahkan cacat ke lebih banyak tempat, dan membuat `git blame` kehilangan jejak
tanpa memperbaiki apa pun. Karena itu urutannya dibalik: 3A membuat kegagalan
terdengar, 3B membuat kegagalan berstatus benar, **baru** 3C memotong.

3C akan memakai pola "extract class, keep the facade" supaya call site di controller
tidak berubah sama sekali, dan dikerjakan dengan persetujuan eksplisit karena diff-nya
yang paling besar.

### 5.2 Yang sengaja tidak jadi target 3B

`Error` polos di tempat-tempat ini **benar** dan tidak diubah:

- `common/config/env.validation.ts:11`, `modules/auth/auth.module.ts:20`,
  `modules/auth/jwt.strategy.ts:29` — konfigurasi saat boot. Yang diinginkan memang
  proses mati sebelum HTTP hidup, bukan 400.
- Penjaga konfigurasi `kommo.service.ts` (20, 28, 33, 49) dan pembungkus API
  eksternal (`lead-capture.service.ts` 7 titik, `social-planner.service.ts` 2 titik).
- `wa-self-qr` (9 titik) — penjaga state internal.

Mengubahnya menjadi `HttpException` justru akan menyembunyikan kegagalan
konfigurasi. Aturan "50 `new Error()` harus diganti" dari rencana awal terlalu kasar;
tempatnya yang menentukan, bukan jumlahnya.

---

## 6. Catatan Proses

### 6.1 Klaim di dokumen rencana yang dikoreksi oleh pengukuran

Rencana Fase 3 menyatakan tiga hal. Yang benar hanya satu:

| Klaim rencana | Kenyataan terukur |
|---|---|
| "No Domain Events for side-effects" | **Salah.** 26 file emit, 12 file listen, ~80 event domain berbeda. Decoupling sudah ada. |
| "134 method di `production.service.ts`, 107 di `finance.service.ts`" | **Salah.** 54 dan 58. Angka aslinya melebih-lebihkan ~2,5x. |
| "3 empty `catch` block" | **Salah arah.** Ada 14, dan 12 di antaranya swallow audit yang bisu — itu sebabnya 3A jadi slice pertama. |

Konsekuensinya hanya satu yang dari rencana tetap berdiri: `new Error()` polos memang
banyak (dan tetap 19 titik di batas HTTP, bukan 50). Sisanya diganti oleh apa yang
benar-benar ada di repo.

### 6.2 Kenapa "hitung jumlahnya" bukan cara menentukan pekerjaan

Rencana menghitung 50 `new Error()`. Setelah diperiksa satu per satu, 19 yang layak
diperbaiki, dan 12 justru harus dibiarkan. Angka hasil grep tidak tahu bedanya
"penjaga konfigurasi boot" dan "guard yang menjawab ke HTTP". Mengaudit maksudnya
membaca, bukan menghitung.

### 6.3 Tidak menyentuh frontend sama sekali

Nol file di `frontend/` berubah di Fase 3 ini. Tidak ada adopsi `@/components/ui`,
tidak ada perubahan komponen, tidak ada perubahan tipe. `VERSION_CONFLICT` sempat
diperiksa lewat grep di `frontend/src` dan memang tidak dipakai, jadi perubahan
`code` di endpoint itu pun tidak menyentuh frontend.

---

## 7. Verdict

**BELUM SIAP KIRIM.**

Alasannya bukan pekerjaan yang belum rapi — semua gerbang yang bisa dijalankan lokal
hijau:

- typecheck 0 error, lint bersih
- unit 347/347, shell 26/26
- SSOT 19/19 CERTIFIED, lifecycle 14/14 PASS
- test regresi untuk 3A dan 3B ada, dan keduanya **dibuktikan merah dulu**

Alasannya adalah dua gerbang yang CLAUDE.md wajibkan dan **belum bisa dijalankan
tanpa deploy**: smoke test live dan rollback teruji. Selain itu P03 baru bisa
dijalankan setelah commit. Selama tiga item itu belum ada hasilnya, jawabannya tetap
"BELUM SIAP KIRIM" — dan 3C juga masih terbuka.
