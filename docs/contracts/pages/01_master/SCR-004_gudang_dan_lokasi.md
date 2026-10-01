# [SCR-004] Master Gudang & Lokasi Penyimpanan (Warehouse & Storage Locations)

## 1. Identitas Halaman & Hak Akses
- **URL Route:** `/master/warehouses`
- **Menu Sidebar:** `1. MASTER DATA > Gudang & Lokasi`
- **Hak Akses (RBAC):** `SUPERADMIN`, `WAREHOUSE`, `PPIC`, `HEAD_WAREHOUSE`
- **Tujuan Operasional:** Master pembagian lokasi fisik pabrik dan gudang (Gudang Bahan Baku Suhu Ruang, Gudang Bahan Baku AC/Chiller, Gudang Kemas, Gudang Ruahan/Karantina, Gudang Finish Good, dan Gudang Retur/Reject).

---

## 2. Struktur Tabel Utama Gudang & Zona
> Standar Global: Kolom 1 = `#`, Kolom 2 = `Kode Gudang`.

| No | Nama Kolom | Field Key (API) | Format / Tampilan | Align |
|---|---|---|---|---|
| 1 | # | `index` | Angka urut | Center |
| 2 | Kode Gudang | `code` | `WH-{XXX}` (Font mono) | Left |
| 3 | Nama Gudang | `name` | Nama Gudang Resmi (Bold) | Left |
| 4 | Tipe Penyimpanan | `type` | Badge: `RAW_MATERIAL`, `PACKAGING`, `BULK_QUARANTINE`, `FINISHED_GOODS`, `REJECT` | Center |
| 5 | Kondisi Suhu | `temperatureZone` | `Suhu Ruang (15-25°C)`, `Chiller (2-8°C)`, `Cold Room` | Left |
| 6 | Kapasitas Rak / Pallet | `capacity` | `150 Pallet (85% Terisi)` | Right |
| 7 | Penanggung Jawab (PIC) | `pic` | Nama Kepala Gudang | Left |
| 8 | Status | `status` | Badge: `AKTIF`, `MAINTENANCE` | Center |
| 9 | Aksi | `actions` | Tombol: `Lihat Rak & Bin`, `Edit`, `Audit Lokasi` | Center |

---

## 3. Secondary Window: Form Input Gudang & Mapping Rak (Floating Modal)
- **Tipe Tampilan:** Centered Floating Modal (`max-w-3xl`).
- **Trigger:** Tombol `+ Tambah Gudang / Zona`.
- **Field:** Kode Gudang, Nama Gudang, Tipe Alokasi Material, Suhu Standar Ruang (°C), Kelembapan Standar (RH %), Alamat/Lokasi Pabrik, Struktur Baris/Rak/Bin.
