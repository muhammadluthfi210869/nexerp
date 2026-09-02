"use client";

import React, { useState, Suspense, useEffect } from "react";
import ExecutiveDashboardClient from "./ExecutiveDashboardClient";
import NotificationHubClient from "./NotificationHubClient";
import Image from "next/image";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useSearchParams } from "next/navigation";
import { Calendar, Download } from "lucide-react";

export default function ExecutiveDashboardPage() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<'dashboard' | 'notifications'>('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notifications') {
      setActiveView('notifications');
    } else {
      setActiveView('dashboard');
    }
  }, [searchParams]);

  return (
    <DashboardShell
      title="Dashboard Eksekutif"
      titleAccent=""
      subtitle="Aureon ERP: Pusat Komando Strategis (Real-time)"
      actions={
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer font-black">
            <Calendar className="h-4 w-4 text-slate-400" />
            APRIL 2024
          </button>
          <button className="h-10 px-4 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer border-none font-black">
            <Download className="h-4 w-4" />
            EXPORT REPORT
          </button>
        </div>
      }
    >
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white animate-pulse">
              <Image src="/nexerp-logo.jpeg" alt="N" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <div className="text-slate-400 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase">Initializing Strategic Feed...</div>
          </div>
        </div>
      }>
        {activeView === 'dashboard' ? <ExecutiveDashboardClient /> : <NotificationHubClient />}
      </Suspense>
    </DashboardShell>
  );
}

