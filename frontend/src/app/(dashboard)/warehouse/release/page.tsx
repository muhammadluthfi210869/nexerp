import React, { Suspense } from "react";
import ReleaseClient from "./ReleaseClient";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Material Release | Warehouse Hub",
  description: "Production material dispatch and release monitoring.",
};

export default function ReleasePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-12 h-12 text-gray-900 animate-pulse" />
          <div className="text-slate-500 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Dispatch Protocol...</div>
        </div>
      </div>
    }>
      <DashboardShell
        title="Material"
        titleAccent="Release"
        subtitle="Production material dispatch and release monitoring."
        actions={
          <Button className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl px-6 h-11 font-black uppercase tracking-tighter text-[11px] shadow-xl shadow-emerald-500/10 border-0">
            <Zap className="w-4 h-4 mr-2" /> BATCH RELEASE
          </Button>
        }
      >
        <ReleaseClient />
      </DashboardShell>
    </Suspense>
  );
}
