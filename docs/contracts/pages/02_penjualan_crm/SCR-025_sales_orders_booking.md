# [SCR-025] Pemesanan Penjualan Komersial (Sales Orders Booking)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/sales-orders`
- **Menu Sidebar:** `2. PENJUALAN & CRM > Sales Orders`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `FINANCE`, `PPIC`, `SUPERADMIN`
- **Tujuan Operasional:** Booking order resmi kontrak maklon produk kosmetik/skincare dari klien, memicu alur Uang Muka (DP), MRP Pengadaan Bahan, dan SPK Manufaktur Pabrik.

---

## 2. Card Status & Pipeline SO
1. **Total Sales Orders:** Total nilai nominal order periode berjalan.
2. **Menunggu Approval:** SO pending otorisasi manajer/direksi.
3. **Pending DP:** SO yang menunggu konfirmasi pembayaran uang muka klien sebelum rilis SPK.
4. **Dalam Produksi:** SO yang sudah aktif diproduksi oleh pabrik.

---

## 3. Struktur Tabel Utama
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Tanggal SO`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Tanggal SO | `orderDate` | `DD/MM/YYYY` | Left |
| 3 | No. Sales Order | `soNumber` | `SO-{YYYYMMDD}-{XXXX}` (Bold Mono) | Left |
| 4 | Klien & Brand | `customerBrand` | Nama PT + Badge Brand | Left |
| 5 | Produk & Qty Pesanan | `productSummary` | Nama Produk (`10.000 Pcs`) | Left |
| 6 | Total Nilai Order | `grandTotal` | `Rp #.##0` (tabular-nums) | Right |
| 7 | Status Pembayaran | `paymentStatus` | Badge: `UNPAID`, `PARTIAL_DP`, `PAID` | Center |
| 8 | Status Produksi | `productionStatus` | Badge: `DRAFT`, `WAITING_DP`, `IN_PRODUCTION`, `COMPLETED` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Detail`, `Buat DP`, `Cetak SO`, `Terbitkan SPK` | Center |

---

## 4. Secondary Window: Form Pembuatan Sales Order Baru (Canvas Drawer)
- **Tipe Tampilan:** Full-height Canvas Drawer / Wide Modal (`max-w-5xl`).
- **Trigger:** Tombol `+ Buat Sales Order`.
- **Field:** Pilihan Klien Terdaftar, Brand Klien, Tanggal Target Pengiriman (Lead Time), Syarat Pembayaran (DP 50%, Pelunasan sebelum kirim), Tabel Item Produk (Pilih Formula R&D Approved, Qty Order Pcs, Harga Satuan, Diskon, PPN 11%).
