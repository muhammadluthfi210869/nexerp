import React from "react";

export function SegmentLoading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-100 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-50 rounded-3xl" />
        ))}
      </div>
      <div className="h-80 bg-slate-50 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-50 rounded-3xl" />
        <div className="h-64 bg-slate-50 rounded-3xl" />
      </div>
    </div>
  );
}
