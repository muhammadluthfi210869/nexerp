# ULTIMATE UI PARITY & CLARITY RESTORATION PLAN

## 1. Audit Result: The "Messiness" Root Causes
Setelah melakukan audit mendalam pada codebase `frontend`, ditemukan beberapa faktor utama yang membuat UI saat ini terasa "berantakan" (berbeda jauh dengan prototipe):

*   **Excessive Styling Overload**: Penggunaan `font-black`, `italic`, dan `tracking-tighter` yang berlebihan pada hampir semua elemen teks menghancurkan hirarki visual dan kejelasan.
*   **Visual DNA Mismatch**: Code saat ini menggunakan gaya "Cyberpunk/High-Tech" (efek kaca, glow intens, border radius ekstrim 3rem) sedangkan prototipe menggunakan gaya "Sleek Modern Minimalist" (solid white surfaces, subtle shadows, clean bento-style).
*   **Global Font Weight**: Penerapan `font-semibold` pada level `body` di `globals.css` membuat UI terasa berat dan menghilangkan kontras antara teks informasi dan heading.
*   **Sidebar Inconsistency**: Sidebar saat ini menggunakan accordion yang kompleks dan visual yang tipis, sedangkan prototipe menggunakan grouping sederhana dengan visual active state berupa pill hitam yang kontras dan bold.

## 2. Visual DNA Transformation (Plek Ketiplek)

### A. Typography System
*   **Primary Font**: Plus Jakarta Sans (Tetap digunakan namun diperbaiki implementasinya).
*   **Standardization**:
    *   `Body Text`: Kembali ke `font-normal` (400) atau `font-medium` (500).
    *   `Headings`: Gunakan `font-bold` (700) atau `font-extrabold` (800) tanpa italic.
    *   **ELIMINASI**: Hapus penggunaan `font-black` (900) pada data tabular dan `italic` pada label fungsional. Kejelasan (Clarity) adalah prioritas.
    *   `Tracking`: Kembalikan ke `normal` atau `tight`, hapus `tracking-widest` pada konten utama.

### B. Color Palette & Surface
*   **Background**: Gunakan Light Gray yang sangat bersih (#F8FAFC) untuk area kerja.
*   **Cards (Bento Style)**: Putih solid (#FFFFFF) dengan border tipis (#E2E8F0) dan radius yang lebih masuk akal (`rounded-2xl`). Hapus semua efek `glass-premium` dan `backdrop-blur`.
*   **Active State**: Gunakan Dark Navy/Black (#0F172A) untuk elemen aktif (Pill background pada sidebar).
*   **Status Indicators**: Gunakan Badge solid dengan warna yang konsisten (Emerald untuk stabil, Orange untuk warning, Rose untuk alert).

### C. Layout & Componentry
*   **Sidebar Overhaul**: 
    *   Warna background solid white.
    *   Logo "4 AUREON ERP" yang bold di pojok kiri atas.
    *   Menu items dengan font bold sans, icon di kiri, dan pill active state warna hitam.
*   **Header Navigation**: Putih bersih, menyatu dengan layout, dengan Search Bar yang memiliki radius besar (pill shape) di tengah.
*   **Metric Cards**: Layout yang bersih, angka besar yang bold, label yang jelas di atas/bawah, tanpa glow yang mengganggu.

## 3. Implementation Roadmap

### Phase 1: Global Reset (The Foundation)
1.  **Modify `globals.css`**:
    *   Reset `body` font weight ke normal.
    *   Bersihkan variabel warna agar lebih cerah (vibrant) namun tetap profesional.
    *   Definisikan utility class `.bento-card` untuk standarisasi semua box di ERP.
2.  **Tailwind Sync**: Pastikan konfigurasi font dan radius di `tailwind.config.ts` sinkron dengan prototipe.

### Phase 2: Core Layout Re-engineering
1.  **Sidebar V2**: Membangun ulang Sidebar agar 100% identik dengan prototipe gambar (pill selection, bold grouping).
2.  **Unified Header**: Implementasi search bar terpusat dan indikator status "STABIL v2.0" di pojok kanan atas.

### Phase 3: Module Cleanup (SCM, R&D, Finance)
1.  **Refactor Page Architecture**:
    *   Migrasi dari "High-Tech/Cyber" look ke "Modern Corporate" look.
    *   Sederhanakan tabel: Fokus pada data, hilangkan dekorasi yang tidak perlu.
    *   Standardisasi Heading: Gunakan hirarki H1-H3 yang jelas dan konsisten.

## 4. Quality Audit Checklist
- [ ] **Clarity Test**: Apakah data terpenting bisa dibaca tanpa distraksi visual?
- [ ] **Alignment**: Apakah semua elemen sejajar (grid-based)?
- [ ] **Consistency**: Apakah semua tombol, badge, dan card memiliki gaya yang sama?
- [ ] **Visual Hierarchy**: Apakah mata user diarahkan ke informasi yang benar (bukan ke dekorasi)?

---
**Rencana ini dirancang untuk mengembalikan Aureon ERP ke jalur desain yang sudah disetujui: Bersih, Rapi, Bold, dan Sangat Mudah di-audit.**
