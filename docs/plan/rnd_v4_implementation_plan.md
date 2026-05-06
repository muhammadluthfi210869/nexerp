# Rencana Implementasi Strategis: Modul R&D Integrated System V4 (Revised)

## 1. Pendahuluan
Dokumen ini merancang transformasi sistem R&D dari sistem manual menjadi sistem terintegrasi berbasis **Phase-Based Manufacturing** dan **Event-Driven Communication**. Revisi ini fokus pada integritas data (normalisasi) dan pemisahan jalur Sample vs Produksi Massal.

---

## 2. Arsitektur Data (Database Schema)
Pembaruan pada `rnd.prisma` untuk mendukung struktur hirarki dan relasi antar-divisi:

### A. Model: Formula & FormulaPhase
- **Formula:**
    - `id`: String (Format: F-YYMM-XXX)
    - `sampleRequestId`: UUID (Relasi mutlak ke PNF BusDev)
    - `targetYieldGram`: Decimal (Hanya digunakan sebagai basis kalkulasi dinamis)
    - `status`: Enum (DRAFT, WAITING_APPROVAL, SAMPLE_LOCKED, PRODUCTION_LOCKED, SUPERSEDED)
    - `lockedById`: UUID (Relation to Head R&D)
- **FormulaPhase:**
    - `prefix`: String (A, B, C...)
    - `customName`: String (e.g., "Water Phase")
    - `instructions`: String (Markdown/LongText)
    - `order`: Int

### B. Model: FormulaItem (Bahan Baku)
- `phaseId`: UUID
- `materialId`: UUID? (Opsional jika bahan dummy)
- `isDummy`: Boolean (Flag untuk bahan lab baru)
- `dummyName`: String?
- `dummyPrice`: Decimal?
- `dosagePercentage`: Decimal (Precision: 10,5)
- **Koreksi CS:** Tidak menyimpan `weightGram`. Berat dihitung *on-the-fly* di layer aplikasi: `(% * CurrentYield)`.

### C. Model: QCParameter (Target Mutu)
- Relasi 1-to-1 dengan `Formula`.
- `targetPh`: String
- `targetViscosity`: String
- `targetColor`: String
- `targetAroma`: String
- `appearance`: String

---

## 3. Alur Bisnis & Hard-Gates (Logic)

### Fase 1: Task Intake (Inbox)
- **Gate:** R&D Inbox hanya menampilkan PNF jika `isPaymentVerified` (Finance) bernilai `true`.
- **Action:** Klik `[Terima]` otomatis membuat `Formula V1` yang terikat pada `sampleRequestId`.

### Fase 2: Formulasi & Kalkulasi
- **Math Engine:** Frontend menghitung berat secara dinamis berdasarkan input `Target Yield`.
- **HPP Tracker:** Mengambil harga SCM. Jika `isDummy`, user menginput harga estimasi. Tampil label ⚠️ `ESTIMATED HPP`.

### Fase 3: Layered Locking (Gembok Berlapis)
1. **SAMPLE_LOCKED:**
   - Diaktifkan oleh Head R&D untuk pengiriman sampel.
   - **Izin:** Boleh mengandung bahan `isDummy: true`.
   - **Output:** Generate "Sample Label" & "Instruksi Lab".
2. **PRODUCTION_LOCKED:**
   - Diaktifkan hanya saat status BusDev = `DP_PRODUCTION_PAID`.
   - **Hard-Gate:** Sistem menolak penguncian jika masih ada `isDummy: true`.
   - **Requirement:** SCM wajib mengganti dummy item dengan item inventory riil sebelum fase ini.
   - **Output:** Generate official BOM & Digital Batch Record.

---

## 4. Protokol Komunikasi & Versioning

| Aksi User | Efek Sistem | Status Versi Sebelumnya |
| :--- | :--- | :--- |
| `[Request Revisi]` | Clone V(n) ke V(n+1) | V(n) berubah menjadi `SUPERSEDED` |
| `[Kirim Sampel]` | Notify BusDev + Tracking No | - |
| `[Lock Production]` | Push INCI ke Legal & BOM ke SCM | - |

---

## 5. Antarmuka Pengguna (Frontend)

### A. Phase Builder (Lab Workspace)
- **Input:** Prefix Alfabetis otomatis (A, B, C) + Input Nama Fase Kustom.
- **Validation:** Total persentase harus 100.00% sebelum tombol `[Submit]` muncul.

### B. Digital Batch Record (Tablet View)
- Checklist interaktif untuk operator Mixing.
- Menarik data `QCParameter` sebagai standar kelulusan tes di ruang produksi.

---

## 6. Rencana Pengujian (QA Phase)
1. **Normalization Test:** Pastikan mengubah `targetYieldGram` di header formula langsung mengubah seluruh angka gram di tabel tanpa *save* ke database.
2. **Locking Logic Test:** Mencoba melakukan `PRODUCTION_LOCKED` pada formula yang mengandung bahan dummy (Ekspektasi: Fail).
3. **Revision Test:** Memastikan hanya ada satu versi formula yang aktif (non-superseded) untuk satu PNF.
4. **Integration Test:** Verifikasi data INCI yang masuk ke dashboard Legal sesuai dengan urutan persentase terbesar di Phase Builder.
