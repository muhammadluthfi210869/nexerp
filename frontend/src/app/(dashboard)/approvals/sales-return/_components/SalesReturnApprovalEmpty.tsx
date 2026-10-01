import React from "react";

export function SalesReturnApprovalEmpty() {
  return (
    <div className="p-8 text-center">
      <p className="text-slate-400">Belum ada retur penjualan pada sistem.</p>
      <p className="text-xs text-slate-400 mt-2">
        Endpoint bussdev/returns belum menyediakan nilai retur, nomor invoice acuan,
        maupun kode alasan klaim.
      </p>
    </div>
  );
}
