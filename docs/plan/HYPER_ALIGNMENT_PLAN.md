# HYPER-ALIGNMENT STRATEGY: Legacy to Event-Driven V4
## World-Class ERP Migration & Stabilization Plan

Berdasarkan audit teknis, strategi paling efektif untuk mencapai **100% Kesesuaian** dengan ekspektasi adalah menggunakan **Vertical Slicing (Module-by-Module)**. 

### Kenapa Vertical Slicing?
1. **Atomic Validation**: Kita memastikan Database, Backend, dan Frontend sinkron sempurna di satu divisi sebelum pindah ke divisi lain. Ini mencegah "Relational Drift" di mana DB sudah siap tapi UI ternyata tidak kompatibel.
2. **Immediate Testing**: Departemen terkait (misal: SCM) bisa langsung mencoba sistem baru tanpa menunggu seluruh ERP selesai.
3. **Traceable Communication**: Protokol komunikasi (Event Bus) antar modul dibangun secara organik saat integrasi antar modul terjadi.

---

## Rencana Kerja (Phase Breakdown)

### Fase 1: SCM (Procurement & Vendor) Hardening
**Target**: Menghilangkan gap pada siklus pembelian dan master data supplier.
*   **Database**: 
    *   Implementasi model `PurchaseReturn` dan `PurchaseReturnItem`.
    *   Ekstensi `Supplier` (Provinsi, Kota, Alamat dipisah secara struktural).
*   **Backend**: 
    *   `PurchaseReturnService`: Validasi qty tersedia vs qty retur.
    *   `DP & Payment`: Otomasi pembuatan Invoice `PAYABLE` saat PO disetujui.
*   **Frontend**: 
    *   Form PO dengan "Item Cart" yang interaktif.
    *   Supplier Scorecard dashboard.

### Fase 2: Warehouse (Inventory & Logistics) Synchronization
**Target**: Akurasi stok 100% dan bukti fisik logistik.
*   **Database**: 
    *   Penambahan field `evidenceUrl` (Foto) pada model `Shipment`.
    *   Linkage antara `PurchaseReturn` fisik dengan stok gudang.
*   **Backend**: 
    *   `StockOpnameService`: Logic persetujuan Manager dengan PIN.
    *   `TransferOrder`: Interlock stok antar gudang.
*   **Frontend**: 
    *   Workbench Warehouse Inbound/Outbound.
    *   UI Stok Opname dengan perbandingan real-time.

### Fase 3: Production (Execution) Granularity
**Target**: Presisi formula dan pelacakan material per stage.
*   **Database**: 
    *   Model `ProductionStepDetail` untuk menyimpan data unik per stage (Mixing vs Filling).
    *   Pemisahan `inputQty` untuk bahan ruahan vs bahan kemas.
*   **Backend**: 
    *   **Upscale Intelligence**: Otomasi perhitungan formula berdasarkan target yield.
    *   Stage-specific Validators (Filling tidak bisa jalan tanpa Bulk dari Mixing).
*   **Frontend**: 
    *   **Production Workbench V4**: UI khusus Operator dengan input yang disesuaikan per stage (Mixing/Filling/Packing).

### Fase 4: Unified Communication Protocol & E2E Audit
**Target**: Sinkronisasi total dan keamanan audit.
*   **Protocol**: 
    *   Standardisasi `EventEmitter2` untuk semua transisi status (misal: PO Received -> Trigger Stock Increase -> Trigger Finance Payable).
*   **Security**: 
    *   Audit Log yang mencatat siapa, kapan, dan perubahan apa di setiap modul.
    *   Final stress testing untuk memastikan Database UUID tetap performant.

---

## Workflow Eksekusi Per Divisi
Setiap fase akan mengikuti workflow "The Golden Thread":
1.  **Schema Alignment**: Update `prisma.schema` dan push ke Database.
2.  **API Hardening**: Update DTO, Controller, dan Service (Backend).
3.  **UI/UX Injection**: Implementasi standar "Rigid Shell Architecture" pada Frontend.
4.  **E2E Validation**: Running test suite untuk memastikan input/output 100% match dengan @LEGACY_ERP_AUDIT.md.

---
**Prepared by**: Antigravity (World-Class Web Dev)
**Status**: Ready for Execution
