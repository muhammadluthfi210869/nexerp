"use client";

import React from "react";

export function ChecklistTrackingNotes() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
      <strong className="block mb-1">Catatan cakupan data</strong>
      Baris, KPI, dan timeline di halaman ini dibaca dari sample request R&D
      (<code className="font-mono">/rnd/samples</code> dan{" "}
      <code className="font-mono">/rnd/samples/:id</code> â†’ <code className="font-mono">stageLogs</code>).
      Kolom &quot;Status Projek&quot; adalah turunan dari stage tersimpan + target deadline
      (bukan status tersimpan terpisah). Daftar 26 tahapan checklist maklon, chart Gantt
      jadwal, dan aksi ubah status milestone yang sebelumnya tampil sebagai contoh tidak
      memiliki penyimpanan di backend sehingga tidak lagi ditampilkan.
    </div>
  );
}
