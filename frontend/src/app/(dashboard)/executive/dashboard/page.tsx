"use client";

import React, { useState, Suspense, useEffect } from "react";
import ExecutiveDashboardClient from "./ExecutiveDashboardClient";
import NotificationHubClient from "./NotificationHubClient";
import { Zap, LayoutDashboard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

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
    <div className="bg-[#fafafa] min-h-screen flex flex-col overflow-hidden relative">
      
      <div className="flex-1">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-[#fafafa]">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white animate-pulse">
                <img src="/N letter logo.jpeg" alt="N" className="w-full h-full object-cover" />
              </div>
              <div className="text-brand-black/50 animate-pulse text-[10px] font-black tracking-[0.4em] uppercase italic">Initializing Strategic Feed...</div>
            </div>
          </div>
        }>
          {activeView === 'dashboard' ? <ExecutiveDashboardClient /> : <NotificationHubClient />}
        </Suspense>
      </div>

      {/* VIEWPORT OVERRIDE STYLE */}
      <style jsx global>{`
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}

