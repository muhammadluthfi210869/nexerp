# [SCR-036] Retur Pembelian Vendor (Purchase Returns & Debit Notes)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/pembelian/purchase-returns`
- **Menu Sidebar:** `3. PEMBELIAN & PENGADAAN > Retur Pembelian`
- **Hak Akses (RBAC):** `PPIC`, `SCM`, `QC`, `FINANCE`, `SUPERADMIN`
- **Tujuan Operasional:** Penerbitan nota retur pembelian bahan baku/kemas yang gagal uji QC Inbound / rusak, memicu pengurangan hutang dagang (Debit Note) atau penggantian barang (replacement).

---

## 2. Struktur Tabel Utama
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tgl Retur | `returnDate` | `DD/MM/YYYY` | Left |
| 3 | No. Retur Pembelian | `returnNumber` | `PR-RET-{YYYYMM}-{XXXX}` | Left |
| 4 | No. Penerimaan (LPB) / PO | `refDoc` | `RCV-{XXX}` / `PO-{XXX}` | Left |
| 5 | Vendor / Supplier | `vendorName` | Nama Supplier | Left |
| 6 | Alasan Retur | `reason` | `GAGAL_QC_KEMASAN`, `KADALUWARSA`, `DEFECT` | Left |
| 7 | Total Nilai Retur | `totalAmount` | `Rp #.##0` (tabular-nums) | Right |
| 8 | Status Debit Note | `status` | Badge: `DRAFT`, `DIKIRIM`, `DISETUJUI_VENDOR`, `SELESAI` | Center |
| 9 | Aksi | `actions` | Tombol: `Detail`, `Cetak Debit Note`, `Surat Jalan Retur` | Center |
