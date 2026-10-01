# [SCR-087] Pengajuan Dana Operasional & Anggaran (Fund Requests & Budgeting)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/finance/fund-requests`
- **Menu Sidebar:** `5. KEUANGAN & AKUNTANSI > Pengajuan Dana`
- **Hak Akses (RBAC):** `ALL_HEAD_DEPT`, `FINANCE`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Alur pengajuan petty cash / dana kas kecil departemen untuk operasional pabrik dan kantor, verifikasi budget limit, dan pertanggungjawaban nota realisasi (settlement).

---

## 2. Struktur Tabel Pengajuan Dana
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tgl Pengajuan | `requestDate` | `DD/MM/YYYY` | Left |
| 3 | No. Pengajuan | `requestNumber` | `FR-{YYYYMM}-{XXXX}` | Left |
| 4 | Pemohon / Departemen | `requester` | Nama Staf & Divisi | Left |
| 5 | Keperluan Dana | `purpose` | Uraian Kebutuhan | Left |
| 6 | Nominal Diajukan | `amount` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Status Otorisasi | `status` | Badge: `PENDING`, `APPROVED_BY_DIRECTOR`, `DISBURSED`, `SETTLED` | Center |
| 8 | Aksi | `actions` | Tombol: `Approve/Disburse`, `Upload Nota Realisasi` | Center |
