# [SCR-005] Pengguna & Hak Akses (Personnel & RBAC Management)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/personnel`
- **Legacy GsERP URL:** `/user-manage` & `/role-manage`
- **Menu Sidebar:** `1. MASTER DATA > Pengguna & Hak Akses` (SATU ENTRYPOINT TUNGGAL)
- **Hak Akses (RBAC):** `SUPERADMIN`, `DIRECTOR`
- **Tujuan Operasional:** Manajemen sentral akun pengguna, kredensial personel pabrik, dan pengaturan kartu hak akses/role secara terpadu tanpa memecah navigasi menjadi 2 menu terpisah.

---

## 2. Struktur Navigasi Tab / Card (Satu Halaman Terpadu)
Halaman ini dibagi menjadi 2 Tab Utama dengan tampilan Card yang elegan:
* **Tab 1: Personel & Pengguna Sistem** (Daftar User, Email, Karyawan, Departemen, Status Aktif)
* **Tab 2: Kartu Matriks Hak Akses & Role** (Daftar Role dalam bentuk Grid Card + Ikon, Jumlah User Aktif, dan Pengaturan Permission)

---

## 3. Tab 1: Tabel Personel & Pengguna
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal Dibuat`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal Dibuat | `createdAt` | `DD/MM/YYYY` | Left |
| 3 | Nama Lengkap | `fullName` | Teks tebal + Avatar inisial | Left |
| 4 | Email / Username | `email` | `user@nexerp.id` | Left |
| 5 | Departemen | `department` | Teks Nama Departemen | Left |
| 6 | Jabatan | `jobTitle` | Teks Jabatan Personel | Left |
| 7 | Role Utama | `primaryRole` | Badge Dinamis 1 Baris: `SUPERADMIN`, `PURCHASING`, dll. | Center |
| 8 | Status Akun | `isActive` | Badge 1 Baris: `AKTIF` (Hijau) / `NONAKTIF` (Abu-abu) | Center |
| 9 | Aksi | `actions` | Tombol: `Edit Akun`, `Reset Password`, `Kunci/Aktifkan` | Center |

---

## 4. Tab 2: Kartu Matriks Hak Akses & Role (Role Cards View)
Setiap role disajikan dalam format **Card Interaktif (Bukan sekadar list teks kaku)**:
* **Card Header:** Ikon Role (Shield, Truck, Landmark, Beaker, dll.), Nama Role Resmi, dan Badge Tipe Role.
* **Card Body:**
  * Deskripsi wewenang role.
  * *Counter User:* Jumlah personel aktif pemegang role (misal: "👥 4 Pengguna").
  * Ringkasan Modul yang dapat diakses (Penjualan, Pembelian, Produksi, Gudang, Finance).
* **Card Footer:** Tombol `Kelola Izin (Permissions)` dan `Lihat Pengguna`.

---

## 5. Form Input Pengguna Baru (Centered Floating Modal)
- **Tipe Tampilan:** Floating Modal (`max-w-3xl`)
- **Trigger:** Tombol `+ Tambah Pengguna`

| Nama Field | Input Mode | Tipe Komponen | Validasi | Keterangan |
|---|---|---|---|---|
| Nama Lengkap | Manual Input | TextInput | Mandatory | Nama resmi sesuai KTP/HRD |
| Email Kantor | Manual Input | EmailInput | Mandatory | Format email unik: `...company.id` |
| Departemen | Manual Input | SearchSelect | Mandatory | Pilihan departemen aktif |
| Jabatan | Manual Input | TextInput | Mandatory | Jabatan operasional |
| Role Akses | Manual Input | MultiSelect / Cards | Mandatory | Minimal 1 role sistem terpilih |
| Password Default | Auto / Manual | PasswordInput | Mandatory | Auto-generate atau set manual (Min. 8 Karakter) |
| Kirim Kredensial via Email/WA | Toggle Switch | Checkbox | Opsional | Default: Aktif |

---

## 6. Error Handling & Human-Friendly Toast Messages
| Kasus Error Backend | Respon Mentah | Pesan Toast Ramah Pengguna |
|---|---|---|
| Email sudah digunakan | `409 Conflict: email taken` | ⚠️ "Email ini sudah terdaftar untuk pengguna lain." |
| Password kurang panjang | `400 Bad Request: password min 8` | ⚠️ "Password minimal terdiri dari 8 karakter kombinasi." |
| Role belum dipilih | `400 Bad Request: role required` | ⚠️ "Mohon pilih minimal satu hak akses untuk pengguna ini." |
