# Verifikasi Runtime & Bukti CRUD — NEX ERP

**Tanggal:** 1 Oktober 2026
**Metode:** menjalankan sistem, bukan membacanya. Database salinan `erp_audit`, backend kedua di port 3004, dan akses baca ke produksi.

---

## Ringkasan Eksekutif

Ada dua hal yang harus diketahui lebih dulu, karena keduanya mengubah cara semua temuan di bawah ini harus dibaca.

**1. Sisi ERP di produksi belum pernah dipakai.**

Tabel `erp_database` di server berisi 195 tabel, tapi **179-nya kosong**. Yang terisi hanya 16 tabel, semuanya sisi CRM: 8.735 pesan lead, 900 absensi, 180 skor KPI, 77 pengguna.

Tabel yang dihitung langsung:
`accounts` 0, `journal_entries` 0, `journal_lines` 0, `sales_invoices` 0, `ar_receipts` 0, `client_escrows` 0, `customers` 0, `sales_leads` 0, `material_items` 0, `inventory_transactions` 0.

Artinya: **belum ada satu pun transaksi keuangan yang tercatat di produksi.** Tidak ada faktur, tidak ada penerimaan kas, tidak ada jurnal, tidak ada movement stok.

Konsekuensinya, dan ini yang paling penting untuk keputusan bisnis:

> **Kerugian yang sudah terjadi adalah nol — dan belum mungkin terjadi.** Cacat-cacat keuangan yang terbukti di bawah ini tidak mungkin menyebabkan kerugian, karena belum ada data untuk dirusak. Yang kita tangani adalah risiko ke depan, bukan kerugian warisan.

**2. Produksi tertinggal jauh dari kodingan.**

Server berjalan di commit `7a449e0a` (16 September 2026), 102 commit di belakang `HEAD`. Bukti langsungnya ada di baris 4 tabel vonis di bawah: ada route yang masih hidup di server dalam bentuk rusak, padahal sudah diperbaiki di repo.

---

## Tabel Vonis

Setiap temuan static (dari `AUDIT_2026-10-01_ERD-MATURITY.md` dan `CRUD-CROSSCUTTING-2026-10-01.md`) diberi vonis berdasarkan hasil eksekusi, bukan berdasarkan pembacaan ulang.

| # | Temuan static | Vonis | Bukti |
|:--|:---|:---|:---|
| 0 | 63 dari 107 `_hooks/` mati (tanpa importer) | **BELUM DIUJI** | Hanya disimpulkan dari hitungan importer; belum diuji di browser |
| 1 | 18 dari 19 jalur tulis jurnal melewati validasi | **TIDAK TERBUKTI** | Terbantah. Balance check ada di lapisan Prisma dan berlaku ke semua jalur. Tidak balances → 400; balances → 201 |
| 2 | Gate periode punya dua sistem yang tidak pernah bertemu | **TERBUKTI (lebih lemah)** | Gate periode + cek akun kontrol memang hanya di 1 dari 19 jalur. Tapi cek balance-nya sendiri sudah ada di lapisan Prisma |
| 3 | Cek balance dilewati, lalu pajak ditambahkan setelahnya | **TERBUKTI SEBAGIAN** | Bagian "dilewati" salah. Bagian "pajak tidak punya baris kredit" **benar dan terbukti** — jurnal Dr total / Cr subtotal, pajak 11% hilang |
| 4 | Currency: UI lengkap, backend nol | **TIDAK TERBUKTI** | Kelima endpoint ada dan payload asli frontend berhasil. 201/200 semua |
| 5 | Jurnal rekonsiliasi bank pasti 400 | **TERBUKTI** | Payload asli dari `useBankReconciliationOperations.ts:238-251` → 400. Nama field tidak ada di DTO |
| 6 | 188 endpoint tanpa `@Roles` | **TERBUKTI SEBAGIAN** | Dari 5 controller tanpa guard, **benar-benar terbuka hanya 2** (keduanya webhook WA), bukan 5. Cakupan role belum diuji |
| 7 | Nomor supplier tidak pernah ada | **TERBUKTI** | Model `Supplier` memang tidak punya kolom `code`. Kirim `code` → disimpan di mana saja, tidak ada di baris |
| 8 | `QCAudit` tidak bisa dikoreksi | **BELUM DIUJI** | Rencana uji tidak sempat dijalankan |
| 9 | `LegalStatus` tidak punya keadaan "dicabut" | **BELUM DIUJI** | Hanya dari pembacaan kode |
| 10 | 11 dari 13 perubahan `stockQty` tanpa jejak | **TIDAK BISA DIUJI** | Di `erp_audit` hanya ada 5 material seed tanpa transaksi. Di produksi 0 material, 0 transaksi. Tidak ada data untuk mengujinya |
| 11 | Barang masuk bisa dibuat terhadap PO yang ditolak | **BELUM DIUJI** | Butuh alur PO lengkap, tidak ada data PO di produksi |
| 12 | Approve tanpa isi | **BELUM DIUJI** | Sama |
| 13 | *(temuan baru)* Tabel `customers` tidak punya jalur tulis | **TERBUKTI** | Nol call-site di seluruh `backend/src`. `POST /master/customers` balas 201 tapi menulis ke `sales_leads` |
| 14 | *(temuan baru)* `post()` faktur rusak dua arah | **TERBUKTI** | Tanpa `4001`: `postedAt` terisi, 0 jurnal, 0 error. Dengan `4001`: 400 `JOURNAL_UNBALANCED` |
| 15 | *(temuan baru)* Sisi ERP produksi belum pernah dipakai | **TERBUKTI** | 179 dari 195 tabel kosong; semua tabel keuangan = 0 |
| 16 | *(temuan baru)* Awalan `/v1` dobel masih hidup di produksi | **TERBUKTI** | `/v1/todo/boards` → **404**, `/v1/v1/todo/boards` → **401**. Di `HEAD` nol controller yang seperti itu |
| 17 | *(temuan baru)* Tabel akun kosong di produksi | **TERBUKTI** | `select count(*) from accounts` = 0 |

**Ringkasan:** 8 terbukti, 3 terbukti sebagian, 4 tidak terbukti, 5 belum diuji, 1 tidak bisa diuji.

Angka "belum diuji" sengaja dibiarkan kosong. Menandainya tanpa bukti akan mengulangi kesalahan yang sama seperti pada audit sebelumnya.

---

## Temuan yang Terbukti — Detail

### A. Tabel `customers` tidak punya jalur tulis

**Yang terjadi:** `POST /v1/master/customers` mengembalikan **201 Created** dan isi respons terlihat benar. Tapi data tidak masuk ke tabel `customers`.

**Bukti langsung:**
- `grep` seluruh `backend/src` untuk `prisma.customer.create|upsert|update|createMany|updateMany` → **nol hasil**
- `customers.service.ts:277` memanggil `this.prisma.salesLead.create({...})`
- Pengujian: jumlah baris `customers` tidak berubah, jumlah baris `sales_leads` naik tepat satu

**Kenapa ini yang paling_blocks:**
| Tabel | Kolom | Boleh kosong? | Menunjuk ke |
|:---|:---|:-:|:---|
| `sales_invoices` | `customerId` | TIDAK | `customers` |
| `ar_receipts` | `customerId` | TIDAK | `customers` |
| `client_escrows` | `customerId` | TIDAK | `customers` |

(Diverifikasi di `pg_constraint`, bukan hanya di skema Prisma.)

**Apa yang dilihat pengguna:** tidak ada. Formulir terlihat berhasil, data tersimpan, dan hilang dari tempat yang benar. Ini pola paling berbahaya di sistem ini — karena tidak ada tanda gagal.

**Catatan penting:** jangan diperbaiki dengan menggabungkan `Customer` dan `SalesLead`. Keduanya memang dua entitas berbeda; `SampleRequest`, `WorkOrder`, dan NPF menunjuk ke `sales_leads`. Yang perlu ditambah adalah jalur tulis customer, bukan penggabungan.

---

### B. `post()` faktur penjualan rusak di dua arah

**Kasus 1 — kode akun `4001` tidak ada (kondisi produksi saat ini):**

```
POST /v1/finance/sales-invoices/:id/post   → 200 OK
  postedAt   : terisi
  journal_entries : 0 baris
  error      : tidak ada
```

`sales-invoices.service.ts:141` berbunyi `if (arAcc && revAcc)`. Karena `4001` tidak ada, `revAcc` bernilai `null`, jadi seluruh blok jurnal **tidak pernah dijalankan** — sementara `postedAt` sudah di-set di transaksi yang sama pada baris 130-136.

Akibatnya: faktur ditandai lunas, pendapatan tidak pernah masuk pembukuan, dan tidak ada satu pun tanda bahwa ada yang salah.

**Kasus 2 — kode akun `4001` disisipkan (dalam salinan saja):**

```
POST /v1/finance/sales-invoices/:id/post   → 400 JOURNAL_UNBALANCED
  Debit  1,110,000   Kredit  1,000,000
  transaksi dibatalkan, postedAt tidak terisi
```

Selisihnya persis sama dengan pajak: `taxAmount = subtotal × 0.11` dihitung di `create()`, tapi jurnal hanya menulis Dr Piutang (`totalAmount`) dan Cr Pendapatan (`subtotal`). **Pajak tidak punya baris kredit sama sekali.**

> **Konsekuensi untuk keputusan yang sudah diambil:** koreksi `4001` → `4101` **belum cukup.** Tetap butuh baris ketiga (Cr Hutang Pajak). Kalau hanya mengganti kodenya, hasilnya tetap penolakan.

---

### C. Jurnal rekonsiliasi bank selalu ditolak

Payload asli dari `frontend/.../useBankReconciliationOperations.ts:238-251` mengirim `journalNumber`, `transactionDate`, `sourceDocument`, `items`.

`CreateJournalDto` hanya menerima `date`, `reference`, `description`, `lines[]`.

Karena `main.ts:53-56` menyalakan `forbidNonWhitelisted: true`, setiap field yang tidak dikenal akan ditolak. Hasil: **400, selalu.**

---

### D. Nomor supplier tidak pernah tersimpan

Model `Supplier` tidak punya kolom `code`. Mengirim `code` saat membuat supplier tidak error, tapi nilainya tidak tersimpan di mana pun yang bisa dibaca kembali.

---

### E. Awalan `/v1` dobel masih hidup di produksi

Ditemukan tidak sengaja saat membaca log server.

```
GET /v1/todo/boards      → 404   route tidak ada
GET /v1/v1/todo/boards  → 401   route ada, hanya butuh login
GET /v1/health          → 200
```

`main.ts:28` memasang awalan global `/v1`, dan controller Todo memasang `/v1/todo` lagi. Di `HEAD` sekarang, `grep "Controller('v1/"` mengembalikan **nol** — jadi sudah diperbaiki di repo, tapi belum ter-deploy.

Ini bukti langsung bahwa produksi berjalan 102 commit di belakang, dan konsekuensinya nyata: perbaikan yang sudah selesai di kodingan **tidak ada efeknya untuk pengguna** sampai di-deploy.

---

## Pemetaan Kode Akun

**Di produksi, tabel `accounts` kosong (0 baris).** Jadi bukan "sebagian hilang" — semuanya belum ada.

Di `erp_audit` (salinan lokal) ada 17 akun, dan definisi yang dipakai untuk mengukur adalah sengaja dikunci:

> **Definisi:** literal string 4 digit yang langsung diberikan ke properti bernama `code`, di mana saja dalam `backend/src`.

632 file dipindai. **22 kode dirujuk, 12 di antaranya tidak ada:**

`1100 1101 1108 1151 1310 2102 2201 4001 5210 6101 6224 6232`

Angka lama "25 dari 33" berasal dari pemindaian yang lebih longgar dan **tidak sebanding** dengan angka ini. Angka lama juga basi: tabel akun di lokal berubah sendiri antara 25 September dan 1 Oktober (32 akun dua rezim → 17 akun satu rezim).

**Kabar baik dan konkret:** `seedInitialAccounts()` di `finance.service.ts:58` berhenti hanya bila `count() > 0`. Di produksi nilainya **0**, jadi pemanggilan seed **akan berjalan**. Mengisi daftar akun di produksi aman, tidak perlu migrasi, dan langsung membuka jalan ke semua modul keuangan.

---

## Apa yang Tidak Bisa Dibuktikan

1. **Nilai kerugian rupiah.** Tidak ada transaksi keuangan di produksi, jadi tidak ada yang bisa diukur. Angka ini tidak boleh dikarang, dan tidak ada di laporan ini.
2. **Konsistensi nomor dokumen.** Butuh volume transaksi nyata untuk melihat apakah nomor berulang. Di produksi belum ada.
3. **Kecocokan stok dengan catatan bergerak.** Butuh material dan movement nyata. Keduanya nol.
4. **Cakupan role dan approval.** Butuh skenario multi-user sungguhan.
5. **Perilaku halaman di browser.** Harness Playwright punya 4 cacat yang harus diperbaiki lebih dulu (port, urutan token, storageState, nama cookie), dan butuh dev server berjalan.

---

## Urutan Kerja yang Disarankan

1. **Isi daftar akun di produksi.** Bukan perubahan kode — murni mengisi tabel yang sekarang kosong. Membuka semua modul keuangan, dan aman karena tidak ada data yang bisa tertimpa.
2. **Perbaiki jalur tulis `customers`.** Tanpa ini tidak ada yang bisa ditagih, tidak ada kas masuk, tidak ada dana bersama. Tiga tabel NOT NULL menunjuk ke tabel yang tidak bisa diisi.
3. **Perbaiki `post()` faktur** — koreksi kode akun **dan** tambahkan baris pajak. Dua-duanya, bukan salah satu.
4. **Deploy.** 102 commit perbaikan belum ada di server, termasuk perbaikan route yang sudah selesai.
5. **Baru setelah itu** pikirkan rekonsiliasi histories dan pemindahan data.

Poin 1 dan 2 adalah dua perubahan kecil yang menutup dua jalan buntu besar. Keduanya bisa selesai sebelum tim mulai memakai sistem untuk keuangan.

---

## Catatan Metode

- Semua pengujian dijalankan **dua kali**: sekali apa adanya, sekali dengan sengaja dirusak. 9 dari 9 bisa dibalik. Uji yang tidak bisa gagal tidak membuktikan apa-apa, jadi tidak dipakai.
- Baris data uji milik audit ini **dipisahkan** dari temuan asli di semua penghitungan. Dulu sempat muncul angka "7 dari 7 faktur bermasalah, Rp 7.770.000" — seluruhnya baris uji sendiri. Angka yang benar: `preExisting: 0`, `moneyPreExisting: 0`.
- Skrip `scripts/audit/db-invariants.cjs` menolak apa pun yang bukan `SELECT` **pada SQL yang benar-benar dieksekusi**, bukan pada teks sumbernya. Pemindaian teks akan cocok dengan regex miliknya sendiri dan tidak membuktikan apa pun.
- Akses produksi: `ssh dreamlab@103.93.134.215 "sudo docker exec production-light-db-1 psql -U erp_user -d erp_database -t -A -c '...'"`. Port 5432 **tidak** dipublikasikan ke host, jadi URL koneksi biasa tidak akan bekerja.
- Tidak ada satu pun file di bawah `backend/src` atau `frontend/src` yang diubah selama audit ini. Satu-satunya perubahan di luar direktori itu adalah dua baris di `.gitignore` untuk mengunci berkas kredensial.
