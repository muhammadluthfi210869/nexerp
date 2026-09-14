import React, { Suspense } from "react";
import CRMLeadsClient from "./CRMLeadsClient";
import { TableShell } from "@/components/layout/TableShell";

export default function CRMLeadsPage() {
  return (
    <TableShell title="CRM" titleAccent="Lead Hub" subtitle="Kelola lead, konfigurasikan rotasi WhatsApp sales, dan audit performa secara real-time.">
      <Suspense fallback={
        <div className="p-8 space-y-8 animate-pulse">
          <div className="h-8 w-48 bg-slate-100 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 rounded-2xl" />
            ))}
          </div>
          <div className="h-[400px] bg-slate-50 rounded-3xl" />
        </div>
      }>
        <CRMLeadsClient />
      </Suspense>
    </TableShell>
  );
}
