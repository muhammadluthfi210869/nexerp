"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/layout/Sidebar").then(m => ({ default: m.Sidebar })), {
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
});

export function SidebarWrapper() {
  return <Sidebar />;
}
