# Porto Aureon ERP Frontend Walkthrough (Fase 0)

Fase ini membangun kerangka kerja (framework) utama yang akan menopang seluruh modul ERP. Fokus utama adalah pada **Data-Flow Integrity** dan **Precision UX**.

## 🏗️ Struktur Arsitektur
*   `/src/lib/api.ts`: Jembatan aman ke Backend dengan interceptor otomatis.
*   `/src/components/providers`: Mengelola global server-state (React Query).
*   `/src/components/layout/sidebar.tsx`: Navigasi berbasis Role (RBAC).
*   `/src/app/login`: Gerbang masuk terenkripsi secara visual.

## 🔒 Protokol Autentikasi
Sistem mendeteksi status login melalui `localStorage`. Saat berhasil, `access_token` dan data `user` disimpan. Seluruh request API berikutnya akan membawa identitas ini secara otomatis.

## 🌓 Design DNA
Varian `Zinc-950` untuk latar belakang dan `Emerald/Blue` sebagai aksen status. Desain ini mengikuti protokol **Binary Audit Vision** (v7.1).

---
**Status Sesi:** `v8.0 Infrastructure Confirmed`
**Next step:** Implementasi modul eksekutif (Recharts) untuk Dashboard.
