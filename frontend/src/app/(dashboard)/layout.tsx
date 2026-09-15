"use client";
export const dynamic = 'force-dynamic';

import React from "react";
import nextDynamic from "next/dynamic";
import { Search, Bell } from "lucide-react";

const Sidebar = nextDynamic(
  () => import("@/components/layout/Sidebar").then((m) => ({ default: m.Sidebar })),
  {
    ssr: false,
    loading: () => (
      <aside className="w-72 h-screen fixed left-0 top-0 z-50 bg-white border-r border-slate-200 animate-pulse">
        <div className="p-7 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-2 w-16 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="px-5 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-32 bg-slate-100 rounded mx-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-9 bg-slate-50 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    ),
  }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-base min-h-screen">
      <Sidebar />
      
      <main 
        className="flex-1 min-h-screen bg-base overflow-x-hidden flex flex-col"
        style={{ 
          marginLeft: 'var(--sidebar-width)',
        }}
      >
        {/* TOP HEADER */}
        <div className="h-[72px] bg-white border-b border-slate-100 px-12 flex items-center justify-between shrink-0">
          {/* Search bar */}
          <div className="relative w-[380px]">
            <input 
              type="text" 
              placeholder="Can parameter, node, atau log audit..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[12px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-150 focus:bg-white focus:border-slate-200 transition-all placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-md tracking-wider">
              STABIL v2.0
            </span>
            <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-150 px-2.5 py-1 rounded-md tracking-wider animate-pulse">
              SINKRONISASI LANGSUNG
            </span>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div 
          className="max-w-[1600px] mx-auto w-full flex-1 bg-[var(--app-bg)]"
          style={{ 
            padding: 'var(--page-py) var(--page-px) var(--page-pb)',
            borderRadius: '24px 0 0 0',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

