"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MasterSalesCategoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/penjualan/sales-target?tab=categories");
  }, [router]);

  return (
    <div className="p-8 text-center text-slate-400 tabular-nums text-xs">
      Mengarahkan ke Kategori Penjualan...
    </div>
  );
}
