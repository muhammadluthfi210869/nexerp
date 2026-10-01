"use client";

import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmployeeView } from "./_components/EmployeeView";

export default function HrEmployeesPage() {
  return (
    <DashboardShell
      title="HR & PERSONNEL DIRECTORY"
      subtitle="Master Data Pegawai, Kontrak PKWT, Struktur Upah & Kasbon"
    >
      <Suspense
        fallback={
          <div className="p-10 text-center font-bold uppercase text-xs text-slate-400">
            Sinkronisasi Master Pegawai...
          </div>
        }
      >
        <EmployeeView />
      </Suspense>
    </DashboardShell>
  );
}
