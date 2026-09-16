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
    ];
  },
};

export default nextConfig;
