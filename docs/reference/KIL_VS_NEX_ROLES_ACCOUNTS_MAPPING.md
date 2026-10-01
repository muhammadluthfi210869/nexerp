# Acuan Kanonik: Pemetaan Akun, Role, dan Hak Akses Halaman KIL ERP vs NEX ERP

> **Status Dokumen:** Canonical Reference & Single Source of Truth (SSoT)  
> **Sumber Otentikasi Live:** `https://kil.gserp.id`  
> **Waktu Ekstraksi Live:** 2026-09-30 23:25:00 WIB  
> **Kredensial Penarik:** `zaki@dreamlab.id` (via `.env`)  
> **Penyelarasan Sistem:** Disesuaikan dengan arsitektur route NEX ERP (`docs/ROUTE_MAP.md`) dan Prisma enum `UserRole` (`backend/prisma/schema/enums.prisma`).

---

## 1. Ringkasan Ekstraksi & Penyelarasan

Dari hasil penarikan langsung (*live crawling & authentication*) terhadap sistem KIL ERP:
- **Total Akun Pengguna:** **45 Akun** aktif.
- **Total Master Role KIL:** **16 Role** legacy.
- **Total Modul di KIL:** **124 Modul / Halaman** (pada role Administrator).
- **Penyelarasan ke NEX ERP:**
  - Database NEX ERP menggunakan relasi `User.roles: UserRole[]` (Prisma) dengan field `code` (NIP), `fullName`, `email`, `phone`, `isBd`, `status`.
  - Halaman dan rute diselaraskan 100% dengan Screaming Architecture kanonik pada `docs/ROUTE_MAP.md`.

---

## 2. Matriks Penyelarasan 16 Master Role (KIL ➔ NEX ERP)

Berikut adalah pemetaan formal dari 16 Role KIL ke enum `UserRole` yang berlaku di backend NEX ERP:

| No | KIL Role Name (Legacy ID) | Prisma Enum `UserRole[]` | Divisi Kanonik | Scope Tanggung Jawab & Akses NEX ERP |
|:--:|---|---|---|---|
| **1** | **Administrator** (1) | `SUPER_ADMIN`, `ADMIN` | SYSTEM | Akses penuh (*super-bypass*) ke seluruh 278 route & konfigurasi sistem. |
| **2** | **HRD** (2) | `HR` | HR | Personalia, rekrutmen ATS, training, payroll slip gaji, tiket cuti/lembur (`/hr/*`). |
| **3** | **Staff Back Office** (3) | `ADMIN` | SYSTEM | Monitoring jadwal produksi, checklist progress/tracking internal. |
| **4** | **Purchasing** (4) | `PURCHASING`, `SCM` | SCM | Pengadaan barang, PO vendor, vendor master, retur pembelian (`/pembelian/*`). |
| **5** | **Warehouse** (5) | `WAREHOUSE` | WAREHOUSE | Inbound goods, dispatch release, mutasi stok, stok opname (`/warehouse/*`). |
| **6** | **Head Business Development** (6) | `COMMERCIAL`, `HEAD_OPS` | BD | Approval diskon/SPK, customer master, target penjualan, monitoring pipeline. |
| **7** | **Business Development** (7) | `COMMERCIAL` | BD | CRM pipeline, leads omni, guest book, sales order, sample sales (`/penjualan/*`). |
| **8** | **Head Research & Development** (8) | `RND`, `HEAD_OPS` | RND | Approval formula, repository BOM, penyesuaian formulasi, COGS/HPP request. |
| **9** | **Research and Development** (9) | `RND` | RND | Laboratorium, formulasi baru, uji lab stability, permintaan sampel (`/samples/*`). |
| **10** | **Production Mixing & Filling** (10) | `PRODUCTION`, `PRODUCTION_OP` | PRODUCTION | Batch records, jadwal mixing/filling, eksekusi lantai pabrik (`/production/*`). |
| **11** | **Production Packaging** (11) | `PRODUCTION_OP` | PRODUCTION | Jadwal packaging, eksekusi pengemasan akhir, serah terima gudang. |
| **12** | **Apoteker Penanggung Jawab** (12) | `APJ`, `COMPLIANCE` | LEGAL / QC | Verifikasi regulasi BPOM, sertifikasi Halal/HKI, kepatuhan bahan baku. |
| **13** | **Finance** (13) | `FINANCE` | FINANCE | CoA, Jurnal Umum, Buku Besar, AR/AP Invoice & Payment, Laba Rugi, Neraca. |
| **14** | **Digital Marketing** (14) | `DIGIMAR`, `MARKETING` | MARKETING | Guest book leads, Omnichannel CRM, campaign marketing workspace (`/marketing/*`). |
| **15** | **BusDev + HRD** (15) | `COMMERCIAL`, `HR` | BD / HR | Persona hybrid: Pelanggan, SO, Client Manager + Personalia & Checklist. |
| **16** | **BusDev + Purchasing** (16) | `COMMERCIAL`, `PURCHASING` | BD / SCM | Persona hybrid: Pelanggan & SO + Pengadaan bahan kebutuhan khusus klien. |

---

## 3. Daftar Lengkap 45 Akun Pengguna & Pemetaan NEX ERP

Semua akun di bawah telah di-seed dan aktif di database NEX ERP (`erp_db_test`).
Semua akun menggunakan kredensial standar: **Password:** `password123`.

| No | NIP / Kode | Nama Pengguna | Email Aktif (`nama@nexerp.id`) | Email KIL Asal | Nomor HP / WA | Role NEX ERP | Flag `isBd` | Divisi |
|:--:|:---:|---|---|---|---|---|:---:|:---:|
| 1 | `000` | Super Admin | `superadmin@nexerp.id` | `goodsyst@gmail.com` | `081231418159` | `["SUPER_ADMIN", "ADMIN"]` | `false` | SYSTEM |
| 2 | `001` | Fadilah Syahab | `fadilah.syahab@nexerp.id` | `fadilah.syahab@dreamlab.id` | `087722291012` | `["COMMERCIAL", "ADMIN"]` | `true` | BD |
| 3 | `002` | Achmad Bagir | `achmad.bagir@nexerp.id` | `achmad.bagir@dreamlab.id` | `081999122990` | `["COMMERCIAL", "ADMIN"]` | `true` | BD |
| 4 | `003` | Zaki | `zaki@nexerp.id` | `zaki@dreamlab.id` | `085659360766` | `["SUPER_ADMIN", "ADMIN"]` | `false` | SYSTEM |
| 5 | `004` | Fatimah Amira | `fatimah.amira@nexerp.id` | `fatimah.amira@dreamlab.id` | `085174191902` | `["RND", "HEAD_OPS"]` | `false` | RND |
| 6 | `005` | Ribut Supriyono | `ribut.supriyono@nexerp.id` | `ribut.supriyono@dreamlab.id` | `085604348983` | `["RND"]` | `false` | RND |
| 7 | `006` | Riyantita Tunjungsari | `riyantita.tunjungsari@nexerp.id` | `riyantita.tunjungsari@dreamlab.id` | `081356351997` | `["PRODUCTION", "PRODUCTION_OP"]` | `false` | PRODUCTION |
| 8 | `007` | Muhammad Ghufron | `muhammad.ghufron@nexerp.id` | `muhammad.ghufron@dreamlab.id` | `0895341099232` | `["WAREHOUSE"]` | `false` | WAREHOUSE |
| 9 | `008` | Akhmad Ratriono Anggoro | `akhmad.ratriono@nexerp.id` | `akhmad.ratriono@dreamlab.id` | `081213971639` | `["COMMERCIAL"]` | `true` | BD |
| 10 | `009` | Dicky Barkah | `dicky.barkah@nexerp.id` | `dicky.barkah@dreamlab.id` | `628979152855` | `["PRODUCTION_OP"]` | `false` | PRODUCTION |
| 11 | `010` | Keviana | `keviana@nexerp.id` | `keviana@dreamlab.id` | `62895375470001` | `["COMMERCIAL"]` | `true` | BD |
| 12 | `012` | Irma Safarina | `irma.safarina@nexerp.id` | `irma.safarina@dreamlab.id` | `083820898788` | `["COMMERCIAL", "PURCHASING"]` | `true` | BD |
| 13 | `013` | Ekky Ilham | `ekky.ilham@nexerp.id` | `ekky.ilham@dreamlab.id` | `081214727282` | `["FINANCE"]` | `false` | FINANCE |
| 14 | `014` | Irma Finance | `irma.finance@nexerp.id` | `irma.finance@dreamlab.id` | `088229186548` | `["FINANCE"]` | `false` | FINANCE |
| 15 | `015` | Vira | `vira@nexerp.id` | `vira@dreamlab.id` | `088235482487` | `["COMMERCIAL"]` | `true` | BD |
| 16 | `016` | Desy | `desy@nexerp.id` | `desy@dreamlab.id` | `085604015560` | `["COMMERCIAL"]` | `true` | BD |
| 17 | `017` | Gabriella Maulidha | `gabriella.maulidha@nexerp.id` | `gabriella.maulidha@dreamlab.id` | `087899752715` | `["RND"]` | `false` | RND |
| 18 | `018` | Nur Kholilah | `nur.kholilah@nexerp.id` | `nur.kholilah@dreamlab.id` | `085851237453` | `["PRODUCTION", "PRODUCTION_OP"]` | `false` | PRODUCTION |
| 19 | `019` | Muhammad Ruhullah | `muhammad.ruhullah@nexerp.id` | `muhammad.ruhullah@dreamlab.id` | `089524640010` | `["PRODUCTION", "PRODUCTION_OP"]` | `false` | PRODUCTION |
| 20 | `020` | salfa delia fernanda | `salfa.delia@nexerp.id` | `salfa.delia@dreamlab.id` | `08819405360` | `["COMMERCIAL"]` | `true` | BD |
| 21 | `021` | Rudy Affandy | `rudy.affandy@nexerp.id` | `rudy.affandy@dreamlab.id` | `081358590645` | `["PRODUCTION_OP"]` | `false` | PRODUCTION |
| 22 | `022` | Yulia Esther | `yulia.esther@nexerp.id` | `yulia.esther@dreamlab.id` | `082337458118` | `["HR"]` | `false` | HR |
| 23 | `023` | Ayu Anindya | `ayu.anindya@nexerp.id` | `ayu.anindya@dreamlab.id` | `085731558835` | `["COMMERCIAL"]` | `true` | BD |
| 24 | `024` | Krisna Putra Ramadhani | `krisna.putra@nexerp.id` | `krisna.putra@dreamlab.id` | `082230206692` | `["WAREHOUSE"]` | `false` | WAREHOUSE |
| 25 | `025` | Ciptaning | `ciptaning@nexerp.id` | `ciptaning@dreamlab.id` | `081334163882` | `["APJ", "COMPLIANCE"]` | `false` | LEGAL |
| 26 | `026` | Panca | `panca@nexerp.id` | `panca@dreamlab.id` | `081231944581` | `["RND"]` | `false` | RND |
| 27 | `027` | Diaz Muhammad Irsyadi | `diaz.muhammad@nexerp.id` | `diaz.muhammad@dreamlab.id` | `082266781965` | `["COMMERCIAL", "HR"]` | `true` | BD |
| 28 | `028` | Edi Design | `edi.design@nexerp.id` | `edi.design@dreamlab.id` | `6287820625288` | `["ADMIN"]` | `false` | CREATIVE |
| 29 | `029` | BRIAN BUDY CAHYONO | `brian.budy@nexerp.id` | `brian.budy@dreamlab.id` | `083831038899` | `["RND"]` | `false` | RND |
| 30 | `030` | Lee Maychael | `lee.maychael@nexerp.id` | `lee.maychael@dreamlab.id` | `08112287773` | `["RND"]` | `false` | RND |
| 31 | `031` | SHIRLEY IRMA JUNITA | `shirley.irma@nexerp.id` | `shirley.irma@dreamlab.id` | `082260099901` | `["COMMERCIAL"]` | `true` | BD |
| 32 | `032` | Siti | `siti@nexerp.id` | `siti@dreamlab.id` | `0895359873700` | `["FINANCE"]` | `false` | FINANCE |
| 33 | `033` | Estisan Septyana Atwinda | `estisan.septyanaatwinda@nexerp.id` | `estisan.septyanaatwinda@dreamlab.id` | `0817403344` | `["COMMERCIAL"]` | `true` | BD |
| 34 | `034` | Laksmi Diah Ahmada | `laksmi.diah@nexerp.id` | `laksmi.diah@dreamlab.id` | `0817740233` | `["COMMERCIAL", "HEAD_OPS"]` | `true` | BD |
| 35 | `035` | Annisa Shalihah | `annisa.shalihah@nexerp.id` | `annisa.shalihah@dreamlab.id` | `081952417051` | `["COMMERCIAL"]` | `true` | BD |
| 36 | `036` | Diva | `diva@nexerp.id` | `diva@dreamlab.id` | `087712232389` | `["COMMERCIAL"]` | `true` | BD |
| 37 | `037` | Latifatus Cahya Ningtyas | `latifatus.cahya@nexerp.id` | `latifatus.cahya@dreamlab.id` | `08123456789` | `["RND"]` | `false` | RND |
| 38 | `038` | Revita Yustianawati | `revita.yustianawati@nexerp.id` | `revita.yustianawati@dreamlab.id` | `085816961799` | `["DIGIMAR", "MARKETING"]` | `false` | MARKETING |
| 39 | `039` | Etika Citra Nuraisah | `etika.citra.nuraisah@nexerp.id` | `etika.citra.nuraisah@dreamlab.id` | `082229212228` | `["FINANCE"]` | `false` | FINANCE |
| 40 | `040` | R.A Ami Wulandari Soedewo | `ami@nexerp.id` | `ami@dreamlab.id` | `087776550657` | `["COMMERCIAL"]` | `true` | BD |
| 41 | `041` | Umar Nurbana | `umar.nurbana@nexerp.id` | `umar.nurbana@dreamlab.id` | `0895630271008` | `["WAREHOUSE"]` | `false` | WAREHOUSE |
| 42 | `042` | Siti Mutmainah | `siti.mutmainah@nexerp.id` | `siti.mutmainah@dreamlab.id` | `087712232381` | `["COMMERCIAL"]` | `true` | BD |
| 43 | `01072606` | Jessica Dwipuspita | `jessica@nexerp.id` | `jessica@dreamlab.id` | `081231418157` | `["COMMERCIAL"]` | `true` | BD |
| 44 | `043` | Eunike Putriningtyas | `eunike@nexerp.id` | `eunike@dreamlab.id` | `085231660403` | `["PURCHASING", "SCM"]` | `false` | SCM |
| 45 | `05092602` | Edvin Porvianto Sutedjo | `edvin@nexerp.id` | `edvin@dreamlab.id` | `081212315021` | `["FINANCE"]` | `false` | FINANCE |

---

## 4. Matriks Akses Halaman & Modul (KIL Modul ➔ NEX ERP Route Map)

Berikut adalah translasi dari halaman lama di KIL ERP ke rute resmi NEX ERP (`ROUTE_MAP.md`) beserta matriks role yang diizinkan membukanya:

| Modul KIL (Legacy Slug / URL) | Rute Kanonik NEX ERP (`ROUTE_MAP.md`) | Deskripsi Fungsi | Role yang Memiliki Akses di NEX ERP |
|---|---|---|---|
| `dashboard-*` (Semua Dashboard KIL) | `/(dashboard)` / `/finance/dashboard` / `/marketing/dashboard` / `/hr/dashboard` | Dashboard eksekutif & operasional per divisi | Sesuai divisi terkait & `SUPER_ADMIN` |
| `user-manage`, `role-manage` | `/master/personnel` | Manajemen data pengguna, role, dan personalia | `SUPER_ADMIN`, `ADMIN`, `HR` |
| `customer-manage`, `customer-my-manage`, `customer-category-manage` | `/master/customers` | Master data pelanggan, limit kredit, kategori | `SUPER_ADMIN`, `COMMERCIAL`, `FINANCE` |
| `supplier-manage`, `supplier-category-manage` | `/master/suppliers` | Master data vendor & supplier bahan baku | `SUPER_ADMIN`, `PURCHASING`, `SCM` |
| `goods-manage`, `goods-category-manage` | `/master/goods` | Master data barang, bahan baku, kemasan | `SUPER_ADMIN`, `PURCHASING`, `WAREHOUSE`, `RND` |
| `warehouse-manage`, `warehouse-access-manage` | `/master/warehouses` | Master gudang, rak, zona penyimpanan | `SUPER_ADMIN`, `WAREHOUSE` |
| `coa-manage`, `coa-auto-manage` | `/finance/accounting/coa` | Bagan Akun (CoA) & aturan otomatisasi jurnal | `SUPER_ADMIN`, `FINANCE` |
| `sales-category` | `/master/sales-category` | Kategori penjualan & pipeline produk | `SUPER_ADMIN`, `COMMERCIAL` |
| `sales-target` | `/penjualan/sales-target` | Target penjualan vs realisasi omset | `SUPER_ADMIN`, `COMMERCIAL` |
| `guest-book`, `report-guest-book` | `/penjualan/guest-book` | Buku tamu & registrasi pengunjung walk-in | `COMMERCIAL`, `DIGIMAR`, `SUPER_ADMIN` |
| `leads` | `/samples/omni-crm` | OmniCRM Leads, WhatsApp integration | `COMMERCIAL`, `DIGIMAR`, `SUPER_ADMIN` |
| `client-*`, `client-lost` | `/penjualan/client-manager`, `/penjualan/lost` | Siklus hidup klien (Sample, Produksi, RO, Lost) | `COMMERCIAL`, `SUPER_ADMIN` |
| `sales`, `sales-orders` | `/penjualan/sales-orders` | Pembuatan & monitoring Sales Order (SO) | `COMMERCIAL`, `SUPER_ADMIN` |
| `sales-sample` | `/penjualan/sample-sales` | Penjualan sampel & formulasi R&D | `COMMERCIAL`, `RND`, `SUPER_ADMIN` |
| `sales-down-payment` | `/penjualan/down-payment` | Faktur DP Penjualan dari customer | `COMMERCIAL`, `FINANCE`, `SUPER_ADMIN` |
| `sales-invoice` | `/penjualan/faktur-penjualan` | Faktur komersial & pajak penjualan | `FINANCE`, `SUPER_ADMIN` |
| `sales-payment`, `sales-sample-payment` | `/penjualan/bayar-penjualan` | Pelunasan piutang (AR Settlement) | `FINANCE`, `SUPER_ADMIN` |
| `sales-return`, `sales-return-in` | `/penjualan/retur-penjualan`, `/warehouse/inbound` | Retur penjualan & penerimaan fisik barang retur | `COMMERCIAL`, `WAREHOUSE`, `SUPER_ADMIN` |
| `purchase-request`, `purchase-request-approval` | `/pembelian/purchase-requests` | Permintaan Pembelian (PR) antar divisi | `PURCHASING`, `RND`, `WAREHOUSE`, `SUPER_ADMIN` |
| `purchase`, `purchase-approval` | `/pembelian/scm-pembelian` | Purchase Order (PO) ke vendor | `PURCHASING`, `SCM`, `SUPER_ADMIN` |
| `purchase-down-payment` | `/pembelian/dp-pembelian` | Pembayaran uang muka (DP) ke supplier | `FINANCE`, `PURCHASING`, `SUPER_ADMIN` |
| `purchase-invoice` | `/pembelian/faktur-pembelian` | Tagihan vendor (AP Vendor Bills) | `FINANCE`, `SUPER_ADMIN` |
| `purchase-payment` | `/pembelian/bayar-pembelian` | Bukti pengeluaran kas pelunasan hutang AP | `FINANCE`, `SUPER_ADMIN` |
| `purchase-return`, `purchase-return-out` | `/pembelian/purchase-returns` | Retur pembelian ke supplier & debit note | `PURCHASING`, `WAREHOUSE`, `FINANCE` |
| `need-for-goods` | `/pembelian/kebutuhan` | Kebutuhan Bahan Baku (MRP / Forecast) | `PURCHASING`, `PPIC`, `PRODUCTION` |
| `purchase-in` | `/warehouse/inbound` | Penerimaan fisik barang masuk (GRN) | `WAREHOUSE`, `QC_LAB` |
| `delivery-out` | `/warehouse/release` | Pengeluaran barang & surat jalan kirim (DO) | `WAREHOUSE`, `PRODUCTION_OP` |
| `goods-transfer` | `/warehouse/pindah-gudang` | Mutasi transfer antar gudang | `WAREHOUSE` |
| `report-stock`, `report-mutation-goods` | `/warehouse/stok`, `/warehouse/mutasi-stok` | Saldo stok realtime & kartu stok mutasi | `WAREHOUSE`, `PURCHASING`, `RND`, `FINANCE` |
| `stok-opname`, `penyesuaian-stok` | `/warehouse/adjustment` | Stock opname, selisih stok, & penyesuaian | `WAREHOUSE`, `FINANCE`, `SUPER_ADMIN` |
| `formulation`, `formulation-manage` | `/samples/repository`, `/samples/formula` | Database formula kosmetik & BOM lab | `RND`, `SUPER_ADMIN` |
| `request-cogs`, `request-cogs-approval` | `/finance/cogs-request` | Permintaan perhitungan HPP sampel/formula | `COMMERCIAL`, `FINANCE`, `RND` |
| `batch-record`, `schedule-*` | `/production/schedule`, `/production/batch-records` | Rencana produksi, jadwal mixing, & e-BMR | `PRODUCTION`, `PPIC`, `SUPER_ADMIN` |
| `production-mixing`, `production-filling`, `production-packaging` | `/production/*` | Eksekusi manufaktur mixing, filling, packing | `PRODUCTION`, `PRODUCTION_OP` |
| `checklist-progress`, `checklist-tracking` | `/quality/checklist-progress`, `/quality/checklist-tracking` | Monitoring kendali mutu & SLA proses produksi | `QC_LAB`, `PRODUCTION`, `SUPER_ADMIN` |
| `general-journal` | `/finance/jurnal-umum` | Jurnal manual & otomatisasi akuntansi | `FINANCE`, `SUPER_ADMIN` |
| `report-general-ledger` | `/finance/ledger` | Buku Besar (General Ledger statement) | `FINANCE`, `SUPER_ADMIN` |
| `other-deposit` | `/finance/cash-in` | Kas / Bank Masuk (non-penjualan) | `FINANCE`, `SUPER_ADMIN` |
| `other-payment` | `/finance/cash-out` | Kas / Bank Keluar (beban operasional/petty cash)| `FINANCE`, `SUPER_ADMIN` |
| `report-profit-loss`, `report-balance-sheet` | `/finance/laba-rugi`, `/finance/dashboard` | Laporan Laba Rugi, Neraca, Neraca Saldo | `FINANCE`, `DIRECTOR`, `SUPER_ADMIN` |
| `hr-*` (Penggajian, Cuti, Absensi) | `/hr/employees`, `/hr/payroll`, `/hr/tickets` | Rekap pegawai, slip gaji PPh21, tiket cuti/lembur | `HR`, `SUPER_ADMIN` |

---

## 5. Ringkasan Hak Akses Berdasarkan 16 Role (KIL ➔ NEX ERP)

Berikut ringkasan cepat untuk tiap role ketika login di NEX ERP:

1. **Administrator:** Memiliki akses ke seluruh menu tanpa terkecuali (`SUPER_ADMIN`).
2. **HRD:** Akses khusus ke modul `/hr/*` (Karyawan, Rekrutmen ATS, Training, Payroll, Evaluasi KPI, Tiket Cuti/Lembur) dan `/master/personnel`.
3. **Staff Back Office:** Akses monitoring `/production/schedule` dan `/quality/checklist-progress`.
4. **Purchasing:** Akses pengadaan `/pembelian/*` (PR, PO, Retur, MRP), master supplier & barang, serta cek stok gudang.
5. **Warehouse:** Akses pergudangan `/warehouse/*` (Stok, Inbound, Release, Transfer Gudang, Mutasi, Adjustment Opname).
6. **Head Business Development:** Akses penuh komersial `/penjualan/*`, verifikasi diskon & SPK, target penjualan, serta approval commercial.
7. **Business Development:** Akses operasional CRM `/penjualan/*` (Guest book, leads OmniCRM, client manager, SO, sample sales, penagihan DP).
8. **Head R&D:** Akses approval formula, repository sampel `/samples/*`, project monitoring R&D `/rnd/*`, dan validasi HPP.
9. **R&D Staff:** Akses riset laboratorium, formulasi sampel `/samples/formula`, dan uji stabilitas lab.
10. **Production Mixing & Filling:** Akses lantai produksi mixing/filling `/production/*`, e-BMR, dan permintaan bahan ke gudang.
11. **Production Packaging:** Akses jadwal packaging `/production/schedule`, eksekusi pengemasan, dan rilis pengiriman barang.
12. **Apoteker Penanggung Jawab (APJ):** Akses kepatuhan BPOM, regulasi kosmetik, audit bahan baku, dan monitoring stok bahan terkontrol.
13. **Finance:** Akses penuh akuntansi & keuangan `/finance/*` (CoA, Jurnal, Ledger, Kas Masuk/Keluar, Rekonsiliasi, Laba Rugi) dan verifikasi faktur/pembayaran di `/penjualan/*` serta `/pembelian/*`.
14. **Digital Marketing:** Akses campaign `/marketing/*`, capture leads OmniCRM `/samples/omni-crm`, dan buku tamu `/penjualan/guest-book`.
15. **BusDev + HRD:** Akses gabungan modul Komersial (`/penjualan/*`) dan Personalia HR (`/hr/tickets`, checklist tim).
16. **BusDev + Purchasing:** Akses gabungan modul Komersial (`/penjualan/*`) dan Pengadaan Barang Kebutuhan Khusus (`/pembelian/*`).

---

## 6. Prosedur Seeding Database NEX ERP

Untuk memasukkan 45 user ini ke database Postgres NEX ERP, file JSON hasil scraping lengkap telah tersimpan di:
- [`scripts/kil_full_extracted_data.json`](file:///C:/GAWE/Web%20Dev/Porto%20Aureon/ERP%20FROM%20ZERO/scripts/kil_full_extracted_data.json)

Admin dapat langsung menggunakan data di atas untuk script migrasi seed Prisma (`upsert` berdasarkan `code` atau `email`).
