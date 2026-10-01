# [SCR-001] Master Pelanggan / Klien (Customer Master Data)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/customers`
- **Legacy GsERP URL:** `/customer-manage`
- **Menu Sidebar:** `1. MASTER DATA > Pelanggan / Customer`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Master data seluruh klien maklon, riwayat transaksi, limit kredit piutang, dan manajemen dokumen legalitas.

---

## 2. Card Status Khusus (REQUIREMENT Poin 2)
Di atas tabel data utama, wajib terdapat **3 Kartu Kategori Klien**:
1. **Card Sample:** Menampilkan jumlah klien aktif pada fase trial sample lab.
2. **Card Produksi:** Menampilkan jumlah klien dengan kontrak produksi massal aktif.
3. **Card Legalitas:** Menampilkan jumlah klien yang sedang proses pengurusan HKI Merek / Notifikasi BPOM.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Registrasi`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Registrasi | `createdAt` | `DD/MM/YYYY` | Left |
| 3 | Kode Klien | `customerCode` | `CUST-{YYYYMMDD}-{XXXX}` | Left |
| 4 | Nama Klien / Perusahaan | `name` | Nama PT / Klien (Bold) | Left |
| 5 | Brand Utama | `primaryBrand` | Nama Merk / Brand Maklon | Left |
| 6 | Kontak / No WA | `phone` | Clickable WA Link | Left |
| 7 | PIC BusDev | `assignedPic` | Nama Sales / BusDev | Left |
| 8 | Limit Kredit (Plafond) | `creditLimit` | `Rp #.##0` (Font tabular-nums) | Right |
| 9 | Status Klien | `status` | Badge 1 Baris: `PROSPEK_SAMPLE`, `KONTRAK_PRODUKSI`, `NONAKTIF` | Center |
| 10 | Aksi | `actions` | Tombol: `Lihat Profil`, `Edit`, `Dokumen Legalitas` | Center |

---

## 4. Secondary Window: Form Input Pelanggan Baru (Centered Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-4xl`).
- **Trigger:** Tombol `+ Tambah Pelanggan`.
- **Field:** Nama Perusahaan / Klien, Nama Brand, Alamat Pengiriman, Kontak WA & Email, PIC BusDev, Term of Payment (TOP Hari), Limit Kredit, Upload File KTP / NPWP / Akta Perusahaan (Dokumen Legalitas).
