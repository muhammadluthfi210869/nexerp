"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AuditTables({ audit }: { audit: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🧪 III.A AUDIT GRANULAR BAHAN BAKU */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">🧪 III.A AUDIT GRANULAR BAHAN BAKU (SENSITIF & FEFO)</h3>
           </div>
           <Card className="bento-card overflow-hidden bg-white">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">NAMA MATERIAL / MASUK</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">QTY (AV/BK)</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {audit?.sensitiveMaterials?.map((inv: any, i: number) => (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                             <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{inv.name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{inv.date}</p>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <p className="text-[12px] font-black text-brand-black tabular">{inv.qty}</p>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-md text-[8px] font-black uppercase tabular border shadow-sm",
                                  inv.status === 'FEFO_OK' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                )}>{inv.status}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        {/* 📦 III.B AUDIT GRANULAR BAHAN KEMAS */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📦 III.B AUDIT GRANULAR BAHAN KEMAS (DEGRADASI & STOK)</h3>
           </div>
           <Card className="bento-card overflow-hidden bg-white">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">NAMA KEMASAN / TIPE</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">QTY (AV/BK)</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {audit?.packagingStocks?.map((inv: any, i: number) => (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                             <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{inv.name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">STOCK AUDIT</p>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <p className="text-[12px] font-black text-brand-black tabular">{inv.qty}</p>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-md text-[8px] font-black uppercase tabular border shadow-sm",
                                  inv.status === 'STABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                )}>{inv.status}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🧾 III.C SO FULFILLMENT */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-violet-600 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">🧾 III.C PEMENUHAN PESANAN (SO FULFILLMENT)</h3>
           </div>
           <Card className="bento-card overflow-hidden bg-white">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">CLIENT / NO. SO</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">COMPLETION</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">PROGRESS</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {audit?.soFulfillment?.map((so: any, i: number) => (
                          <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                             <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{so.client}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{so.so}</p>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-md text-[8px] font-black uppercase tabular border shadow-sm",
                                  so.status === 'FULL' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                )}>{so.status}</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                   <span className={cn(
                                     "text-[12px] font-black tabular",
                                     so.var < 0 ? 'text-rose-500' : 'text-emerald-500'
                                   )}>{so.var > 0 ? `+${so.var}` : so.var}</span>
                                   <span className="text-[10px] font-black text-blue-600">{so.progress}%</span>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        {/* ⚠️ III.D AUDIT RISIKO & KERUGIAN */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 italic">⚠️ III.D AUDIT RISIKO & KERUGIAN (NON-SELLABLE)</h3>
           </div>
           <Card className="bento-card overflow-hidden bg-white border-rose-100">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-rose-50/50 border-b border-rose-100">
                          <th className="px-6 py-4 text-[9px] font-black text-rose-800 uppercase tracking-widest">ITEM & SUMBER</th>
                          <th className="px-6 py-4 text-[9px] font-black text-rose-800 uppercase tracking-widest">DETAIL AUDIT</th>
                          <th className="px-6 py-4 text-[9px] font-black text-rose-800 uppercase tracking-widest text-right">LOSS IMPACT</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                       {audit?.riskLoss?.map((risk: any, i: number) => (
                          <tr key={i} className="group hover:bg-rose-50 transition-all cursor-default">
                             <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-rose-600 transition-colors">{risk.item}</p>
                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">{risk.source}</p>
                             </td>
                             <td className="px-6 py-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{risk.detail}</p>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <p className="text-[12px] font-black text-rose-600 tabular italic">{risk.impact}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase">ACTION: {risk.action}</p>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

