"use client";

import React from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

interface ArHubInfoBannerProps {
  tableError: boolean;
}

export function ArHubInfoBanner({ tableError }: ArHubInfoBannerProps) {
  return (
    <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-6 flex gap-6 items-center shadow-sm mt-6">
      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0 border border-slate-100">
        {tableError ? <ArrowUpRight className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic">Sumber Data</p>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Angka di halaman ini dihitung dari <span className="font-mono">GET /finance/invoices</span> dan daftar tunggu
          validasi <span className="font-mono">GET /finance/ar-hub/pending</span>. Validasi mengirim
          <span className="font-mono"> POST /finance/ar-hub/verify</span> dan langsung memperbarui status dokumen di backend.
        </p>
      </div>
    </div>
  );
}
