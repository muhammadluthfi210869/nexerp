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
      // Legacy ERP Route Aliases (Fase 1: Master Data & Tax/Bank Parity - 0 404s)
      { source: "/tax-setup", destination: "/master/tax-rates" },
      { source: "/bank-account-manage", destination: "/finance/bank-accounts" },
      { source: "/bank-account-manage/create", destination: "/finance/bank-accounts" },
      { source: "/goods-manage", destination: "/master/goods" },
      { source: "/goods-category-manage", destination: "/master/categories" },
      { source: "/supplier-manage", destination: "/master/suppliers" },
      { source: "/supplier-category-manage", destination: "/master/categories" },
      { source: "/customer-manage", destination: "/master/customers" },
      { source: "/customer-category-manage", destination: "/master/customers" },
      { source: "/customer-my-manage", destination: "/master/customers" },
      { source: "/warehouse-manage", destination: "/master/warehouses" },
      { source: "/warehouse-access-manage", destination: "/master/warehouses" },
      { source: "/coa-manage", destination: "/finance/accounting/coa" },
    ];
  },
};

export default nextConfig;
