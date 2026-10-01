# [SCR-061] Penggajian & Pinjaman Karyawan (Payroll Workbench & Employee Loans)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/hr/payroll`
- **Menu Sidebar:** `3. HRD & SUMBER DAYA > Payroll Workbench`
- **Hak Akses (RBAC):** `HRD`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Proses perhitungan payroll bulanan karyawan, integrasi lembur (overtime) dari roaster kerja, potongan pinjaman kasbon (loan) beserta reminder sisa hutang, kalkulasi PPh 21 threshold UMR, dan penerbitan slip gaji detail.

---

## 2. Struktur Tabel Payroll Bulanan
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Periode Gaji`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Periode | `payrollPeriod` | `Bulan YYYY` (misal: September 2026) | Left |
| 3 | Nama & NIK | `employeeName` | Nama Karyawan (Bold) + Jabatan | Left |
| 4 | Upah Tetap | `fixedSalary` | `Gaji Pokok + Tunjangan Jabatan` | Right |
| 5 | Transport | `transportAllowance`| `Flat + Tentatif (Kehadiran)` | Right |
| 6 | Lembur (Overtime) | `overtimePay` | Terhitung otomatis dari Roaster Shift | Right |
| 7 | Potongan Kasbon/Loan | `loanDeduction` | Potongan Pinjaman (Cicilan bulan ini) | Right |
| 8 | Sisa Pinjaman (Reminder) | `remainingLoan` | Sisa Hutang Karyawan yang belum lunas | Right |
| 9 | PPh 21 | `pph21Amount` | Auto-kalkulasi (Threshold UMR) | Right |
| 10 | Gaji Bersih (Take Home Pay)| `netSalary` | `Rp #.##0` (Font tebal tabular-nums) | Right |
| 11 | Status Slip Gaji | `status` | Badge 1 Baris: `DRAFT`, `VERIFIED_HR`, `POSTED_PAID` | Center |
| 12 | Aksi | `actions` | Tombol: `Lihat Detail`, `Cetak Slip Gaji`, `Kirim Slip WA` | Center |

---

## 3. Logika Bisnis & Perhitungan Khusus (Aturan Wajib)
1. **Lembur (Overtime) Roaster:** Terhubung ke rekap jam lembur riil operator shift pabrik.
2. **Potongan Pinjaman (Loan) & Reminder:**
   * Jika karyawan memiliki pinjaman aktif, sistem otomatis memotong nominal cicilan yang disepakati saat payroll di-*generate*.
   * Kolom Sisa Pinjaman menampilkan peringatan sisa hutang: *"Sisa Rp 1.500.000 (3x Cicilan)"*.
3. **Logika Threshold PPh 21:**
   * Jika penghasilan bruto disetahunkan $\le$ Nilai Ambang UMR/PTKP $\rightarrow$ **PPh 21 = Rp 0 (Bebas Potongan)**.
   * Jika di atas ambang batas $\rightarrow$ Dipotong sesuai tarif progresif PPh 21 Pasal 17.
4. **Reminder Pelaporan Gaji:** Sistem memberikan notifikasi ke Finance/HR setiap tanggal 25 untuk review payroll sebelum tanggal transfer gaji.

---

## 4. Format Cetak Slip Gaji (Sleep Salary A4 / Half-Letter)
Dokumen resmi slip gaji memuat:
* Header Perusahaan PT. Karya Impian Laboratoris.
* Nama, Jabatan, NIK, Jumlah Hari Kerja, Jumlah Jam Lembur.
* Tabel Penerimaan (Gaji Pokok, Tunjangan Jabatan, Transport Flat, Transport Harian, Upah Lembur).
* Tabel Potongan (Potongan BPJS TK, BPJS Kesehatan, Potongan Pinjaman/Kasbon, PPh 21).
* Total Diterima Bersih (Take Home Pay) dalam angka dan terbilang rupiah.
