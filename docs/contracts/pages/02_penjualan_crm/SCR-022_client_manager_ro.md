# [SCR-022] Client Manager — Tab 3: Client RO (Repeat Order / Replenishment)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/penjualan/client-manager?tab=ro`
- **Menu Sidebar:** `6. CRM & BUSDEV > Client RO`
- **Hak Akses (RBAC):** `COMMERCIAL`, `BUSSDEV`, `SUPERADMIN`
- **Tujuan Operasional:** Monitoring dan otomatisasi pengingat repeat order bagi klien maklon yang produknya mendekati estimasi habis di pasaran, memaksimalkan Lifetime Value (LTV).

---

## 2. Struktur Tabel Utama (Sesuai Format Wajib Kanonik)
> **Pembersihan DNA:** Hilangkan warna-warni pelangi. Font seragam `text-xs (12px)` Inter.
> **Struktur Kolom Sesuai Permintaan Spesifik:**

| No | Header Grup Utama | Sub-Kolom Spesifik | Field API | Format / Tampilan | Align |
|---|---|---|---|---|---|
| 1 | NO | `#` | `index` | Angka urut | Center |
| 2 | BRAND & PRODUK | Nama Brand & SKU | `brandAndProduct` | Brand (Bold) + Nama Produk | Left |
| 3 | DATA WAJIB REPLENISHMENT | Tgl Sampai | `arrivalDate` | `DD/MM/YYYY` (Tanggal diterima klien) | Left |
| 4 | DATA WAJIB REPLENISHMENT | Est. Habis | `estExhaustionDate` | `DD/MM/YYYY` (Prediksi stok klien habis) | Left |
| 5 | DATA WAJIB REPLENISHMENT | Potensi | `roPotentialQty` | Qty Pcs Potensial Reorder | Right |
| 6 | STATUS & REMINDER | Status RO | `roStatus` | Badge 1 Baris: `AMAN`, `WARNING_H30`, `URGENT_REORDER`, `ORDERED` | Center |
| 7 | STATUS & REMINDER | Auto Reminder | `reminderTrigger` | Ikon Lonceng + Status Reminder (Terkirim / Menunggu) | Center |
| 8 | ACTIVITY & FEEDBACK | Feedback | `lastFeedback` | Ringkasan respon klien terhadap penjualan produk | Left |
| 9 | ACTIVITY & FEEDBACK | Komplain | `complaints` | Catatan komplain kemasan/kualitas (atau `-` jika nihil) | Left |
| 10 | LIFETIME VALUE (LTV) | Total Nilai Belanja | `clientLtvValue` | `Rp #.##0` (Akumulasi total order klien) | Right |
| 11 | AKSI | Aksi Cepat | `actions` | Tombol: `+ Follow Up RO`, `Buat SO Baru` | Center |

---

## 3. Logika Bisnis & Pengingat Otomatis (Auto-Reminder)
1. **Perhitungan Estimasi Habis:** `Tanggal Sampai Produk + Lead Time Penjualan Pasar (misal 90 Hari)`.
2. **Trigger Auto Reminder:** Saat `H-30` sebelum stok klien diperkirakan habis, sistem memicu notifikasi reminder ke BusDev PIC untuk menghubungi klien guna booking slot antrean produksi maklon berikutnya.
