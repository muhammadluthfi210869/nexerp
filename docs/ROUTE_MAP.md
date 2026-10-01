# NEX ERP — Complete System Route Registry (Screaming Architecture Map)

This canonical registry maps all active divisions, menu items, routes, and physical page paths across the entire ERP system.
**AI Agents MUST reference this file to locate screens and avoid scanning or guessing.**

---

## 1. Master Data (`/master`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Pelanggan / Customer | `/master/customers` | `frontend/src/app/(dashboard)/master/customers/page.tsx` | Customer Master, Credit Limit, TOP, Contacts |
| Supplier & Vendor | `/master/suppliers` | `frontend/src/app/(dashboard)/master/suppliers/page.tsx` | Supplier Master, Bank Accounts, Lead Time |
| Master Barang & Kategori | `/master/goods` | `frontend/src/app/(dashboard)/master/goods/page.tsx` | Goods & Materials Master, Categories, Pricing |
| Gudang & Lokasi | `/master/warehouses` | `frontend/src/app/(dashboard)/master/warehouses/page.tsx` | Multi-warehouse, Zones, Storage Racks |
| Pengguna & Personel | `/master/personnel` | `frontend/src/app/(dashboard)/master/personnel/page.tsx` | System Users, Roles, Employees |
| Kategori Penjualan | `/master/sales-category` | `frontend/src/app/(dashboard)/master/sales-category/page.tsx` | Sales Categories & Pipeline Stages |
| Bagan Akun (CoA) | `/finance/accounting/coa` | `frontend/src/app/(dashboard)/finance/accounting/coa/page.tsx` | Chart of Accounts & Auto-Journal Rules |
| KPI Departemen | `/master/kpi-department` | `frontend/src/app/(dashboard)/master/kpi-department/page.tsx` | Department Level KPI Config |
| KPI Individu | `/master/kpi-individual` | `frontend/src/app/(dashboard)/master/kpi-individual/page.tsx` | Individual Employee Scorecards |

---

## 2. Penjualan & CRM (`/penjualan`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Buku Tamu | `/penjualan/guest-book` | `frontend/src/app/(dashboard)/penjualan/guest-book/page.tsx` | Walk-in / Visitor Registration |
| Leads OmniCRM | `/samples/omni-crm` | `frontend/src/app/(dashboard)/samples/omni-crm/page.tsx` | WhatsApp Coexistence & CRM Pipeline |
| Client Manager | `/penjualan/client-manager` | `frontend/src/app/(dashboard)/penjualan/client-manager/page.tsx` | Client Lifecycle (Sample, Produksi, RO) |
| Client Lost | `/penjualan/lost` | `frontend/src/app/(dashboard)/penjualan/lost/page.tsx` | Lost Leads & Reasons |
| Sales Orders | `/penjualan/sales-orders` | `frontend/src/app/(dashboard)/penjualan/sales-orders/page.tsx` | Commercial Sales Order Booking |
| Penjualan Sample | `/penjualan/sample-sales` | `frontend/src/app/(dashboard)/penjualan/sample-sales/page.tsx` | R&D Formulation Sample Sales |
| DP Penjualan | `/penjualan/down-payment` | `frontend/src/app/(dashboard)/penjualan/down-payment/page.tsx` | Customer Down Payment Invoices |
| Faktur Penjualan | `/penjualan/faktur-penjualan` | `frontend/src/app/(dashboard)/penjualan/faktur-penjualan/page.tsx` | AR Tax & Commercial Sales Invoices |
| Bayar Penjualan | `/penjualan/bayar-penjualan` | `frontend/src/app/(dashboard)/penjualan/bayar-penjualan/page.tsx` | AR Settlement & Customer Receipts |
| Retur Penjualan | `/penjualan/retur-penjualan` | `frontend/src/app/(dashboard)/penjualan/retur-penjualan/page.tsx` | Credit Notes & Goods Return |
| Target Penjualan | `/penjualan/sales-target` | `frontend/src/app/(dashboard)/penjualan/sales-target/page.tsx` | Sales Target vs Actual Realization |

---

## 3. Pembelian & Pengadaan / SCM (`/pembelian`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Permintaan Pembelian (PR) | `/pembelian/purchase-requests` | `frontend/src/app/(dashboard)/pembelian/purchase-requests/page.tsx` | Purchase Requisitions |
| Buat Pembelian (PO) | `/pembelian/scm-pembelian` | `frontend/src/app/(dashboard)/pembelian/scm-pembelian/page.tsx` | Vendor Purchase Orders |
| DP Pembelian | `/pembelian/dp-pembelian` | `frontend/src/app/(dashboard)/pembelian/dp-pembelian/page.tsx` | Vendor Down Payments |
| Faktur Pembelian | `/pembelian/faktur-pembelian` | `frontend/src/app/(dashboard)/pembelian/faktur-pembelian/page.tsx` | AP Vendor Bills |
| Bayar Pembelian | `/pembelian/bayar-pembelian` | `frontend/src/app/(dashboard)/pembelian/bayar-pembelian/page.tsx` | AP Payment Vouchers |
| Retur Pembelian | `/pembelian/purchase-returns` | `frontend/src/app/(dashboard)/pembelian/purchase-returns/page.tsx` | Debit Notes & Return to Vendor |
| Kebutuhan Barang (MRP) | `/pembelian/kebutuhan` | `frontend/src/app/(dashboard)/pembelian/kebutuhan/page.tsx` | Material Requirements Planning |

---

## 4. Gudang & Logistik (`/warehouse`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Stok Barang & Bahan | `/warehouse/stok` | `frontend/src/app/(dashboard)/warehouse/stok/page.tsx` | Live Inventory Balance & Lots |
| Inbound Goods | `/warehouse/inbound` | `frontend/src/app/(dashboard)/warehouse/inbound/page.tsx` | Goods Receipt & Receiving Slip |
| Pengiriman (Release) | `/warehouse/release` | `frontend/src/app/(dashboard)/warehouse/release/page.tsx` | Dispatch & Delivery Orders |
| Transfer Gudang | `/warehouse/pindah-gudang` | `frontend/src/app/(dashboard)/warehouse/pindah-gudang/page.tsx` | Inter-Warehouse Stock Transfer |
| Mutasi Stok | `/warehouse/mutasi-stok` | `frontend/src/app/(dashboard)/warehouse/mutasi-stok/page.tsx` | Inventory Card & Movement Log |
| Penyesuaian Stok | `/warehouse/adjustment` | `frontend/src/app/(dashboard)/warehouse/adjustment/page.tsx` | Stock Opname & Scrap Adjustments |

---

## 5. Keuangan & Akuntansi (`/finance`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Command Center | `/finance/dashboard` | `frontend/src/app/(dashboard)/finance/dashboard/page.tsx` | Cash Flow & Financial Overview |
| Chart of Accounts (CoA) | `/finance/accounting/coa` | `frontend/src/app/(dashboard)/finance/accounting/coa/page.tsx` | General Ledger Account Tree |
| Jurnal Umum | `/finance/jurnal-umum` | `frontend/src/app/(dashboard)/finance/jurnal-umum/page.tsx` | Manual & Auto Journal Entries |
| Buku Besar (Ledger) | `/finance/ledger` | `frontend/src/app/(dashboard)/finance/ledger/page.tsx` | General Ledger Statements |
| Kas Bank Masuk | `/finance/cash-in` | `frontend/src/app/(dashboard)/finance/cash-in/page.tsx` | Bank & Cash Receipts |
| Kas Bank Keluar | `/finance/cash-out` | `frontend/src/app/(dashboard)/finance/cash-out/page.tsx` | Cash Disbursements |
| Rekonsiliasi Bank | `/finance/bank-reconciliation` | `frontend/src/app/(dashboard)/finance/bank-reconciliation/page.tsx` | Bank Statement vs Ledger Balancing |
| Pengajuan Dana | `/finance/fund-requests` | `frontend/src/app/(dashboard)/finance/fund-requests/page.tsx` | Petty Cash & Budget Requests |
| Laba Rugi | `/finance/laba-rugi` | `frontend/src/app/(dashboard)/finance/laba-rugi/page.tsx` | Income Statement / P&L |
| Aset Tetap | `/finance/assets` | `frontend/src/app/(dashboard)/finance/assets/page.tsx` | Fixed Assets & Depreciation |

---

## 6. R&D & Produksi (`/rnd`, `/production`, `/samples`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Jadwal Produksi | `/production/schedule` | `frontend/src/app/(dashboard)/production/schedule/page.tsx` | Master Production Schedule |
| Digital Batch Record | `/production/batch-records` | `frontend/src/app/(dashboard)/production/batch-records/page.tsx` | Batch Manufacturing Records |
| Formulasi Repository | `/samples/repository` | `frontend/src/app/(dashboard)/samples/repository/page.tsx` | Cosmetic Formulations & BOM |
| Buat Formulasi | `/samples/formula` | `frontend/src/app/(dashboard)/samples/formula/page.tsx` | Formula Laboratory Builder |
| Project Monitoring R&D | `/rnd/project-monitoring` | `frontend/src/app/(dashboard)/rnd/project-monitoring/page.tsx` | R&D Project Timeline, Folder & Shipping |
| Pengujian Lab | `/quality/lab-test` | `frontend/src/app/(dashboard)/quality/lab-test/page.tsx` | Stability & QC Testing |

---

## 7. Pusat Persetujuan & Kendali Mutu (`/approvals`, `/quality`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Approval Center | `/approvals/*` | `frontend/src/app/(dashboard)/approvals/[slug]/page.tsx` | Multi-tier Approval Hub (PO, PR, Sales) |
| Checklist Progress | `/quality/checklist-progress` | `frontend/src/app/(dashboard)/quality/checklist-progress/page.tsx` | Live Production Checklist |
| Checklist Tracking | `/quality/checklist-tracking` | `frontend/src/app/(dashboard)/quality/checklist-tracking/page.tsx` | SLA & Delay Tracking |

---

## 8. HR & Personalia (`/hr`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Executive Dashboard HR | `/hr/dashboard` | `frontend/src/app/(dashboard)/hr/dashboard/page.tsx` | Executive KPI Cards & Divisional Audit |
| Data Pegawai & Kompensasi | `/hr/employees` | `frontend/src/app/(dashboard)/hr/employees/page.tsx` | Staff Records, Upah Tetap, Transport, BPJS, PPh 21, Kasbon |
| Rekrutmen & Pelamar (ATS) | `/hr/recruitment` | `frontend/src/app/(dashboard)/hr/recruitment/page.tsx` | Candidate Pipeline, CV Review, Interview & Status Reminders |
| Pelatihan & Onboarding | `/hr/training` | `frontend/src/app/(dashboard)/hr/training/page.tsx` | Onboarding 3 Hari, Jam Training, Goals & Sertifikat |
| Payroll & Slip Gaji | `/hr/payroll` | `frontend/src/app/(dashboard)/hr/payroll/page.tsx` | Monthly Payroll Workbench, PPh 21 UMR Threshold, Cetak Slip |
| Evaluasi KPI Karyawan | `/hr/kpi` | `frontend/src/app/(dashboard)/hr/kpi/page.tsx` | Individual & Department Scorecards |
| Izin, Cuti & Lembur | `/hr/tickets` | `frontend/src/app/(dashboard)/hr/tickets/page.tsx` | Leave, Overtime & Reimbursement Ticket Approvals |

---

## 9. Digital Marketing & Brands (`/marketing`)
| Menu Name | Route Path | Physical Entrypoint | Purpose / Entity |
| :--- | :--- | :--- | :--- |
| Dashboard Marketing | `/marketing/dashboard` | `frontend/src/app/(dashboard)/marketing/dashboard/page.tsx` | Multi-Brand KPI Overview |
| Management Task | `/marketing/management-task/overview` | `frontend/src/app/(dashboard)/marketing/management-task/overview/page.tsx` | Team Kanban & Workspaces |
| Brand Workspace | `/marketing/reports/workspace` | `frontend/src/app/(dashboard)/marketing/reports/workspace/BrandWorkspace.tsx` | Dreamlab & Toribio Reporting |
