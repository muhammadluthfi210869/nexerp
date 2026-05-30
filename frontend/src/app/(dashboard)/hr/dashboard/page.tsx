"use client";

import React, { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import HRDashboardClient from "../HRDashboardClient";

export default function HrDashboardPage() {
  return (
    <DashboardShell
      title="HR & HUMAN INTELLIGENCE"
      subtitle="Institutional Personnel Audit & Performance Matrix"
    >
      <Suspense fallback={<div className="p-10 text-center font-black uppercase text-slate-400">Synchronizing HR Intelligence...</div>}>
        <HRDashboardClient />
      </Suspense>
    </DashboardShell>
  );
}

