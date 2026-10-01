import React from "react";

export function GoodsRequestApprovalEmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-slate-400">Belum ada permintaan barang pada sistem.</p>
      <p className="text-xs text-slate-400 mt-2">
        Rincian item per bon belum tersedia dari endpoint daftar (scm/goods-requirements).
      </p>
    </div>
  );
}
