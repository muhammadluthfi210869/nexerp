"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Master Vendors redirects to unified Master Suppliers Hub
 */
export default function MasterVendorsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/master/suppliers");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
      <div className="animate-pulse font-mono text-xs">Mengarahkan ke Master Supplier & Vendor...</div>
    </div>
  );
}
