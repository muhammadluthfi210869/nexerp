"use client";

import React from "react";
import { Palette, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export function CreativeBoardHeader({ tasks }: { tasks: any[] }) {
  const stats = {
    active: tasks.filter(t => ['IN_PROGRESS', 'WAITING_APJ', 'WAITING_CLIENT'].includes(t.kanbanState)).length,
    revision: tasks.filter(t => t.kanbanState === 'REVISION').length,
    locked: tasks.filter(t => t.kanbanState === 'LOCKED').length,
    breach: tasks.filter(t => t.isLocked).length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <div className="p-8 rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-100 flex items-center justify-between group overflow-hidden relative transition-all hover:scale-[1.02]">
         <div className="absolute -right-4 -bottom-4 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Palette className="w-24 h-24 text-white" />
         </div>
         <div className="relative z-10">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-[.3em] mb-3">Live Projects</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none">{stats.active}</h3>
         </div>
         <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
            <TrendingUp className="w-5 h-5" />
         </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-between group overflow-hidden relative border border-slate-100 transition-all hover:scale-[1.02]">
         <div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] mb-3 text-rose-500">In Revision</p>
            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{stats.revision}</h3>
         </div>
         <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-5 h-5" />
         </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-between group overflow-hidden relative border border-slate-100 transition-all hover:scale-[1.02]">
         <div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] mb-3 text-emerald-500">Ready to Print</p>
            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{stats.locked}</h3>
         </div>
         <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
         </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-white shadow-sm flex items-center justify-between group overflow-hidden relative border border-slate-100 transition-all hover:scale-[1.02]">
         <div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] mb-3 text-slate-400">Total Breach</p>
            <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{stats.breach}</h3>
         </div>
         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <AlertCircle className="w-5 h-5" />
         </div>
      </div>
    </div>
  );
}

