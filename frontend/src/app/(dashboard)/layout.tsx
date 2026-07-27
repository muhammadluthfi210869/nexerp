"use client";
export const dynamic = 'force-dynamic';

import React from "react";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { Bell, Menu, Search } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex bg-base min-h-screen">
      <SidebarWrapper isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main 
        className="flex-1 min-h-screen bg-base overflow-x-hidden flex flex-col lg:ml-[var(--sidebar-width)]"
      >
        {/* TOP HEADER */}
        <div data-slot="dashboard-topbar" className="h-[72px] bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 shadow-sm transition hover:text-slate-900 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Search bar */}
          <div className="relative min-w-0 flex-1 sm:max-w-[380px]">
            <input
              data-slot="dashboard-search"
              type="text" 
              placeholder="Can parameter, node, atau log audit..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-[12px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-150 focus:bg-white focus:border-slate-200 transition-all placeholder:text-slate-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          </div>

          {/* Right section */}
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
            <div
              id="marketing-theme-navbar-slot"
              className="flex min-w-0 max-w-[58vw] items-center justify-end overflow-x-auto sm:max-w-none"
              aria-live="polite"
            />
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div
          data-slot="dashboard-content"
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

