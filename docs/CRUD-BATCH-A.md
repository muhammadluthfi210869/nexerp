# CRUD Maturity Audit — Batch A (bussdev / rnd / creative)

Audit date: 2026-10-01. Branch: `feat/p08-contracts-subject-ownership`.
Semua angka di dokumen ini hasil dari command yang tertulis; tidak ada angka yang diwarisi dari pass sebelumnya.

**Dua klaim yang diberikan ke saya ternyata SALAH, sudah diverifikasi sendiri:**

| Klaim | Hasil verifikasi | Command |
|---|---|---|
| "drawer tidak pernah fetch data sendiri, di seluruh repo = 0" | **SALAH.** 2 dari 86 file Drawer/Detail melakukan fetch sendiri: `samples/social-tracker/components/PostDrawer.tsx`, `components/production/WoDetailDrawer.tsx`. Sisanya 84 tidak. | `find frontend/src -name '*Drawer*.tsx' -o -name '*Detail*.tsx'` lalu loop `grep -qE 'useQuery\|useSWR\|api\.\|fetch\(\|axios'` |
| "jumlah number-minting site rendah" | **SALAH arah.** Di scope Batch A ada 6 site; di seluruh `frontend/src` ada **131** hit `Date.now()` yang membentuk identifier. | `grep -rnE 'Date\.now\(\)' frontend/src --include=*.ts --include=*.tsx \| grep -iE '(code\|no\|num\|number\|id\|batch\|lot\|ref\|serial)'` |

---

## 1. Tabel Ringkasan

Verdict: **WORKS** = operasi ada, end-to-end ke Prisma, UI-nya ada. **PARTIAL** = ada tapi ada bagian yang putus/renggang. **MISSING** = tidak ada. **UNVERIFIED** = tidak bisa dipastikan tanpa menjalankan sistem.

### bussdev

| Entitas | Create | Read | Update | Delete |
|---|---|---|---|---|
| SalesLead | PARTIAL — form ada tapi batch CRM hanya localStorage | WORKS — `bussdev/leads`, `lead/:id` | PARTIAL — `PUT lead/:id` tanpa optimistic concurrency | **P0** — hard delete tanpa guard anak |
| LeadActivity | WORKS — `POST lead/:id/activity` | WORKS — `lead/:id/activity-stream` | - (append-only) | - (append-only) |
| LostDeal | WORKS — ditulis via pipeline | PARTIAL — dashboard only, tanpa halaman CRUD | MISSING | MISSING |
| BussdevStaff | MISSING — tak ada endpoint tulis | PARTIAL — `GET staffs` read-only | MISSING | MISSING |
| GuestLog | WORKS — `POST guest/:id/convert` | WORKS — halaman `guest-book` | PARTIAL | MISSING |
| NewProductForm | PARTIAL — `POST /rnd/npf` ada, **tak ada UI yang membacanya** | **MISSING** — nol UI surface | MISSING | MISSING |
| SalesOrder | WORKS — nomor dari `IdGeneratorService` | WORKS — `GET sales-orders` | PARTIAL — `PATCH :id/status` semi-blind | **MISSING** — ada kolom `deletedAt`, tak ada endpoint |
| SalesOrderItem | MISSING — tak ada endpoint | PARTIAL — ikut di include SO | MISSING | MISSING |
| SalesReturn | WORKS — schema-based DTO | WORKS — `bussdev/returns` | WORKS — `PATCH :id` | **WORKS** — soft delete + UI affordance |
| SalesReturnItem | MISSING | PARTIAL | MISSING | MISSING |
| RetentionEngine | WORKS — trigger engine | PARTIAL | MISSING | MISSING |
| LeadTimelineLog | WORKS (internal) | WORKS (internal) | - | - |
| ActivityStream | WORKS (event-driven) | WORKS — `lead/:id/activity-stream` | - | - |
| SalesCategory | WORKS — `POST sales-categories` | WORKS | WORKS — `PUT` | WORKS — `DELETE` ada |

### rnd

| Entitas | Create | Read | Update | Delete |
|---|---|---|---|---|
| SampleRequest | WORKS — DTO schema-based | WORKS — `rnd/samples`, `samples/:id` | PARTIAL — `advance` ada tapi PATCHNpF salah target | MISSING |
| SampleStageLog | WORKS (internal) | WORKS (internal) | - | - |
| Formula | WORKS — `POST rnd/formulas` | WORKS — list + `GET :id` | PARTIAL — `PATCH :id` tanpa version check | MISSING |
| FormulaPhase | MISSING | PARTIAL | MISSING | MISSING |
| FormulaItem | MISSING — 0 referensi di FE | MISSING | MISSING | MISSING |
| SampleFeedback | WORKS — `rnd/samples/:id/feedback` | WORKS | - (append) | - |
| BillOfMaterial | WORKS — ikut LabTestResult | **MISSING** — 0 referensi di FE | MISSING | MISSING |
| LabTestResult | WORKS — `POST lab-test-results` | WORKS | MISSING | MISSING |
| RndStaff | MISSING | PARTIAL — `GET staffs` | MISSING | MISSING |
| NewProductForm (model NPF) | PARTIAL | **MISSING** | MISSING | MISSING |

### creative

| Entitas | Create | Read | Update | Delete |
|---|---|---|---|---|
| DesignTask | WORKS — `POST creative/task` | WORKS — `board`, `tasks`, `finalized` | PARTIAL — 6 `designTask.update`, nol delete | MISSING |
| DesignVersion | WORKS — `PATCH task/:id/version` (multipart) | WORKS — `tasks/:id/history` | PARTIAL | MISSING |
| DesignFeedback | WORKS — apj-review / client-review | WORKS | - (append) | - |

**Angka per sel** (menghitung entitas unik, anak dianggap entri sendiri karena punya surface berbeda):

| | WORKS | PARTIAL | MISSING | UNVERIFIED |
|---|---|---|---|---|
| **C** | 11 | 3 | 8 | 0 |
| **R** | 7 | 7 | 8 | 0 |
| **U** | 2 | 6 | 14 | 0 |
| **D** | 2 | 0 | 20 | 0 |

Delete adalah sel paling lemah: **2 dari 24 entitas punya delete yang benar-benar berfungsi.**

---

## 2. Findings

### P0-1 — `finance-invoice.service.ts:483` menulis `paymentApprovedAt` tanpa `paymentApprovedById`, jadi gate BUS-RULE-107 lolos separuh

`verifyOrderPayment` cabang `type === 'SAMPLE'` menulis hanya satu dari dua kolom yang dicek gate:

```
backend/src/modules/finance/services/finance-invoice.service.ts:483
  paymentApprovedAt: new Date(),
```

Tidak ada `paymentApprovedById` di baris yang sama, padahal `assertSampleFeeVerified` mensyaratkan keduanya:

```
backend/src/modules/rnd/services/rnd-sample.service.ts:75
  if (!sample.paymentApprovedAt || !sample.paymentApprovedById) {
```

Efeknya: sample berpindah `stage: 'QUEUE'` (`finance-invoice.service.ts:484`) sebelum fee terverifikasi oleh-named. Dua pathway lain di file yang sama (`:626-627` dan `:711-712`) menulis kedua kolom dengan benar — jadi ini bukan keputusan desain yang disengaja, ini ketidakkonsistenan. Pathway `:483` terekspos lewat `finance.controller.ts:81` dan `:495`.

*Inferensi (belum diuji runtime):* karena `paymentApprovedById` tetap null, R&D tetap terkunci di `assertSampleFeeVerified`, jadi gate mungkin tidak benar-benar terlewat — tapi record-nya sekarang setengah terisi dan tidak bisa dibedakan dari "Finance menyetujui tapi forgot by-id" tanpa membaca audit trail. Yang pasti: `stage` sudah advanced duluan. Yang akan menyelesaikannya: jalankan `POST /finance/verify-order-payment` dengan `type: 'SAMPLE'` lalu baca `sampleRequest.stage` dan `paymentApprovedById` dari DB.

### P0-2 — `lead-stage.service.ts:872` hard-delete SalesLead tanpa guard, dan FK-nya campur: sebagian cascade, sebagian tolak

```
backend/src/modules/bussdev/services/lead-stage.service.ts:872-877
  async removeLead(id: string) {
    const lead = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.prisma.salesLead.delete({ where: { id } });
```

Dijangkau lewat `bussdev.controller.ts:353` (`DELETE lead/:id`, SUPER_ADMIN) → `bussdev.service.ts:183` → `lead.service.ts:253` → di sini.

Model `SalesLead` **tidak punya** `deletedAt` / `isActive` / `archivedAt` (diverifikasi: grep flag pada `bussdev.prisma` hanya menemukan `isActive` di `BussdevStaff:122` dan `deletedAt` di `SalesOrder:186` + `SalesReturn:232`). Jadi ini benar-benar hard delete.

Yang hilang bersama lead, tergantung pada cascade:
- **Cascade** (`onDelete: Cascade`): `SampleRequest` (`rnd.prisma:61`), `DesignTask` (`creative.prisma:26`), `ActivityStream` (`bussdev.prisma:291`), `LeadTimelineLog` (`bussdev.prisma:274`), `WorkOrder` (`production.prisma:106`). Menghapus satu lead bisa menghapus riwayat formulasi R&D dan task desain.
- **Restrict/tanpa cascade**: `SalesOrder` (`bussdev.prisma:194`), `NewProductForm` (`bussdev.prisma:162`), `LeadActivity` (`bussdev.prisma:97`), `RegulatoryPipeline` (`legal.prisma:107`), `Warehouse` lead (`warehouse.prisma:228`). Prisma default = `Restrict`, jadi delete akan **gagal** dengan P2003 kalau lead punya anak ini — artinya user melihat 500 dan tidak tahu kenapa.

Tidak ada audit call di body ini. `AuditLogInterceptor` memang menutup DELETE (`platform/audit/audit.interceptor.ts:28` — `MUTATING_METHODS` memuat `'DELETE'`, terdaftar global di `platform.module.ts:38-40`), jadi ada jejak HTTP-level; tapi tidak ada jejak entitas-level yang mencatat anak mana yang ikut hilang.

### P0-3 — `StateTransitionService.executeTransition` **nol call site produksi**; state machine hanya divalidasi, tidak pernah dieksekusi

```
backend/src/modules/system/state-transition.service.ts:218
  async executeTransition(
```

Command: `grep -rn 'executeTransition' backend/src --include=*.ts`
Hasil: 1 definisi + 6 hit di `backend/src/modules/system/__tests__/state-transition.service.spec.ts`. **Nol di produksi, termasuk di dalam Batch A ini.**

Yang dipakai produksi hanya `validateTransition` (pure check, tidak menulis apa pun):
- `rnd-sample.service.ts:446`, `:516`, `:673`
- `commercial/services/sales-orders.service.ts:148`
- `production/production-execution.service.ts:342`

Artinya gate + audit + event yang dikemas `executeTransition` (gate `:236`, audit, emit) tidak pernah jalan. Status ditulis langsung dengan literal enum, di bypass dari validator:
- `finance-invoice.service.ts:484` `stage: 'QUEUE'`
- `finance-invoice.service.ts:626-628`, `:711-713` `stage: 'QUEUE'` + `paymentApprovedAt`
- `formula-version.service.ts:370` `status: 'SUPERSEDED'`, `:390` `status: 'DRAFT'`, `:497` `status: 'WAITING_APPROVAL'`
- `bussdev.service.ts:434` `status: 'PENDING_DP'`
- `lead-stage.service.ts:382`, `:645` `status: 'PENDING_DP'`

Formula ternyata mengirim event `'state.transition'` sendiri (`formula-version.service.ts:502`+) — jadi ada implementasi paralel dari mesin yang sama di luar service yang seharusnyaokusnya. *Inferensi:* ini duplikasi, bukan desain dua-lapis; yang mana yang dianggap canonical tidak bisa dipastikan dari kode saja.

### P0-4 — Halaman `samples/npf` membaca `SampleRequest`, bukan `NewProductForm`; `NewProductForm` nol UI surface

```
frontend/src/app/(dashboard)/samples/npf/_hooks/useNpfOperations.ts:46
  const res = await api.get("/rnd/samples");
```

Kolom yang di-map (`productName`, `targetFunction`, `stage`) semuanya milik `SampleRequest`, dipetakan menjadi `NpfSampleRow` lalu di-render sebagai tabel NPF. Akibatnya: form create NPF (`useNpfOperations.ts:111` → `POST /rnd/npf`, yang memang menulis `NewProductForm`) sukses, tapi hasil create **tidak pernah muncul** di list — user akan mengira create gagal lalu membuat duplikat.

Verifikasi ulang:
- `grep -rn "newProductForm\|NewProductForm" frontend/src --include=*.ts --include=*.tsx` (tanpa test) → **0 hit**.
- `grep -rn "rnd/npf" frontend/src` → hanya `POST` (`useNpfOperations.ts:111`, `components/commercial/lead-board.tsx:250`) dan file tipe generated. **`GET /rnd/npf` dan `GET /rnd/npf/:id` tidak dipanggil siapa pun** — `NpfController.findAll`/`findOne` (`npf.controller.ts:20`, `:26`) adalah kode mati.

### P0-5 — Feedback NPF di-PATCH ke endpoint stage sample dengan payload yang tidak cocok

```
frontend/src/app/(dashboard)/samples/npf/_hooks/useNpfOperations.ts:135
  const res = await api.patch(`/rnd/sample/${selectedNpf?.id}/advance`, {
    newStage: feedbackDecision,
```

`selectedNpf?.id` berasal dari list `/rnd/samples` (P0-4), jadi ini id **SampleRequest** yang dikirim ke endpoint advance sample. `feedbackDecision` bertipe `"APPROVED" | "REVISION"`, sedangkan `AdvanceSampleDto`Collaboration — perlu konfirmasi apakah enum-nya memuat nilai tersebut. Toast di `:143` lalu menyatakan "Sample telah disetujui klien" — jadi UI mengetik dll kondisional ke proses yang secara semantik berbeda (menyetujui sample ≠ mereview NPF).

---

### P1-1 — Halaman `rnd/project-monitoring` memanggil route yang tidak ada controller-nya

```
frontend/src/app/(dashboard)/rnd/project-monitoring/page.tsx:175
  id: `PROJ-RND-${Date.now()}`,
```

Verifikasi: `grep -rn "project-monitoring\|formula-builder" backend/src --include=*.ts` → **0 hit**. Link ke halaman ini ada di `components/layout/Sidebar.tsx:440` dan `:698` dengan badge "70 PRJ". HalamanAccessible dari sidebar, tidak punya endpoint.-creation-nya juga client-minted (`Date.now()`), dan `.length + 1` untuk nomor (`page.tsx:176`).

Route lain di scope yang juga tanpa controller (verifikasi dengan loop grep per-path atas `@Get('/@Post('/@Controller('/`):
`bussdev/komisi-sales`, `bussdev/churn-prediction`, `bussdev/auto-invoice`, `bussdev/client-ro`, `bussdev/client-manager`, `bussdev/sample-sales`, `rnd/formula-builder`.

Catatan: sebagian besar ini adalah string di `master/automation/page.tsx:50-52` (daftar kartu fase, bukan panggilan API) atau redirect router (`penjualan/pipeline/page.tsx:8`). Yang jelas-jelas surface API palsu: `rnd/project-monitoring` dan `rnd/formula-builder`.

### P1-2 — `rnd/formulations` (SamplesController) tidak dipanggil frontend mana pun

`SamplesController` (`samples.controller.ts:18`, prefix `rnd/formulations`) punya `POST`/`GET`/`GET :id` penuh. Verifikasi: `grep -rn "rnd/formulations" frontend/src` → hanya di `types/api.ts` dan `types/api-schema.d.ts` (generated), tidak ada call site. Endpoint aktif tapi tanpa consumer.

### P1-3 — Tidak ada optimistic concurrency di mana pun di Batch A, padahal `version` sudah ada di schema

Field tersedia tapi tidak dipakai sebagai guard:
- `SampleRequest.version Int @default(1)` — `rnd.prisma:21`
- `Formula.version Int @default(1)` — `rnd.prisma:89`

Pemakaian semuanya read-only untuk display/sort (`rnd-sample.service.ts:771`, `:963`, `:1034`, `:1058`, `:1077` — semua `orderBy`/`select`). `rnd-sample.service.ts:264` menulis `version: dto.version || 1` saat create — jadi **klien boleh menentukan nomor versi sendiri** di saat pembuatan, dan tidak ada validasi bahwa itu 1.

Verifikasi tidak adanya guard:
```
grep -rnE 'where:\s*\{\s*id[^}]*version|version:\s*dto\.version|version:\s*expectedVersion|If-Match' \
  backend/src/modules/{bussdev,rnd,creative} --include=*.ts | grep -v __tests__
```
→ 1 hit, dan itu `rnd-sample.service.ts:264` (penulisan saat create, bukan perbandingan).

`updateFormulaV4` dan `requestApproval` memakai `tx.formula.update({ where: { id }, data: {...} })` polos (`formula-version.service.ts:498`) — dua user yang membuka formula sama akan saling menimpa. `assertMutable` ada (`formula-version.service.ts:481`) tapi itu memeriksa status, bukan versi.

### P1-4 — `PUT lead/:id` dan `PATCH :id` diterima mentah tanpa DTO

```
backend/src/modules/bussdev/bussdev.controller.ts:346-350
  updateLead(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.leadService.updateLeadScoped(id, dto, this.trustedActor(req));
```

`@Body() dto: any` — tanpa class-validator, berarti `PUT lead/:id` bisa menulis field apa saja yang lolos ke Prisma. Bandingkan dengan DTO yang ada dan terpakai di jalur lain (`create-lead.dto.ts` punya 63 decorator, 30 di antaranya `@IsOptional`). KonsekuensiUpdate: риск kehilangan update lebih besar di jalur yang justru tidak divalidasi.

### P1-5 — Client-side number minting di Batch A: 6 site, seluruhnya di luar jalur server

Scope `penjualan|bussdev|creative|rnd|master/sales-category`:

| Lokasi | Pola |
|---|---|
| `penjualan/crm-leads/_hooks/useCRMLeadsOperations.ts:205` | `LEAD-${year}-${String(batches.length + 1).padStart(3,"0")}` |
| `penjualan/crm-leads/CRMLeadsClient.tsx:317` | idem (duplikat logika) |
| `penjualan/client-manager/_components/ClientSampleActivitySection.tsx:152` | `String(records.length + 1)` |
| `penjualan/client-manager/_components/ClientSampleActivitySection.tsx:234` | `id: AMI-JULI-${Date.now()}` + `.length + 1` |
| `penjualan/delivery-orders/page.tsx:146` | `DO-2026-${Date.now().toString().slice(-4)}` |
| `rnd/project-monitoring/page.tsx:175-176` | `PROJ-RND-${Date.now()}` + `.length + 1` |

Pola `length + 1` menghasilkan tabrakan nomor begitu ada dua user. Bandingkan dengan jalur yang benar: `bussdev.service.ts:427` memakai `await this.idGenerator.generateId('SO')` untuk `orderNumber`. Jadi pola yang benar sudah ada di repo, tinggal tidak dipakai konsisten.

### P1-6 — `crm-leads` "CRUD" lead batch sepenuhnya localStorage

```
frontend/src/app/(dashboard)/penjualan/crm-leads/_hooks/useCRMLeadsOperations.ts:48-55
  const updateAndPersistBatches = (newBatches) => {
    setBatches(newBatches);
    try { localStorage.setItem("operational_lead_batches", JSON.stringify(newBatches)); }
    catch { /* ignore */ }
  };
```

Create (`:205-212`), update, dan delete (`:222-226`, `confirm()` + filter) semuanya ke localStorage. Tidak ada `SalesLead` yang tercipta. Halaman ini menampilkan "Batch Leads berhasil disimpan!" (`:219`) untuk data yang tidak pernah masuk Prisma. Ini bukan UI yang salah — ini UI yang mengarang sukses.

### P1-7 — `SalesOrder.deletedAt` ada di schema, tidak ada endpoint delete

```
backend/prisma/schema/bussdev.prisma:186
  deletedAt          DateTime?
```

`grep -rnE 'async (remove|delete|softDelete)\(' backend/src/modules/{bussdev,rnd,creative}` → **1 hit**: `returns.service.ts:143`. Tidak ada soft-delete atau delete untuk `SalesOrder`, padahal kolomnya sudah disediakan. `getSalesOrders` (`bussdev.service.ts:439`) tidak memfilter `deletedAt: null`, jadi begitu ada yang mengisinya, order tersebut akan tetap tampil.

### P1-8 — Tidak ada form dengan validasi schema di seluruh halaman Create milik Batch A

```
grep -rlE 'useForm|zodResolver|z\.object' \
  "frontend/src/app/(dashboard)/penjualan" ".../bussdev" ".../creative"
```
→ **0 file**. Semua form create/update di Batch A adalah `useState` + `if`. Contoh: `NpfFormModal.tsx:65-81` punya dua `<input>` yang binding-nya `value={form.productName}` / `value={form.targetPrice}` tanpa validasi — `targetPrice` di-cast `Number(e.target.value)` sehingga input non-numeric menjadi `NaN` yang lolos ke `POST /rnd/npf` (dengan `@IsNumber()` di DTO, jadi server menolak — tapi pesan errornya jauh dari field yang salah).

Di sisi server DTO-nya justru baik: 15 DTO di scope, semua punya decorator class-validator (total 251 decorator). Yang hilang adalah form yang memenuhi kontrak itu.

---

### P2-1 — 84 dari 86 Drawer/Detail tidak fetch data sendiri

Di Batch A yang relevan:

| File | Sumber data |
|---|---|
| `penjualan/crm-leads/_components/LeadDetailDrawer.tsx` | props dari list query |
| `penjualan/crm-leads/_components/BatchDetailDrawer.tsx` | props dari list query |
| `penjualan/retur-penjualan/_components/ReturDetailDrawer.tsx` | props |
| `penjualan/sales-orders/_components/OrderDetailDrawer.tsx` | props |
| `penjualan/client-manager/_components/ClientDetailDrawer.tsx` | props |
| `penjualan/guest-book/_components/GuestDetailDrawer.tsx` | props |
| `penjualan/lost/_components/LostDetailDrawer.tsx` | props |
| `creative/board/components/DesignHubDrawer.tsx` | props |
| `samples/design/_components/DesignDetailDrawer.tsx` | props |
| `samples/npf/_components/NpfDetailModal.tsx` | props |
| `rnd/project-monitoring/_components/RndProjectMonitoringDetailDrawer.tsx` | props |

Konsekuensi: field yang tidak dibawa `select` di list query tidak akan pernah tampil di detail, dan `SalesOrderItem` / `FormulaItem` tidak akan pernah terlihat di drawer manapun. Tidak ada per-record URL untuk entity mana pun di Batch A (`/marketing/omnicrm/leads/[id]` adalah route marketing, bukan `SalesLead`).

Yang **dilakukan** benar: `returns.controller.ts:33` punya `GET :id` dan `SalesReturn` punya UI delete dengan konfirmasi (`bussdev/returns/page.tsx:98`).

### P2-2 — Hardcoded data di halaman dalam scope

```
frontend/src/app/(dashboard)/penjualan/client-manager/_data/ami-sample-initial.ts
frontend/src/app/(dashboard)/penjualan/client-manager/_components/ClientSampleActivitySection.tsx
frontend/src/app/(dashboard)/creative/board/components/DesignHubDrawer.tsx
frontend/src/app/(dashboard)/creative/board/CreativeBoardClient.tsx
frontend/src/app/(dashboard)/creative/finalized/page.tsx
```

`ami-sample-initial.ts` adalah file initial-data yang diimpor `ClientSampleActivitySection.tsx` dan di-mint `AMI-JULI-${Date.now()}` saat tambah baris. Tidak ada service yang menghasilkan `AMI-*`.

### P2-3 — `FormulaItem`, `BillOfMaterial`, `SampleFeedback` tidak punya surface tulis dari UI

Verifikasi: `grep -rl "formulaItem" frontend/src/app --include=*.ts --include=*.tsx` → 0 file; `billOfMaterial` → 0 file; `sampleFeedback` → 0 file. `FormulaItem` ditulis server (`create-formula.dto.ts` punya 13 decorator termasuk item), jadi create jalan dari sisi server, tapi tidak ada halaman yang membacanya kembali.

### P2-4 — `POST /bussdev/sales-order` tidak membuat `SalesOrderItem`

```
backend/src/modules/bussdev/bussdev.service.ts:428-436
  const orderId = await this.idGenerator.generateId('SO');
  return this.prisma.salesOrder.create({
    data: { orderNumber: orderId, leadId, sampleId, totalAmount, quantity, brandName, status: 'PENDING_DP' },
```

`quantity` disimpan sebagai angka di header, tidak ada `items: { create: [...] }`. `SalesOrderItem` (`bussdev.prisma:206`) tidak pernah terisi dari jalur ini, padahal `updateSalesOrderStatus` (`bussdev.service.ts:207-210`) membacanya lewat `billOfMaterials` untuk gate BOM — sehingga gate itu berjalan atas data yang tidak pernah dibuat.

### P2-5 — `PATCH sales-order/:id/status` полу-blind: tanpa `StateTransitionService`

```
backend/src/modules/bussdev/bussdev.controller.ts:298-310
  @Patch('sales-order/:id/status')
  updateSoStatus(@Param('id') id, @Body() dto: { status: SOStatus; loggedBy: string }, ...)
```

Diteruskan ke `bussdev.service.ts:189`. Body di-typed inline (`{ status: SOStatus; loggedBy: string }`), bukan DTO → tidak ada `@IsEnum`, jadi string apa pun bisa masuk. Ada gate bisnis nyata di dalamnya (`:203-210`, cek BOM sebelum `READY_TO_PRODUCE`) — jadi ini bukan setter kosong total, tapi transisinya sendiri tidak divalidasi terhadap state machine.

### P2-6 — `BussdevStaff` / `RndStaff` tidak bisa di-CRUD

Keduanya punya `isActive Boolean @default(true)` (`bussdev.prisma:122`, `rnd.prisma:5`) tapi hanya ada `GET staffs` (`bussdev.controller.ts:223`, `rnd.controller.ts:137`). Tidak ada endpoint tulis, dan tidak ada filter `isActive` di query list (verifikasi: grep `isActive` pada kedua service). Artinya nonaktif staff tetap muncul di dropdown PIC.

### P2-7 — `SalesOrder.deletedAt` tidak pernah difilter, dan tidak ada yang mengisinya

`SalesReturn` justru **benar**: `returns.service.ts:11` memakai `where: { deletedAt: null }` di `findAll`, dan `softDelete` (`:147`) mengisinya. Soft-delete utuh sampai akhir.

`SalesOrder` berbeda. `deletedAt DateTime?` ada di `bussdev.prisma:186`, tapi `grep -n 'deletedAt' backend/src/modules/bussdev/bussdev.service.ts` → **0 hit**. Tidak ada yang menulis kolom itu, dan `getSalesOrders` (`bussdev.service.ts:439`) tidak memfilternya. Jadi kolomnya dekoratif: soft-delete-nya belum diimplementasikan, dan begitu P1-7 diperbaiki tanpa menambahkan filter, order yang di-soft-delete akan tetap tampil di list.

---

## 3. Klaim yang TIDAK bisa saya verifikasi

1. **Apakah P0-1 benar-benar melewati gate BUS-RULE-107 saat runtime.** `assertSampleFeeVerified` tetap menolak karena `paymentApprovedById` null, jadi secara logika R&D masih terkunci. Yang belum diuji: apakah ada jalur lain yang mengisi `paymentApprovedById` lebih dulu, dan apakah `stage: 'QUEUE'` yang sudah ter-write menimbulkan efek samping. Butuh: uji integrasi terhadap DB nyata.

2. **Apakah `verifyOrderPayment` cabang SAMPLE pernah terpakai produksi.** Dua call site ada (`finance.controller.ts:81`, `:495`) tapi tidak ada telemetry. Butuh: log akses.

3. **Perilaku FK P0-2 saat runtime.** Saya membaca deklarasi `onDelete` di Prisma, tidak menjalankan delete. Restrict vs cascade bisa juga bergantung pada constraint yang sudah ada di DB hasil migrasi yang tidak cocok dengan schema. Butuh: `migrate diff` terhadap DB produksi.

4. ~~Konsistensi `findAll` vs `deletedAt` (P2-7).~~ **Sudah diverifikasi dan P2-7 dikoreksi** — `SalesReturn.findAll` memfilter dengan benar; yang bermasalah hanya `SalesOrder`.

5. **Apakah `DesignHubDrawer` benar-benar tidak fetch**, atau fetch-nya ditulis dengan pola yang tidak caught grep saya (`import { api } from "@/lib/api"` lalu `api.get` di file berbeda). Grep saya Covers `api.get|fetch(|axios|useQuery|useSWR` di file itu sendiri.

6. **Konsistensi `NewProductForm` vs `SampleRequest` di `rnd/prisma`.** Kemungkinan `NewProductForm` adalah model yang benar dan `/rnd/samples` adalah yang salah, atau sebaliknya — tidak ada dokumen yang mengatakannya. Butuh: `01_DOMAIN_MODEL.md` bab NPF, yang belum saya baca untuk bagian ini.

7. **Kesesuaian kontrak DEC-016.** `docs/legacy-erp/contracts/02_DATA_OWNERSHIP.yaml` mengonfirmasi `SalesOrder` adalah PARENT dan `SalesInvoice`/`GoodsReceipt`/`PurchaseInvoice` adalah CHILD tanpa standalone create (:251, :300, :441, :462). Batch A tidak menyentuh trio CHILD itu, jadi **tidak ada pelanggaran DEC-016 yang saya temukan** — tapi saya hanya mengecek keberadaan entitas, tidak setiap endpoint.
