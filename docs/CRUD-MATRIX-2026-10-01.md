# Fase 0 — Matriks CRUD × Entitas

**Tanggal:** 2026-10-01
**Dasar:** `backend/prisma/schema/*.prisma` (25 file, 212 model, 93 enum) · 113 controller / 947 endpoint · 275 page FE / 1536 file FE
**Metode:** census delegate call `prisma.<accessor>.<op>` di seluruh `.service.ts` + scan nama model di `.tsx/.ts` FE

> **Koreksi 2026-10-01 (post Batch F).** Kolom Pg/Dr di baris `Approval` semula tertulis 41/22. Itu artefak name-scan: kata "approval" cocok longgar. Angka sebenarnya **11 page** (seluruhnya di `approvals/`: artwork-approval, finance-approvals, goods-request, purchase, purchase-approval, purchase-request, purchase-return, request-cogs, sales, sales-return, sales-sample) dan **7 drawer/modal**. Sel kolom Pg/Dr lain yang berasal dari scan nama longgar suspect serupa dan harus dikonfirmasi per entitas di batch-nya — bukan diambil apa adanya.

---

## 1. Klasifikasi model

| Kelas | Jumlah | Kriteria |
|:---|---:|:---|
| ENT | 193 | punya scalar field, bukan log/sequence |
| LOG | 18 | nama berakhir `Log`/`History`/`Activity`/`Snapshot` |
| JUNC | 4 | 0 scalar, ≥2 relasi |
| SEQ | 1 | `SystemSequence` |
| INTERNAL | — | `@@ignore` / prefiks `_` |

**193 entitas = 173 tersentuh (service atau page) + 20 matitotal.**

> Catatan: run klasifikasi awal memberi 163 ENT. Selisihnya ~30 model berasal dari aturan JUNC (`scalars===0 && rels>=2`) yang terlalu ketat — model dengan 1 scalar engagement ikut terbuang. Angka 193 yang dipakai di bawah; matriks ini yang dipakai untuk Fase 1–6.

---

## 2. Endpoint census (source of truth: decorator)

113 controller, 947 endpoint:

| Verb | Jumlah |
|:---|---:|
| POST | 317 |
| GET | 496 |
| PUT+PATCH | 99 |
| **DELETE** | **35** |

Rasio U:C = 99:317. Read 1.5× write. Pola aplikasi-CRUD, bukan sistem-transaksional.

---

## 3. Matriks utama

`**n**` = jumlah delegate call. `·` = nol. Kolom Pg/Dr = file FE `page.tsx` / `*Drawer|*Detail|*Modal`.

| Entitas | Skema | svc | C | R | U | D | Pg | Dr |
|:--|:--|--:|--:|--:|--:|--:|--:|--:|
| User | auth:1 | 32 | **2** | **53** | **4** | · | 52 | 19 |
| SalesLead | bussdev:1 | 27 | **4** | **126** | **18** | **1** | 1 | · |
| MaterialItem | warehouse:46 | 26 | **3** | **43** | **25** | · | 1 | · |
| Formula | rnd:85 | 8 | **2** | **19** | **6** | · | 51 | 37 |
| Account | finance:35 | 20 | **8** | **73** | **2** | · | 30 | 31 |
| WorkOrder | production:89 | 22 | **2** | **42** | **10** | · | 22 | 6 |
| Invoice | finance:1 | 16 | **10** | **40** | **10** | · | 29 | 18 |
| SampleRequest | rnd:12 | 11 | **9** | **39** | **13** | · | 3 | 1 |
| LeadCapture | marketing:4 | 6 | **7** | **41** | **19** | **1** | 1 | · |
| MaterialInventory | warehouse:386 | 20 | **6** | **35** | **11** | · | · | · |
| ProductionPlan | production:1 | 13 | **3** | **28** | **7** | **1** | 2 | · |
| SalesOrder | bussdev:168 | 27 | **5** | **28** | **16** | · | 24 | 17 |
| Supplier | warehouse:131 | 13 | **7** | **22** | **3** | · | 31 | 25 |
| Warehouse | warehouse:1 | 8 | **3** | **11** | **3** | · | 47 | 37 |
| Customer | finance:273 | 5 | · | **5** | · | · | 43 | 39 |
| Payment | finance:187 | 5 | **5** | **2** | · | · | 21 | 21 |
| JournalEntry | finance:106 | 19 | **28** | **6** | · | · | · | · |
| InventoryTransaction | warehouse:359 | 11 | **14** | **10** | · | · | · | · |
| DocumentDraft | document-automation:1 | 1 | **7** | **15** | **7** | · | 1 | · |
| Bill | finance-extension:25 | 7 | **2** | **16** | **7** | · | 13 | 7 |
| PurchaseOrder | warehouse:202 | 11 | **4** | **16** | **3** | · | 4 | 2 |
| Notification | system:55 | 4 | **5** | **10** | **4** | · | 10 | · |
| PurchaseRequest | warehouse:164 | 4 | **3** | **6** | **6** | · | 3 | 2 |
| SalesInvoice | finance:297 | 5 | **2** | **13** | **5** | · | · | 1 |
| Approval | platform-controls:90 | 2 | **1** | **3** | **1** | · | 11 | 7 |
| DeliveryOrder | production:230 | 5 | **2** | **6** | · | · | 3 | 4 |
| QCAudit | qc:2 | 10 | **6** | **23** | · | · | 3 | · |
| WarehouseInbound | warehouse:268 | 6 | **2** | **10** | **4** | · | · | · |
| DownPayment | finance-extension:96 | 4 | **3** | **10** | **4** | · | 1 | 1 |
| BankAccount | finance-extension:164 | 6 | **1** | **10** | **6** | · | 5 | 5 |
| Employee | hr:1 | 5 | **1** | **24** | **3** | · | 6 | 5 |
| Machine | production:129 | 5 | **1** | **6** | **3** | · | 11 | 14 |
| Currency | finance:241 | 0 | · | · | · | · | 29 | 11 |
| MaterialRequisition | production:32 | 6 | **4** | **7** | **4** | · | 2 | 3 |
| Ticket | hr:145 | 5 | **2** | **10** | **3** | **1** | 2 | 3 |
| Payroll | hr:165 | 2 | **1** | **5** | **1** | · | 5 | 7 |
| DownPayment→FundRequest | finance:206 | 3 | **2** | **8** | **5** | · | 3 | 2 |
| SampleFee | finance:364 | 2 | **1** | **6** | **3** | · | 3 | 2 |
| PurchaseReturn | warehouse:285 | 1 | **1** | **4** | **2** | · | 3 | 1 |
| GoodsRequirement | scm:1 | 3 | **2** | **5** | **1** | · | 1 | · |
| Shipment | production:246 | 2 | **1** | **3** | **1** | · | 3 | · |
| TaskItem | system:120 | 1 | **1** | **4** | **2** | **2** | 2 | · |
| TaskBoard | system:107 | 1 | **1** | **4** | **1** | **1** | 1 | · |
| SalesCategory | bussdev:297 | 1 | **2** | **1** | **1** | **1** | 3 | 2 |
| SalesTarget | system:13 | 1 | **1** | **2** | **1** | **1** | 1 | 4 |
| BankReconciliation | finance-extension:211 | 1 | **1** | **5** | **2** | · | 1 | · |
| PeriodLock | finance:468 | 1 | **1** | **5** | **1** | · | 1 | · |
| TaxRate | finance:226 | 2 | **1** | **3** | **1** | · | 4 | · |
| StockOpname | warehouse:443 | 2 | **1** | **3** | **3** | · | 2 | · |
| TransferOrder | warehouse:415 | 1 | **1** | **3** | **1** | · | · | · |
| MasterCategory | warehouse:343 | 3 | **3** | **5** | **2** | · | · | · |
| SystemConfig | system:28 | 3 | **2** | **6** | · | · | · | · |
| FixedAsset | finance:379 | 4 | **1** | **11** | **4** | · | · | · |
| JournalLine | finance:162 | 4 | · | **9** | · | · | 1 | 1 |
| FinancialPeriod | finance:65 | 5 | · | **8** | · | · | · | · |
| CrmLead | crm:14 | 2 | · | **10** | **3** | · | · | · |
| HkiRecord / BpomRecord / HalalRecord | legal | 3 | **1** | **7–9** | **3** | · | · | · |
| RegulatoryPipeline | legal:92 | 3 | **1** | **11** | **1** | · | 1 | · |
| ArtworkReview | legal:122 | 1 | **1** | · | · | · | 1 | · |
| PNBPRequest | legal:140 | 1 | **1** | **1** | **1** | · | · | · |
| MasterInci | legal:157 | 1 | **2** | **3** | **2** | **1** | · | · |
| InternalAudit | legal:77 | 1 | **1** | **2** | **3** | · | · | · |
| SalesReturn | bussdev:225 | 1 | **1** | **2** | **2** | · | 3 | 2 |
| DesignTask | creative:1 | 4 | **2** | **13** | **6** | · | 2 | 5 |
| Attendance | hr:128 | 3 | **1** | **6** | **1** | · | · | · |
| EmployeeTraining / EmployeeLoan | hr | 1–2 | **1** | **1–2** | **1** | · | · | 1 |
| Candidate | hr:208 | 1 | **1** | **3** | **1** | · | · | 1 |
| ProductionSchedule | production:152 | 7 | **1** | **17** | **3** | · | 2 | 4 |
| FinishedGood | production:79 | 5 | **3** | **4** | **2** | · | 1 | · |
| QCChecklist | qc:91 | 1 | **2** | **6** | **2** | · | 1 | · |
| QCParameter | qc:61 | 3 | **2** | **1** | · | · | 1 | · |
| COPQRecord | qc:114 | 4 | **3** | **1** | · | · | · | · |
| LeadMessage | marketing:144 | 5 | **5** | **10** | · | · | 1 | 1 |
| LeadAttribute | marketing:164 | 3 | **2** | **6** | **1** | · | · | · |
| RoundRobinAgent | marketing:184 | 3 | **2** | **4** | **3** | **1** | · | · |
| ContentAsset | marketing:320 | 4 | **1** | **7** | · | · | · | · |
| DailyAdsMetric | marketing:281 | 3 | **1** | **11** | **2** | **1** | · | · |
| LandingPageVisit | website:29 | 1 | **1** | **8** | · | · | · | · |
| LandingPageConversion | website:48 | 1 | **1** | **3** | **1** | **2** | · | · |
| Media/Asset/Report (marketing sub) | marketing | 1 | **1** | **1–2** | · | · | · | · |

*(Baris bertanda `·` di kolom C/R/U/D berarti entitas itu **tidak punya operasi itu sama sekali** di service mana pun.)*

---

## 4. Temuan utama: D (Delete) kosong

**24 dari 173 entitas punya delete. 149 tidak punya.**

Seleksi entitas yang **punya** delete — semuanya kecil/administratif:

`SalesLead 1 · SalesCategory 1 · BillLineItem 1 · CommunicationThreadReply 1 · EmployeeRoleMapping 1 · Ticket 1 · MasterInci 1 · LeadCapture 1 · RoundRobinAgent 1 · MarketingTask 1 · DailyAdsMetric 1 · MarketingTaskAttachment 1 · MarketingTaskComment 1 · WarehouseAccess 1 · AutoJournalConfig 2 · LandingPageConversion 2 · TaskItem 2 · AssetDisposal 1 · FormulaPhase 1 · FormulaItem 1 · SalesTarget 1 · TaskBoard 1`

**Tidak satu pun entitas dokumen-inti punya delete:**

| Entitas | C | R | U | D |
|:---|--:|--:|--:|--:|
| SalesOrder | 5 | 28 | 16 | **0** |
| PurchaseOrder | 4 | 16 | 3 | **0** |
| Invoice | 10 | 40 | 10 | **0** |
| SalesInvoice | 2 | 13 | 5 | **0** |
| WorkOrder | 2 | 42 | 10 | **0** |
| ProductionPlan | 3 | 28 | 7 | **0** |
| SampleRequest | 9 | 39 | 13 | **0** |
| MaterialItem | 3 | 43 | 25 | **0** |
| Warehouse | 3 | 11 | 3 | **0** |
| Customer | 0 | 5 | 0 | **0** |
| Supplier | 7 | 22 | 3 | **0** |
| Bill | 2 | 16 | 7 | **0** |
| JournalEntry | 28 | 6 | 0 | **0** |

`Customer` berdiri sendiri: **0 create, 0 update, 0 delete** di service. 43 page + 39 drawer menyajikannya. Data customer kemungkinan ditulis lewat modul lain.

### 79 entitas tanpa UPDATE

Termasuk `Customer` (0), `Payment` (0), `JournalEntry` (0), `QCAudit` (0), `FinancialPeriod` (0), `CrmLead` punya 3 tapi create 0, `ContentAsset` (0), `MarketingProject` (0), `InventoryTransaction` (0), `WarehouseLocation` (0).

### 20 entitas mati total (nol di service, nol di FE)

`StockAdjustmentItem · SocialPost · SocialChecklistItem · SocialPostMedia · MarketingChannelFunnel · MetaAccountConfig · MfaChallenge · CommunicationPolicy · MaterialReturn · ShipmentItem · MaterialRequisitionItem · RndStaff · BillOfMaterial · AutoApproveConfig · PurchaseRequestItem · TransferOrderItem · StockOpnameItem · EmergencyPurchaseRequest · Article · WebsiteProduct`

`SocialPost` dan `Article` punya halaman FE tapi nol delegate call — UI-nya baca dari sumber lain (mock, API eksternal, atau tabel yang salah). `BillOfMaterial` dan `RndStaff` nol total — BOM tidak pernah dipakai.

---

## 5. Batasan matriks ini (wajib dibaca sebelum Fase 1)

1. **D=0 belum tentu berarti tidak bisa hapus.** Matriks ini menghitung `prisma.<acc>.delete()`. Soft delete (set `isActive=false` / `deletedAt`) tidak terlihat di sini. **Fase 4 wajib cek flag soft-delete di Prisma schema** sebelum menyimpulkan.
2. **C=0 belum tentu berarti tidak bisa buat.** `createMany`via `createManyAndReturn`, raw query, atau `$executeRaw` tidak terhitung. Angka Invoice C=10 vs 29 page tetap perlu verifikasi manual.
3. **Colom Pg/Dr berbasis nama string, bukan import.** False positive mungkin (kata `currency`/`payment` muncul tanpa menyentuh model itu). Sudah dipangkas: halaman yang hanya match nama umum tidak dihitung sebagai Confirm. Fase 1 wajib konfirmasi per entitas.
4. **Endpoint `@Delete` yang ada tapi tidak uninstall** (alias update) tidak terhitung. 35 angka DELETE itu upper bound kasar.

---

## 6. Pembagian batch untuk Fase 1–6

173 entitas, dibagi per entitas (bukan per operasi) supaya nol overlap:

| Batch | Entitas | sheer | Alasan |
|:---|:---|--:|:---|
| **A** | bussdev (13) + rnd (9) + creative (6) | 28 | Pipeline sales + R&D, tempat BUS-RULE-107 |
| **B** | warehouse (23) + scm (2) + production (18) | 43 | Supply chain, paling banyak inti transaksi |
| **C** | finance (40) + finance-extension (12) | 52 |(GL, AP/AR, aset, pajak, closing |
| **D** | master-extension (4) + hr (12) + legal (10) + qc (6) | 32 | Master data + HR + compliance |
| **E** | marketing (28) + website (2) + crm (3) + communication (4) + self-qr (3) | 40 | Marketing — surface terbesar, kompleksitas terendah |
| **F** | system (7) + platform-controls (9) + activity-log + auth + documents | 20 | Platform, tenant, approval, auth |

Total 215 termasuk child/line-item. Batch E dan F bisa digabung kalau context agent jadi ketat.
