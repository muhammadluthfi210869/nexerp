import React, { Suspense } from "react";
import AdjustmentClient from "./AdjustmentClient";
import { OperationalMigrationShell } from "@/components/operational";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
 title: "Stock Adjustment | Warehouse Hub",
 description: "Warehouse stock correction and adjustment portal.",
};

export default function AdjustmentPage() {
 return (
 <Suspense fallback={
 <div className="flex h-screen items-center justify-center bg-white">
 <div className="flex flex-col items-center gap-4">
 <Zap className="w-12 h-12 text-gray-900 animate-pulse" />
 <div className="text-slate-500 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Adjustment Protocol...</div>
 </div>
 </div>
 }>
 <OperationalMigrationShell
 title="Stock"
 titleAccent="Adjustment"
 subtitle="Warehouse stock correction and adjustment portal."
 actions={
 <Link href="/warehouse/adjustment?new=1" className="inline-flex items-center gap-2 px-6 h-11 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black uppercase tracking-tighter text-[11px] shadow-sm border border-slate-200">
 <Plus className="w-4 h-4" /> NEW ADJ
 </Link>
 }
 >
 <AdjustmentClient />
 </OperationalMigrationShell>
 </Suspense>
 );
}
