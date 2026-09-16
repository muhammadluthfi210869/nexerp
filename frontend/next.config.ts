import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-slider",
      "recharts",
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      // =========================================================================
      // FASE 1: MASTER DATA COMPREHENSIVE PARITY (35/35 URLs — 0 404s)
      // =========================================================================
      // 1. Kelola Barang
      { source: "/goods-manage", destination: "/master/goods" },
      { source: "/goods-manage/create", destination: "/master/goods?action=create" },
      { source: "/goods-category-manage", destination: "/master/goods?tab=categories" },
      { source: "/goods-category-manage/create", destination: "/master/goods?tab=categories&action=create" },

      // 2. Kelola Supplier & Vendor
      { source: "/supplier-manage", destination: "/master/suppliers" },
      { source: "/supplier-manage/create", destination: "/master/suppliers?action=create" },
      { source: "/supplier-category-manage", destination: "/master/suppliers?tab=categories" },
      { source: "/supplier-category-manage/create", destination: "/master/suppliers?tab=categories&action=create" },

      // 3. Kelola Pelanggan / Customer
      { source: "/customer-manage", destination: "/master/customers?tab=all" },
      { source: "/customer-manage/create", destination: "/master/customers?tab=all&action=create" },
      { source: "/customer-my-manage", destination: "/master/customers?tab=my" },
      { source: "/customer-my-manage/create", destination: "/master/customers?tab=my&action=create" },
      { source: "/customer-category-manage", destination: "/master/customers?tab=categories" },
      { source: "/customer-category-manage/create", destination: "/master/customers?tab=categories&action=create" },

      // 4. Kelola Gudang
      { source: "/warehouse-manage", destination: "/master/warehouses?tab=warehouses" },
      { source: "/warehouse-manage/create", destination: "/master/warehouses?tab=warehouses&action=create" },
      { source: "/warehouse-access-manage", destination: "/master/warehouses?tab=access" },

      // 5. Kelola Pengguna & Hak Akses
      { source: "/user-manage", destination: "/master/personnel?tab=users" },
      { source: "/user-manage/create", destination: "/master/personnel?tab=users&action=create" },
      { source: "/role-manage", destination: "/master/personnel?tab=roles" },
      { source: "/role-manage/create", destination: "/master/personnel?tab=roles&action=create" },

      // 6. Kelola CoA & Akuntansi Biaya
      { source: "/coa-manage", destination: "/finance/accounting/coa" },
      { source: "/coa-manage/create", destination: "/finance/accounting/coa?action=create" },
      { source: "/coa-auto-manage", destination: "/finance/accounting/coa-auto" },
      { source: "/cost-allocation-setup", destination: "/finance/cost-allocation-setup" },

      // 7. Kelola Kas, Bank & Pajak
      { source: "/bank-account-manage", destination: "/finance/bank-accounts" },
      { source: "/bank-account-manage/create", destination: "/finance/bank-accounts?action=create" },
      { source: "/tax-setup", destination: "/master/tax-rates" },

      // 8. Kelola Aset Tetap & Compliance
      { source: "/asset-register", destination: "/finance/assets" },
      { source: "/asset-register/create", destination: "/finance/assets?action=create" },
      { source: "/compliance-asset", destination: "/finance/compliance-asset" },

      // 9. Kelola Penjualan Master
      { source: "/sales-category", destination: "/master/goods?tab=categories" },
      { source: "/sales-category/create", destination: "/master/goods?tab=categories&action=create" },
      { source: "/sales-target", destination: "/penjualan/sales-target" },
      { source: "/sales-target/create", destination: "/penjualan/sales-target?action=create" },

      // =========================================================================
      // FASE 2: COMMERCIAL, CRM & BUSSDEV PARITY (26/26 URLs — 0 404s)
      // =========================================================================
      // 1. Buku Tamu (Guest Book)
      { source: "/guest-book", destination: "/penjualan/guest-book" },
      { source: "/guest-book/create", destination: "/penjualan/guest-book?action=create" },

      // 2. Client Manager & Pipelines
      { source: "/client-sample", destination: "/penjualan/client-manager?tab=sample" },
      { source: "/client-repeat-order", destination: "/penjualan/client-manager?tab=ro" },
      { source: "/client-lost", destination: "/penjualan/lost" },

      // 3. Leads Management
      { source: "/leads", destination: "/penjualan/crm-leads" },
      { source: "/leads/create", destination: "/penjualan/crm-leads?action=create" },

      // 4. Sales Orders & Kontrak Maklon
      { source: "/sales", destination: "/penjualan/sales-orders" },
      { source: "/sales/create", destination: "/penjualan/sales-orders?action=create" },

      // 5. Down Payment (DP Penjualan)
      { source: "/sales-down-payment", destination: "/penjualan/down-payment" },
      { source: "/sales-down-payment/create", destination: "/penjualan/down-payment?action=create" },

      // 6. Faktur Penjualan (Sales Invoice) & Pembayaran
      { source: "/sales-invoice", destination: "/penjualan/faktur-penjualan" },
      { source: "/sales-payment", destination: "/penjualan/bayar-penjualan" },

      // 7. Retur Penjualan
      { source: "/sales-return", destination: "/penjualan/retur-penjualan" },
      { source: "/sales-return/create", destination: "/penjualan/retur-penjualan?action=create" },
      { source: "/sales-return-in", destination: "/penjualan/sales-return-in" },

      // 8. Permintaan & Penjualan Sample Maklon
      { source: "/sales-sample", destination: "/penjualan/sample-sales" },
      { source: "/sales-sample/create", destination: "/penjualan/sample-sales?action=create" },
      { source: "/sales-sample-payment", destination: "/penjualan/sample-fee" },

      // 9. Collections & AR Follow-Up
      { source: "/collections", destination: "/finance/collections" },

      // 10. Costing & Pra Produksi
      { source: "/job-order-costing", destination: "/penjualan/job-order-costing" },

      // 11. Laporan BusDev & Financial Summary
      { source: "/report-follow-up-customer", destination: "/reports/busdev-follow-up" },
      { source: "/report-guest-book", destination: "/reports/guest-book" },
      { source: "/report-sales-summary", destination: "/reports/sales-summary" },

      // =========================================================================
      // FASE 3: R&D, FORMULASI, HKI & DESAIN KEMASAN (11/11 URLs — 0 404s)
      // =========================================================================
      // 1. Dashboard R&D & Sample
      { source: "/dashboard-rnd", destination: "/rnd/dashboard" },
      { source: "/dashboard-sample", destination: "/penjualan/pipeline-rnd" },

      // 2. Batch Record Pra-Produksi
      { source: "/batch-record", destination: "/production/batch-records" },
      { source: "/batch-record/create", destination: "/production/batch-records?action=create" },

      // 3. Kelola Desain & Kemasan
      { source: "/design-manage", destination: "/samples/design" },
      { source: "/design-manage/create", destination: "/samples/design?action=create" },

      // 4. Formulasi R&D
      { source: "/formulation", destination: "/samples/formula" },
      { source: "/formulation-adjustment", destination: "/samples/formula?mode=adjustment" },
      { source: "/formulation-manage", destination: "/samples/formula?mode=manage" },

      // 5. Permintaan HPP (COGS Request)
      { source: "/request-cogs", destination: "/finance/cogs-request-rnd" },
      { source: "/request-cogs/create", destination: "/finance/cogs-request-rnd?action=create" },

      // =========================================================================
      // FASE 4: SCM, PERMINTAAN & PEMBELIAN PO (19/19 URLs — 0 404s)
      // =========================================================================
      // 1. Pemesanan Pembelian (PO)
      { source: "/purchase", destination: "/pembelian/scm-pembelian" },
      { source: "/purchase/create", destination: "/pembelian/scm-pembelian/create" },
      { source: "/purchase-approval", destination: "/approvals/purchase-approval" },

      // 2. Permintaan Barang (Internal Requisition)
      { source: "/goods-request", destination: "/inventory/requisition" },
      { source: "/goods-request/create", destination: "/inventory/requisition?action=create" },
      { source: "/goods-request-approval", destination: "/inventory/requisition?action=approval" },

      // 3. Permintaan Pembelian (Purchase Requisition)
      { source: "/purchase-request", destination: "/pembelian/purchase-requests" },
      { source: "/purchase-request/create", destination: "/pembelian/purchase-requests?action=create" },
      { source: "/purchase-request-approval", destination: "/approvals/purchase-request" },

      // 4. DP Pembelian
      { source: "/purchase-down-payment", destination: "/pembelian/dp-pembelian" },
      { source: "/purchase-down-payment/create", destination: "/pembelian/dp-pembelian?action=create" },

      // 5. Faktur & Pembayaran Pembelian
      { source: "/purchase-invoice", destination: "/pembelian/faktur-pembelian" },
      { source: "/purchase-payment", destination: "/pembelian/bayar-pembelian" },

      // 6. Retur Pembelian
      { source: "/purchase-return", destination: "/pembelian/purchase-returns" },
      { source: "/purchase-return/create", destination: "/pembelian/purchase-returns?action=create" },
      { source: "/purchase-return-approval", destination: "/approvals/purchase-return" },
      { source: "/purchase-return-out", destination: "/inventory/outbound?type=purchase-return" },

      // 7. Penerimaan Barang 3-Pilar & Laporan
      { source: "/purchase-in", destination: "/pembelian/receiving" },
      { source: "/report-goods-receipt", destination: "/reports/goods-receipt" },
    ];
  },
};

export default nextConfig;
