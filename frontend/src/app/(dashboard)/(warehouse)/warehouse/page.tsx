import React, { Suspense } from "react";
import WarehouseDashboardClient from "./WarehouseDashboardClient";

// This is a Server Component
// It fetches data at the request time, meaning the HTML arrives with DATA.
export default async function WarehouseDashboardPage() {
  // World Class: Parallel Data Fetching on the Server
  // This happens BEFORE the browser even sees the page.
  const [statsRes, auditRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://5.223.80.88'}/warehouse/stats`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://5.223.80.88'}/warehouse/audit`, { cache: 'no-store' })
  ]).catch(() => [null, null]);

  const initialStats = statsRes ? await statsRes.json().catch(() => null) : null;
  const initialAudit = auditRes ? await auditRes.json().catch(() => null) : null;

  return (
    <Suspense fallback={<div className="p-8 font-black text-slate-400 animate-pulse">BOOTING COMMAND MATRIX...</div>}>
      <WarehouseDashboardClient 
        initialStats={initialStats} 
        initialAudit={initialAudit} 
      />
    </Suspense>
  );
}

