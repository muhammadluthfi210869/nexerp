import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import HRDashboardClient from "./HRDashboardClient";

export const dynamic = "force-dynamic";

export default function HRCommandCenter() {
  return (
    <DashboardShell 
      title="HR & HUMAN INTELLIGENCE" 
      subtitle="Institutional Personnel Audit & Performance Matrix"
    >
      <Suspense fallback={<HRDashboardSkeleton />}>
        <HRDashboardClient />
      </Suspense>
    </DashboardShell>
  );
}

function HRDashboardSkeleton() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[180px] bg-slate-100 rounded-3xl" />
        ))}
      </div>
      <div className="h-[400px] bg-slate-100 rounded-[2rem]" />
    </div>
  );
}

