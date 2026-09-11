// next.config.production-hotfix.ts — EMERGENCY ONLY
//
// Use ONLY when build is blocked by pre-existing TypeScript errors that are
// unrelated to the current change. See docs/RUNBOOK-DEPLOY-DAN-TEST-NEXERP.md
// §B "Emergency build override".
//
// Per runbook §B workflow:
//   1. Backup:  cp frontend/next.config.ts /tmp/next.config.ts.original
//   2. Swap:     cp tmp/next.config.production-hotfix.ts frontend/next.config.ts
//   3. Build:    sudo docker compose build frontend
//   4. Restore:  cp /tmp/next.config.ts.original frontend/next.config.ts
//
// Do NOT leave ignoreBuildErrors enabled as a permanent config — it hides
// real type errors that may break production at runtime.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // EMERGENCY: skip TS check during build
  },
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
    ];
  },
};

export default nextConfig;
