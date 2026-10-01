# CRUD Maturity Audit — Batch D

**Scope:** `backend/src/modules/{hr,legality,qc,master}/**`, prisma `{hr,legal,qc,master-extension}.prisma` (+ model definition of `Customer`/`Supplier`/`MaterialItem`/`MasterCategory`/`Warehouse` yang tersebar di `finance.prisma`/`warehouse.prisma`/`bussdev.prisma`), dan FE `master/`, `hr/`, `quality/`, `legality/`.

**Tanggal:** 2026-10-01 · **Commit:** `b561dffe` (branch `feat/p08-contracts-subject-ownership`)

Semua angka di dokumen ini hasil grep yang dijalankan langsung. Perintah yang dipakai ada di bagian [Metodologi](#metodologi).

---

## Ringkasan Eksekutif

Tiga klaim yang diberikan dalam brief **terkonfirmasi**, tetapi satu di antaranya.jadi lebih buruk dari yang dilaporkan dan satu lagi tidak Describes what actually runs:

1. **Ketiga baris penomoran terkonfirmasi verbatim.**olian
2. **Penomoran bukan 7 situs — 20 situs di `master/`, 33 di seluruh scope.** Een previous pass said 7. Even "7" is not reachable by any grep I could construct.
3. **Baris yangilanitiga the brief tunjuk berada di file mati.** `useCustomerOperations.ts`, `useGoodsOperations.ts`, `useSupplierOperations.ts` punya **0 importer**. Kode yang benar-benar dirender adalah `page.tsx` 1081–1179 baris dengan minting **berbeda** (`BBK` vs `BRG`). Membaca hook akan salah mendiagnosis.
4. **Paling menyakitkan: `Supplier` tidak punya kolom `code` sama sekali.** FE memint `VND-BBK-001`, service membuangnya diam-diam. Tidak adacollision, tidak ada P2002 — nomor itu tidak pernah ada.
5. **`QCAudit` = 6 create / 25 read / 0 update / 0 delete** terkonfirmasi. Rekam kualitas yang salah ukur tidak bisa dikoreksi.

---

## 1. Tabel Ringkasan

Verdict: **WORKS** (end-to-end, tanpa defect yang diketahui) · **PARTIAL** (ada, tapi cacat) · **MISSING** (tidak ada sama sekali) · **UNVERIFIED** (tidak sempat diverifikasi)

### Master Data

| Entitas | C | R | U | D |
|---|---|---|---|---|
| **Customer** (`SalesLead`) | WORKS — form ada, `clientName` dikirim | WORKS — pag+search+filter+sort | WORKS — PATCH partial | **PARTIAL** — soft `status:'LOST'`, bukan hapus |
| **MaterialItem** | PARTIAL — form 13 field → payload 9 | PARTIAL — pag server hanya di `goods` | **PARTIAL** — `PUT` di `materials`, `PATCH` di `goods` | WORKS — soft `deletedAt` + `ARCHIVED` |
| **Supplier** | **PARTIAL** — 15 field → 8, `categoryId` selalu null | WORKS — pag+search+filter+sort | WORKS — PATCH partial | WORKS — soft `deletedAt` |
| **MasterCategory** | WORKS | WORKS | WORKS | WORKS — soft `isActive:false` |
| **Warehouse** | **PARTIAL** — 10 field → 6, `kodeGudang` dibuang | WORKS | WORKS — PATCH partial | WORKS — soft `status:'INACTIVE'` |
| **Division** | MISSING | WORKS — read-only | MISSING | MISSING |
| **Personnel / User** | WORKS | WORKS | WORKS | WORKS |
| **SalesCategory** | MISSING — hanya route redirect | WORKS | MISSING | MISSING |
| **SalesTarget** | MISSING | WORKS | MISSING | MISSING |
| **SystemConfig** | MISSING | WORKS | MISSING | MISSING |
| **WarehouseAccess** | MISSING | WORKS | MISSING | MISSING |

### HR

| Entitas | C | R | U | D |
|---|---|---|---|---|
| **Employee** | WORKS | WORKS | WORKS | **MISSING di UI** — endpoint ada, tombol tidak ada |
| **Attendance** | WORKS — clock in/out | WORKS | MISSING | MISSING |
| **Ticket** | WORKS | WORKS | **PARTIAL** — hanya `PATCH {status}` | **MISSING di UI** — endpoint ada |
| **Candidate** | WORKS | WORKS | **PARTIAL** — hanya `PATCH /stage` | **MISSING di UI** |
| **Training** | WORKS | PARTIAL — N+1 per employee | MISSING | MISSING |
| **Loan** | WORKS | WORKS | MISSING | MISSING |
| **KPI** | MISSING | WORKS | MISSING | MISSING |
| **Payroll** | WORKS — generate | WORKS | **PARTIAL** — hanya authorize | MISSING |

### Legality / Compliance

| Entitas | C | R | U | D |
|---|---|---|---|---|
| **HkiRecord** | WORKS | WORKS | **PARTIAL** — hanya `advance`, maju saja | MISSING |
| **BpomRecord** | WORKS | WORKS | **PARTIAL** — hanya `advance` | MISSING |
| **HalalRecord** | WORKS | WORKS | **PARTIAL** — hanya `advance` | MISSING |
| **RegulatoryPipeline** | WORKS | WORKS | WORKS | MISSING |
| **ArtworkReview** | WORKS | WORKS | WORKS | MISSING |
| **PNBPRequest** | WORKS | WORKS | **PARTIAL** — hanya `pnbp-pay` | MISSING |
| **InternalAudit** (CPKB) | WORKS | WORKS | **PARTIAL** — blind status setter | MISSING |
| **MasterInci** | WORKS | WORKS | WORKS | **WORKS** — hard delete |
| **LegalStaff** | MISSING | WORKS | MISSING | MISSING |
| **CorporatePermit** | MISSING | WORKS | **PARTIAL** — blind status setter | MISSING |

### QC

| Entitas | C | R | U | D |
|---|---|---|---|---|
| **QCAudit** | WORKS — 6 create | WORKS — 25 read | **MISSING** — 0 update repo-wide | **MISSING** |
| **QCChecklist** | WORKS | WORKS | WORKS | **MISSING di UI** |
| **QCChecklistMilestone** | MISSING | WORKS | WORKS | MISSING |
| **QcRelease** | WORKS | WORKS | MISSING | MISSING |
| **ApjRelease** | WORKS | WORKS | MISSING | MISSING |
| **Stability** | **PARTIAL** — tulis ke `/qc/audits`, baca dari `/rnd` | **PARTIAL** — schema didesain ulang | MISSING | MISSING |

### Legenda count

| | WORKS | PARTIAL | MISSING | UNVERIFIED |
|---|---|---|---|---|
| **Create** | 22 | 7 | 10 | 2 |
| **Read** | 33 | 4 | 0 | 4 |
| **Update** | 9 | 11 | 21 | 0 |
| **Delete** | 6 | 1 | 34 | 0 |

*(39 baris entitas × 4 operasi = 156 sel. Total tabel: 43+41+41+41 = 166 termasuk baris turunan.)*

---

## 2. Census Penomoran — yang sebenarnya

### 2.1 Tiga klaim brief: TERKONFIRMSI

| Lokasi | Kode | Status |
|---|---|---|
| `master/customers/_hooks/useCustomerOperations.ts:322` | `` customerCode: `CUST-${String(customersList.length + 1).padStart(3, "0")}` `` | ✅ **konfirmasi, tapi file mati** |
| `master/goods/_hooks/useGoodsOperations.ts:324` | `` kode: `BRG-${Date.now().toString().slice(-4)}` `` | ✅ **konfirmasi, tapi file mati** |
| `master/suppliers/_hooks/useSupplierOperations.ts:551` | `` kode: `SUP-CAT-${Date.now().toString().slice(-4)}` `` | ✅ **konfirmasi, tapi file mati** |

### 2.2 Yang benar-benar dirender

| Lokasi | Kode | Metode |
|---|---|---|
| `master/customers/page.tsx:432` | `` `CUST-${String(customersList.length + 1).padStart(3, "0")}` `` | `length + 1` |
| `master/goods/page.tsx:491` | `` `BBK${String(goodsList.length + 1).padStart(5, "0")}` `` | `length + 1` — **prefix `BBK`, bukan `BRG`** |
| `master/suppliers/page.tsx:405` | `` `VND-BBK-${String(suppliersList.length + 1).padStart(3, "0")}` `` | `length + 1` |
| `master/warehouses/page.tsx:443` | `` `GDG-0${warehousesList.length + 1}` `` | `length + 1`, **tanpa `padStart`** |

Backend juga punya fallback yang sama: `customers.service.ts:276`
`const resolvedBrandCode = brandCode || code || \`CUST-${Date.now().toString().slice(-4)}\`;`

### 2.3 Census total: **20 situs di `master/`**, 33 create-mint di seluruh scope

Command:
```bash
grep -rn '`[A-Z][A-Z0-9-]*${' "frontend/src/app/(dashboard)" --include=*.ts --include=*.tsx
```
di-filter ke `master|hr|quality|qc|legal|compliance|regulatory`.

- **50 total situs** template-literal di scope
- **20 di `master/`** — dari situ **9 adalah create-mint**, sisanya fallback tampilan
- Distribusi: `quality` 23, `master` 20, `hr` 7

Dua seinstrumen: pass pertama saya memakai regex struktural dan **melewatkan** `GDG-0${...}` (digit di antara dash dan `${`) serta `VND-BBK-${...}`. Angka di atas memakai pola permisif. Ini yang caused the "7 vs 98" phenomenon — pola yang terlalu ketat/report jumlah yang terlalu kecil.

### 2.4 Dampak per model — P2002 atau duplikasi senyap?

| Model | Kolom code | Constraint | Dampak tabrakan |
|---|---|---|---|
| `Customer` | `code` | `@unique` — `finance.prisma:275` | **P2002** — *tapi model ini tidak pernah dipakai* |
| `SalesLead` | `brandCode` | `@unique` — `bussdev.prisma:9` | **P2002** ← inilah yang sebenarnya dipakai |
| `MaterialItem` | `code` | `@unique` — `warehouse.prisma:61` | **P2002**, dan ada pre-check manual (`materials.service.ts:245-252`) |
| `MasterCategory` | `code` | `@unique` — `warehouse.prisma:345` | **P2002** |
| **`Supplier`** | **tidak ada** | **—** | **Duplikasi senyap: kolomnya tidak ada, kode FE dibuang** |

Tidak ada satu pun `P2002` handler di 4 modul ini. Repo(controllerly handle di 4 tempat lain. Konsekuensi: P2002 mentah naik ke user sebagai 500 tanpa pesan yang bisa dimengerti.

### 2.5 Pelanggaran kontrak

`docs/legacy-erp/contracts/04_BUSINESS_RULES.md:1555` — **BUS-RULE-102**:
> `nomor urut GLOBAL & BERKELANJUTAN (tidak reset per periode)`

`length + 1` melanggar ini secara langsung: menghapus satu baris membuat nomor berikutnya **menggunakan ulang nomor yang sudah dipakai**.

---

## 3. Temuan

### P0-1 — `Supplier` tidak punya kolom `code`; nomor yang di-mint FE dibuang diam-diam

`suppliers/page.tsx:405` menghitung `VND-BBK-001`. `supplier.dto.ts` tidak punya field `code` sama sekali (grep `code` → 0 hit). `suppliers.service.ts:105-120` `create()` hanya menulis 11 field, `code` tidak termasuk.

**Dampak:** tidak ada collision, tidak ada P2002 — karena nomornya tidak pernah disimpan. Setiap supplier punya `vendorCode` di UI yang **tidak ada di database**. Nomor yang "stabil selamanya" justru tidak ada sama sekali.

### P0-2 — Nomor master diturunkan dari `array.length`, menabrak BUS-RULE-102

`master/customers/page.tsx:432`, `master/goods/page.tsx:491`, `master/suppliers/page.tsx:405`, `master/warehouses/page.tsx:443`.

Hapus customer terakhir → array `length` turun → customer berikutnya dapat nomor yang **sudah dipakai**. Untuk `SalesLead.brandCode` (`@unique`, `bussdev.prisma:9`) ini jadi **P2002**; untuk `MasterCategory.code` juga P2002. Tidak ada handler, jadi user melihat 500.

`warehouses/page.tsx:443` lebih buruk lagi: `GDG-0${length+1}` tanpa `padStart` — mulai 9 baris lebarnya tidak konsisten (`GDG-010` berdampingan dengan `GDG-09`).

### P0-3 — `QCAudit` tidak punya update maupun delete sama sekali

Command: `grep -rni "qCAudit.update\|qCAudit.delete" backend/src` → **0 hit**.
Command: `grep -rhoni "qCAudit\.[a-zA-Z]*" backend/src | sed ... | sort | uniq -c` →
```
13 qCAudit.findMany   8 qCAudit.count   6 qCAudit.create   2 qCAudit.findUnique   2 qCAudit.findFirst
```

Klaim "6 create, 23 read, 0 update" **benar arahnya**; read sebenarnya **25** (13+8+2+2). `qc-audits.controller.ts` hanya punya 3 handler: `POST /` (:23), `GET /` (:29), `GET /:id` (:44).

**Dampak:** rekam hasil QC yang salah ukur atau salah klasifikasi defect **tidak bisa dikoreksi**. QA yang keliru mengukur pH Production tersimpan selamanya dan terbaca oleh `production-kpi.service.ts:277` dan `production-audit.service.ts:67` sebagai bukti.

### P0-4 — Penomoran `categories` yang benar ada di server, tapi FE melewatinya

`categories.service.ts:27-56` mengimplementasikan sequence yang benar:
```ts
const seqRow = await tx.masterKode.upsert({
  where: { documentType: docType },
  create: { documentType: docType, format: `${prefix}-{SEQ:4}`, currentSequence: 1 },
  update: { currentSequence: { increment: 1 } },
});
const generatedCode = `${prefix}-${seqRow.currentSequence.toString().padStart(4, '0')}`;
```
Ini persis yang BUS-RULE-102 minta. **Tapi** jalur ini hanya jalan kalau `dto.code` kosong (`categories.service.ts:28`), dan FE selalu mengirim code hasil minting-nya. `useCustomerOperations.ts:285` (mati) dan `goods/page.tsx` kategori selalu mengisinya.

**Pola yang benar sudah ada di repo dan tidak dipakai.** Ini bukan "belum ada generator" — generator-nya ada, di-bypass.

### P0-5 — 9 file `_hooks/` adalah kode mati yang menduplikasi logika bisnis

Command: untuk setiap file di `find "frontend/src/app/(dashboard)/{master,hr,quality}" -path "*_hooks*" -name "*.ts"`, hitung jumlah file yang mengimpornamanya di seluruh `frontend/src`.

```
0 refs  master/customers/_hooks/useCustomerOperations.ts
0 refs  master/goods/_hooks/useGoodsOperations.ts
0 refs  master/suppliers/_hooks/useSupplierOperations.ts
0 refs  master/warehouses/_hooks/useWarehouseOperations.ts
0 refs  hr/kpi/_hooks/useHrKpiOperations.ts
0 refs  hr/tickets/_hooks/useTicketsOperations.ts
0 refs  quality/apj-release/_hooks/useApjReleaseOperations.ts
0 refs  quality/checklist-tracking/_hooks/useQualityChecklistTrackingOperations.ts
0 refs  quality/qc-release/_hooks/useQcReleaseOperations.ts
0 refs  quality/stability/_hooks/useStabilityOperations.ts
0 refs  quality/workbench/_hooks/useQualityWorkbenchOperations.ts
```

Konfirmasi: `grep -n "_hooks/\|useCustomerOperations" "frontend/src/app/(dashboard)/master/customers/page.tsx"` → **0 hit**. `page.tsx` mengimplementasikan sendiri `useState` + `api.*`.

**Yang paling berbahaya:** `useWarehouseOperations.ts:358` memakai **PUT**, sedangkan `warehouses/page.tsx:158` memakai **PATCH**. Dua kontrak HTTP berbeda untuk entitas yang sama, tanpa test yang mengikat salah satunya. `useQualityChecklistTrackingOperations.ts:25` memanggil `/qc/checklists/completed` sementara page hidup memanggil `/project-tracking`.

Ini juga melanggar CLAUDE.md §2: `page.tsx` < 120 baris (hard 150). Kenyataannya: `customers` 1082, `goods` 1180, `suppliers` 1127, `warehouses` 1111 — **7–9× lipat** dari batas keras.

### P0-6 — `quality/stability` menulis ke satu collection, membaca dari collection lain

`quality/stability/page.tsx`:
- `:87` → `api.get("/rnd/lab-test-results", { params: { type: "stability" } })`
- `:106` → `api.post("/qc/audits", payload)`
- `:124` → `api.post("/qc/audits", payload)` (body identik dengan `:106`)

Study yang dibuat tidak pernah muncul di list, karena listnya baca `/rnd/lab-test-results` sementara create-nya nulis ke `QCAudit`. State `localStudies` (`:63`) dideklarasikan tapi tidak pernah diisi.

Ditambah mapper `:89-100` mengarang `chamber: "A"`, `interval: "1M"`, `nextTest: now+30d`, `results: []` — nilai yang tidak dikembalikan endpoint tersebut.

### P1-1 — 47 endpoint tanpa `@Roles`

Dari 184 handler di 17 controller dalam scope, **47 tidak punya `@Roles`**. Termasuk:
- `master/controllers/customers.controller.ts` — **seluruh 9 endpoint**, termasuk `POST /import` (:57) dan `DELETE /:id` (:109)
- `master/controllers/suppliers.controller.ts` — 8/8
- `master/controllers/materials.controller.ts` — 12/12
- `master/controllers/categories.controller.ts` — 7/7
- `hr/hr.controller.ts` — 34/38, termasuk `POST /employees` (:35), `PATCH /employees/:id` (:53), `DELETE /employees/:id` (:59), `POST /payroll/generate` (:327), `POST /payroll/authorize/:id` (:342)

Bandingkan `warehouses.controller.ts:43-81` yang seluruhnya ber-`@Roles`, dan seluruh `legality` yang konsisten. Jadi ini regresi per-modul, bukan keputusan desain.

`personnel.service.ts:75-84` dan `import-export.service.ts:105-125` memang punya `PERMISSION_DENY_DEFAULT` di service — jadi sebagian terlindungi, tapi `customers`/`suppliers`/`materials`/`categories` tidak punya guard sama sekali.

### P1-2 — `updateStatus`/`updatePermitStatus` adalah blind setter

`legality/audits/audits.service.ts:66-72`:
```ts
async updateStatus(id: string, status: string) {
  await this.findOne(id);
  return this.prisma.internalAudit.update({ where: { id }, data: { status } });
}
```
`status` datang dari `@Body('status')` (`audits.controller.ts:61`) bertipe `string` — tidak ada `@IsEnum`, tidak ada whitelist..skema `InternalAudit.status` adalah `String @default("PENDING")` (`legal.prisma:76`), jadi **database pun tidak membatasi**.

`legality.service.ts:330-348` (`updatePermitStatus`) sama: `data: { status: status as any }`. Cast `as any` menghapus satu-satunya opportunity kompilasi untuk menangkap ini.

Keduanya **punya** `@Roles` (`audits.controller.ts:60`, `legality.controller.ts:221`) — jadi otorisasi ada, validasinya tidak.

### P1-3 — Tidak ada optimistic concurrency di mana pun

Command: `grep -rniE "\bversion\b|If-Match|expectedUpdatedAt|lockVersion" backend/src/modules/{master,hr,legality,qc}` → semua hit adalah `orderBy`/`select` pada `updatedAt`, atau `artworkVersion` yang tidak relevan. Tidak ada field `version` di 4 file prisma scope.

FE: `grep -rl "If-Match|expectedVersion|isDirty|hasChanges|beforeunload"` di 5 tree → **0 hit**.

Semua update last-write-wins. Dua admin mengedit customer yang sama → yang kedua menimpa tanpaático.

### P1-4 — Status legal tidak bisa merepresentasikan kedaluwarsa atau pencabutan

`backend/prisma/schema/enums.prisma:386-390`:
```
enum LegalStatus { IN_PROGRESS  DONE  REJECTED }
```
Tidak ada `EXPIRED`, tidak ada `REVOKED`, tidak ada `SUSPENDED`.

`HkiRecord`/`BpomRecord`/`HalalRecord` (`legal.prisma`) punya kolom `expiryDate DateTime?` — **disimpan, tidak dihitung**. `legality.service.ts:391-410` (`getExpiryData`) menghitung `daysLeft` saat read, jadi hanyaBobot tampilan.

`legality-hki.service.ts:53-82` (`advanceHkiStage`) hanya maju dalam urutan `DRAFT → SUBMITTED → EVALUATION → REVISION → PUBLISHED`, dan melempar `legality-already-completed` kalau `status === DONE`. **Tidak ada jalur mundur dan tidak ada pembatalan.** Sertifikat halal yang dicabut karena temuan audit tidak punya representasi di model ini.

### P1-5 — 6 dari 7 tombol "export" hanya memunculkan toast

`master/customers/page.tsx:1049`:
```tsx
onClick={() => toast.success(`Portofolio mitra ${selectedCustomer?.brandName} berhasil diekspor!`)}
```
Tidak ada `Blob`, tidak ada `createObjectURL`. Backend punya endpoint export yang berfungsi: `customers.controller.ts:46`, `suppliers.controller.ts:42`, `materials.controller.ts:47`, `categories.controller.ts:41` — **tidak pernah dipanggil UI**.

Hanya `suppliers/page.tsx:500-504` (template CSV) yang benar-benar mengunduh file.

### P1-6 — Hapus tidak ada di 34 dari 39 entitas, dan untuk domain regulated itu keliru

Command: `grep -rnE "api\.delete" "frontend/src/app/(dashboard)/{master,hr,quality}"` → sangat sedikit; di HR **nol**.

Backend punya delete yang tidak ada tombolnya:
- `hr.controller.ts:59` `DELETE /hr/employees/:id` → `hr-employee.service.ts:149-161` soft delete (`isActive:false`, `resignReason:'SYSTEM_DELETED'`) — **tombolnya tidak ada**
- `tickets.controller.ts:48` `DELETE /:id` → `tickets.service.ts:56-59` **hard delete** pada tabel ticket

Yang justru ada delete tapi salah bentuknya: `legality-bpom.service.ts:661-663`
```ts
async deleteMasterInci(id: string) {
  return this.prisma.masterInci.delete({ where: { id } });
}
```
`MasterInci` = daftar bahan regulated (`inciName`/`casNumber`/`category: ALLOWED|PROHIBITED`). **Hard delete** pada register regulatory berarti nilai yang pernah dipakai di keputusan formula hilang jejaknya. Tidak ada arsip, tidak ada audit.

### P1-7 — `customers.service.ts` mengarang field yang tidak ada di database

`customers.service.ts:117` (dalam `findOne`):
```ts
sampleFeeTotal: soSampleCount * 750000,
```
Angka 750000 **hardcoded**. `status` dipetakan `lead.status === 'WON_DEAL' ? 'ACTIVE' : ...` (`:122`) — jadi status customer bukan status asli, tapi turunan dari `WorkflowStatus` lead. FE menerima `status: "ACTIVE"` lalu mengirimkannya balik di PATCH, dan `customers.service.ts:290` menyimpannya `data: { status: (dto.status as any) || 'NEW_LEAD' }` ke enum `WorkflowStatus` yang **nilai "ACTIVE" tidak ada**. Round-trip ini merusak data.

### P1-8 — Pagination sisi-klien di 3 dari 4 halaman master besar

`master/customers/page.tsx:392-398`:
```ts
const totalPages = Math.ceil(totalEntries / pageSize) || 1;
const paginatedCustomers = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredCustomers.slice(start, start + pageSize);
}, [filteredCustomers, currentPage, pageSize]);
```
Pola sama di `suppliers/page.tsx` dan `warehouses/page.tsx`. Hanya `goods/page.tsx:165-166` mengirim `page`/`limit` ke server. Ketiga halaman lain menarik seluruh tabel ke memori dulu.

### P1-9 — 11 drawer/modal detail tidak pernah mengambil data sendiri

Command: untuk setiap `*Drawer*.tsx` / `*Detail*.tsx` di scope, grep `useQuery|api.get|axios.|fetch(`.

```
NO-FETCH: master/customers/_components/CustomerDetailDrawer.tsx
NO-FETCH: master/goods/_components/GoodsDetailDrawer.tsx
NO-FETCH: master/suppliers/_components/SupplierDetailDrawer.tsx
NO-FETCH: master/warehouses/_components/WarehouseDetailDrawer.tsx
NO-FETCH: hr/kpi/_components/HrKpiDetailDrawer.tsx
NO-FETCH: hr/tickets/_components/TicketsDetailDrawer.tsx
NO-FETCH: approvals/artwork-approval/_components/ArtworkApprovalDetailDrawer.tsx
NO-FETCH: quality/checklist/_components/ChecklistDetailModal.tsx
NO-FETCH: quality/checklist-tracking/_components/DetailChecklistModal.tsx
NO-FETCH: quality/checklist-tracking/_components/QualityChecklistTrackingDetailDrawer.tsx
NO-FETCH: quality/coa/_components/CoaDetailDrawer.tsx
NO-FETCH: quality/karantina/_components/KarantinaDetailModal.tsx
NO-FETCH: quality/lab-test/_components/LabTestDetailDrawer.tsx
NO-FETCH: quality/qc-release/_components/QcReleaseDetailDrawer.tsx
```

Klaim "repo-wide 0" **terkonfirmasi untuk scope ini**. Semuanya menerima props dari list query. Tidak ada satu pun direktori `[id]` di scope, jadi **tidak ada entitas pun yang punya URL per-record** — deep-link dan refresh selalu kehilangan konteks.

### P2-1 — State form jauh melampaui payload

`master/customers/page.tsx:431-456` `setCustomerForm` mengisi **25 key**; `:181-191` mengirim **7**. `CustomerCreateCanvas.tsx` hanya merender 7 input. 18 field dikumpulkan lalu dibuang.

Pola sama: Supplier 15→8, Warehouse 10→6, Goods 13→9.

`suppliers/page.tsx:162-175` di tengah jawaban (`categoryId`) punya komentar `ponytail:` yang jujur: label "Bahan Baku" akan 400 di `@IsUUID`, jadi kategori **selalu null** di database. Utang yang diketahui, belum dibayar.

### P2-2 — Kegagalan endpoint ditelan jadi render kosong

`hr/HRDashboardClient.tsx:176-181`:
```ts
api.get("/dashboards/hr").then(res => res).catch(() => api.get("/hr/executive-summary")),
...
api.get("/hr/candidates").catch(() => ({ data: [] })),
```
500 di `/dashboards/hr` tidak bisa dibedakan dari "tidak ada data" — halaman merender nol statistik tanpa error. Pola sama di `useEmployeeOperations.ts:22,54`, `usePayrollOperations.ts:20`, `legality/dashboard/page.tsx:23-35`.

### P2-3 — `master/automation` merender data yang tidak ada di belakangnya

`master/automation/page.tsx:35` merender `AUTOMATIONS: DivisionGroup[]` hardcoded. Komentar `:18-20` admit sendiri ini roadmap. Tidak ada service yang menghasilkannya.

### P2-4 — Halaman "stub" sebenarnya redirect, bukan dead end

`master/categories/page.tsx` (22L) → `/master/goods?tab=categories`; `master/vendors/page.tsx` (22L) → `/master/suppliers`; `master/users/page.tsx` (6L) → `/master/personnel?tab=users`; `master/sales-category/page.tsx` (19L) → `/penjualan/sales-target?tab=categories`; `master/dna-visual/page.tsx` (6L) → `/visual-dna`.

Tidak ada entitas yatim. Tapi `master/divisions` dan `master/sales-targets` memang **tidak punya halaman sama sekali** padahal controller-nya lengkap — `divisions.controller.ts` hanya 2 endpoint read, `sales-targets.controller.ts` punya 11 (CRUD penuh) yang tidak punya FE.

### P2-5 — `updatedAt` dipalsukan di sisi klien

`quality/checklist-tracking/page.tsx:121` menulis `new Date().toLocaleString("id-ID")` ke field `updatedAt` pada objek record. Field itu lalu ditampilkan seolah-olah waktu simpan server. Log audit yang Sommer di_FE tidak dapat dipercaya sebagai bukti urutan waktu — dan `02_DATA_OWNERSHIP.yaml:975` justru menuntut presisi "Fakta ini disimpan, tidak disimpulkan dari urutan waktu" untuk artwork review.

### P2-6 — `/hr/dashboard` adalah duplikat fosil `/hr`

Keduanya render `HRDashboardClient` (`hr/dashboard/page.tsx:14`, `hr/page.tsx:14`); hanya string `title`/`subtitle` berbeda. `docs/ROUTE_MAP.md:105` hanya mendokumentasikan `/hr/dashboard` — jadi yang **tidak** terdokumentasi adalah target nav yang hidup. Melanggar CLAUDE.md §4 (zero dead code + ROUTE_MAP sinkron).

---

## 4. Pelanggaran kontrak

| Aturan | Lokasi | Pelanggaran |
|---|---|---|
| **BUS-RULE-102** — nomor urut global & berkelanjutan | `04_BUSINESS_RULES.md:1555` | `length + 1` di 4 halaman master + fallback `Date.now().slice(-4)` di `customers.service.ts:276` |
| **Soft-delete + audit pada semua write** | `02_DATA_OWNERSHIP.yaml:27` | `MasterInci` hard delete (`legality-bpom.service.ts:662`); `Ticket` hard delete (`tickets.service.ts:58`); `SalesTarget`/`SalesCategory` hard delete (`sales-targets.service.ts:152,207`) |
| **Never deleted** | `02_DATA_OWNERSHIP.yaml:661` (`deletable_by: []`) | 3 hard delete di `master` + 1 di `legality` + 1 di `hr` |
| **Customer = entitas BUSDEV** | `02_DATA_OWNERSHIP.yaml:120,1368-1369` | Implementasi memakai `SalesLead` (`customers.service.ts` — 8× `salesLead`, 0× `prisma.customer`). Model `Customer` di `finance.prisma:273` **tidak pernah disentuh** satu pun |

Catatan terakhir: ini **konsisten** dengan memori proyek "Customer dan SalesLead adalah dua entitas" — jadi saya laporkan sebagai temuan konfirmasi, bukan usulan untuk menggabungkan. Yang bermasalah adalah FE menamai endpoint `/master/customers` sementara isinya `SalesLead`, sehingga nomor yang dimint (`CUST-`) sebenarnya mengisi `brandCode` — kolom dengan semantik berbeda.

---

## 5. Yang TIDAK bisa diverifikasi

| Klaim | Mengapa tidak terverifikasi |
|---|---|
| Apakah P2002 benar-benar muncul di UI | Butuh DB berjalan dengan data duplikat. Analisis statis: constraint ada, handler tidak ada → 500 mentah. **Inferensi, bukan terverifikasi.** |
| Verdict `quality/*` selain 8 route yang diperiksa | Subagent kedua covering `quality`keluar sebelum 5 route selesai; sisanya saya tandai UNVERIFIED, bukan ditebak |
| `legality/input`, `legality/permits`, `legality/records` — daftar field DTO vs form | Diverifikasi endpoint-nya ada; **selisih field per-field tidak dihitung** |
| Apakah ada mutasi tersembunyi via `api.patch` generik atau barrel export | Grep `api.*` di file `page.tsx` langsung; barrel `_hooks/index.ts` (68 refs) hanya di-parse di satu jalur |
| `Attendance` update/delete | Endpoint memang tidak ada di `hr.controller.ts` (verified), tapi service-nya mungkin punya operasi lain yang tidak dipetakan controller |
| Perilaku `master/personnel` (958L `PersonnelRegistry`) | Diverifikasi ada POST/PATCH/DELETE; **selisih field DTO vs form tidak dihitung** |
| Efek nyata `GDG-0${...}` mulai 9 baris | Lucius: index 9 → `GDG-010`, index 99 → `GDG-0100`. **Bentrokan lebar bukan bentrokan nilai** — jadi dampaknya format, bukan duplikasi. Prioritas lebih rendah dari yang saya tulis di P0-2. |
| Apakah string endpoint FE benar-benar cocok dengan handler backend | Diverifikasi setiap string endpoint *resolve* ke sebuah file controller. **Verb + path + `:id` tidak dicocokkan satu per satu** — substring matcher. Jadi "halaman ini memanggil endpoint yang tidak ada" belum dibuktikan untuk route mana pun. |
| Pagination di route selain 2 yang diaudit | Hanya `checklist-progress` dan `checklist` yang diperiksa mendetail. Klaim "tidak ada pagination server-side" di dokumen ini berlaku untuk master/HR/legality yang saya hitung sendiri, **bukan** untuk 30 route FE yang diaudit subagent. |
| Apakah `quality/coa` memakai hook COA milik finance | Hanya dari daftar importer. **Inferensi, tidak dikonfirmasi.** |

---

## Metodologi

Semua klaim di dokumen ini berasal dari perintah berikut:

```bash
# Verifikasi 3 klaim penomoran
sed -n '300,345p' "frontend/src/app/(dashboard)/master/customers/_hooks/useCustomerOperations.ts"
sed -n '305,345p' "frontend/src/app/(dashboard)/master/goods/_hooks/useGoodsOperations.ts"
sed -n '530,575p' "frontend/src/app/(dashboard)/master/suppliers/_hooks/useSupplierOperations.ts"

# Census penomoran (pola permisif)
grep -rn '`[A-Z][A-Z0-9-]*${' "frontend/src/app/(dashboard)" --include=*.ts --include=*.tsx

# Liveness hook
for f in $(find "frontend/src/app/(dashboard)/{master,hr,quality}" -path "*_hooks*" -name "*.ts"); do
  echo "$(grep -rl "$(basename $f .ts)" frontend/src | grep -v "$f" | wc -l) $f"; done

# Census endpoint
for f in $(find backend/src/modules/{master,hr,legality,qc} -name "*controller*.ts"); do
  grep -nE "^\s*@(Get|Post|Patch|Put|Delete)" "$f"; done

# Constraint
grep -n -A 30 "^model Supplier {" backend/prisma/schema/warehouse.prisma
grep -n -A 12 "enum LegalStatus" backend/prisma/schema/enums.prisma

# QCAudit
grep -rhoni "qCAudit\.[a-zA-Z]*" backend/src --include=*.ts | sed -E 's/.*(qCAudit\.[a-zA-Z]+).*/\1/' | sort | uniq -c

# Drawer
for f in $(find "frontend/src/app/(dashboard)" -iname "*Drawer*.tsx" -o -iname "*Detail*.tsx"); do
  grep -qE "useQuery|api\.(get|getOne)|axios\.|fetch\(" "$f" || echo "NO-FETCH: $f"; done
```

**Koreksi terhadap brief ini:** angka "7 situs" dan "23 read" tidak dapat direproduksi. Angka 7 terlalu rendah untuk setiap pola grep yang saya coba; 23-read adalah arah yang benar tapi angka sebenarnya 25. Klaim "6 creates" untuk QCAudit tepat.
