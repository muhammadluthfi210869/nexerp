"use client";

import React from "react";

export function ProjectControlNotes() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
      <strong className="block mb-1">Catatan cakupan data</strong>
      Halaman ini menampilkan register proyek yang benar-benar ada di backend
      (<code className="font-mono">/marketing/projects</code>): kode proyek, nama, channel,
      kategori, brand, owner, progress, jumlah task, status kanonik, tanggal mulai/deadline,
      dan catatan blocker. Model milestone, keputusan Direksi, dan tingkat keparahan blocker
      yang sebelumnya ditampilkan sebagai contoh tidak memiliki penyimpanan di backend sehingga
      tidak lagi ditampilkan.
    </div>
  );
}
