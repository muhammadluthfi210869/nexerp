"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ProjectControlHeader() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
            Project Control Hub
          </h1>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold uppercase tracking-wider">
            PORTFOLIO PROYEK
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mt-1">
          Portofolio proyek marketing yang tercatat di backend, beserta status kanonik dan blocker terakhir.
        </p>
      </div>

      <Link
        href="/master/kpi-department"
        className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-semibold flex items-center gap-2 transition-all cursor-pointer text-decoration-none shadow-2xs"
      >
        <span>Ke KPI Management Suite</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
