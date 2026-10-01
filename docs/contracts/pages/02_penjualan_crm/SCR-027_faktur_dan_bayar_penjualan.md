# [SCR-027] Faktur Penjualan & Pelunasan Piutang (AR Sales Invoice & Receipts)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** 
  - Faktur Penjualan: `/penjualan/faktur-penjualan`
  - Bayar Penjualan: `/penjualan/bayar-penjualan`
- **Menu Sidebar:** `2. PENJUALAN & CRM > Faktur Penjualan & Bayar Penjualan`
- **Hak Akses (RBAC):** `COMMERCIAL`, `FINANCE`, `ACCOUNTING`, `SUPERADMIN`
- **Tujuan Operasional:** Penerbitan faktur tagihan komersial/pajak setelah pengiriman barang rilis dari gudang (Delivery Release), penyesuaian potongan DP, dan pencatatan pelunasan piutang (AR Receipts).

---

## 2. Struktur Tabel Faktur Penjualan
| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tgl Faktur | `invoiceDate` | `DD/MM/YYYY` | Left |
| 3 | No. Faktur Penjualan | `invoiceNumber` | `INV-SALES-{YYYYMM}-{XXXX}` | Left |
| 4 | No. Surat Jalan / SO | `refNumber` | `DO-{XXX}` / `SO-{XXX}` | Left |
| 5 | Pelanggan / Brand | `customerName` | Nama Klien & Brand | Left |
| 6 | Total Tagihan Neto | `netAmount` | `Rp #.##0` (Total dikurangi DP) | Right |
| 7 | Jatuh Tempo (TOP) | `dueDate` | `DD/MM/YYYY` (Merah jika lewat jatuh tempo) | Center |
| 8 | Status Pelunasan | `paymentStatus` | Badge: `UNPAID`, `PARTIAL`, `PAID` | Center |
| 9 | Aksi | `actions` | Tombol: `Bayar/Receipt`, `Cetak Invoice`, `Faktur Pajak` | Center |
