# [SCR-075] Pusat Persetujuan Bertingkat (Multi-tier Approval Hub)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/approvals/*` (`/approvals/[slug]`)
- **Menu Sidebar:** `7. PUSAT PERSETUJUAN > Approval Center`
- **Hak Akses (RBAC):** `HEAD_DEPT`, `FINANCE`, `DIRECTOR`, `SUPERADMIN`
- **Tujuan Operasional:** Hub sentral satu pintu untuk memproses seluruh permohonan persetujuan (Purchase Request PR, Purchase Order PO, Sales Order DP Waiver, Perubahan Formula, dan Pengajuan Dana Kasbon).

---

## 2. Struktur Tabel Approval Hub
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Waktu Pengajuan | `createdAt` | `DD/MM/YYYY HH:mm` | Left |
| 3 | Tipe Dokumen | `docType` | Badge: `PURCHASE_ORDER`, `PURCHASE_REQUEST`, `SALES_ORDER`, `EXPENSE_CLAIM` | Center |
| 4 | No. Dokumen | `docNumber` | `PO-001` / `PR-002` (Mono Bold) | Left |
| 5 | Pemohon (Requester) | `requester` | Nama Staf & Divisi | Left |
| 6 | Nilai Nominal | `amount` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Level Persetujuan | `approvalTier` | `Tier 2 / 3 (Menunggu Direktur)` | Left |
| 8 | Status | `status` | Badge: `PENDING`, `APPROVED`, `REJECTED` | Center |
| 9 | Aksi Cepat | `actions` | Tombol: `Approve Segera`, `Reject dengan Alasan`, `Lihat Dokumen` | Center |
