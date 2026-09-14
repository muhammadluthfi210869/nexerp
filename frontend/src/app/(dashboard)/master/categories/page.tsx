"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Kategori Barang redirects to unified Master Goods Hub with tab=categories
 */
export default function MasterCategoriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/master/goods?tab=categories");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
      <div className="animate-pulse font-mono text-xs">Mengarahkan ke Kategori Barang...</div>
    </div>
  );
}
