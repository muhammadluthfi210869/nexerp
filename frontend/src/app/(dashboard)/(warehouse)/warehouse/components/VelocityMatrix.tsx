"use client";

import { Card } from "@/components/ui/card";
import { ArrowRightLeft, Warehouse, Clock } from "lucide-react";

export function VelocityMatrix({ audit }: { audit: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 🚀 JALUR MASUK (A) */}
      <Card className="bento-card p-8 bg-white border-l-4 border-l-blue-500 hover:translate-y-[-5px] transition-all">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-blue-500" />
              <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">JALUR A: INBOUND</p>
           </div>
           <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg tabular uppercase">VELOCITY: {audit?.jalurA?.velocity || 0}X</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">RECEIPT</p>
              <p className="text-2xl font-black text-brand-black tabular italic">{audit?.jalurA?.inbound || 0}</p>
           </div>
           <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">QC / KARANTINA</p>
              <p className="text-2xl font-black text-amber-600 tabular italic">{audit?.jalurA?.karantina || 0}</p>
           </div>
        </div>
      </Card>

      {/* 🔄 JALUR INTERNAL (B) */}
      <Card className="bento-card p-8 bg-white border-l-4 border-l-indigo-500 hover:translate-y-[-5px] transition-all">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">JALUR B: INTERNAL OPS</p>
           </div>
           <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg tabular uppercase">VELOCITY: {audit?.jalurB?.velocity || 0}X</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">PROD REQ</p>
              <p className="text-lg font-black text-brand-black tabular italic">{audit?.jalurB?.reqProd || 0}</p>
           </div>
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">PICKING</p>
              <p className="text-lg font-black text-brand-black tabular italic">{audit?.jalurB?.picking || 0}</p>
           </div>
           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
              <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1">HANDOVER</p>
              <p className="text-lg font-black text-emerald-600 tabular italic">{audit?.jalurB?.handover || 0}</p>
           </div>
        </div>
      </Card>

      {/* 📦 JALUR KELUAR (C) */}
      <Card className="bento-card p-8 bg-white border-l-4 border-l-violet-500 hover:translate-y-[-5px] transition-all">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" />
              <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">JALUR C: SHIPPING</p>
           </div>
           <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1 rounded-lg tabular uppercase">VELOCITY: {audit?.jalurC?.velocity || 0}X</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">ORDERS</p>
              <p className="text-lg font-black text-brand-black tabular italic">{audit?.jalurC?.orderProc || 0}</p>
           </div>
           <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">SHIPPING</p>
              <p className="text-lg font-black text-brand-black tabular italic">{audit?.jalurC?.shipping || 0}</p>
           </div>
           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
              <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-1">SHIPPED</p>
              <p className="text-lg font-black text-emerald-600 tabular italic">{audit?.jalurC?.delivered || 0}</p>
           </div>
        </div>
      </Card>
    </div>
  );
}

