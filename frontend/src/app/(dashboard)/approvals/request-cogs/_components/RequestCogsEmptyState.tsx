import React from "react";

export function RequestCogsEmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-slate-400">Belum ada job order costing pada sistem.</p>
      <p className="text-xs text-slate-400 mt-2">
        Endpoint finance/job-order-costings belum menyediakan rincian komponen HPP
        (formula, kemasan, overhead) maupun data klien dan MOQ.
      </p>
    </div>
  );
}
