import React, { Suspense } from "react";
import WarehouseDashboardClient from "./WarehouseDashboardClient";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function WarehouseDashboardPage() {
  const [statsRes, auditRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001'}/warehouse/stats`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001'}/warehouse/audit`, { cache: 'no-store' })
  ]).catch(() => [null, null]);

  const initialStats = statsRes ? await statsRes.json().catch(() => null) : null;
  const initialAudit = auditRes ? await auditRes.json().catch(() => null) : null;

  return (
    <DashboardShell title="Warehouse" titleAccent="Dashboard" subtitle="Inventory oversight, capacity analytics, and risk monitoring.">
      <Suspense fallback={<div className="p-8 font-black text-slate-400 animate-pulse">BOOTING COMMAND MATRIX...</div>}>
        <WarehouseDashboardClient
          initialStats={initialStats}
          initialAudit={initialAudit}
        />
      </Suspense>
    </DashboardShell>
  );
}

