"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Rankings({ audit }: { audit: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 🧬 IV. TOP 10 LIST BAHAN BAKU */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-blue-500 rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">🧬 IV. TOP 10 BAHAN BAKU</h3>
        </div>
        <Card className="bento-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">NAMA BAHAN</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">PAKAI</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">VALUE AUDIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit?.topRaw?.map((item: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-4">
                       <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{item.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-[11px] font-black tabular text-slate-400">{item.usage}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[11px] font-black tabular text-blue-600">{item.value}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 📦 V. TOP 10 LIST KEMASAN */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-violet-500 rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📦 V. TOP 10 KEMASAN</h3>
        </div>
        <Card className="bento-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">NAMA KEMASAN</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">PAKAI</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">VALUE AUDIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit?.topPack?.map((item: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-4">
                       <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{item.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-[11px] font-black tabular text-slate-400">{item.usage}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[11px] font-black tabular text-violet-600">{item.value}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 🏆 TEAM PRODUCTIVITY RANK */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-emerald-500 rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">🏆 TEAM WAREHOUSE RANK</h3>
        </div>
        <Card className="bento-card p-8 bg-white">
          <div className="space-y-4">
            {audit?.productivity?.map((rank: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-black text-white flex items-center justify-center font-black text-sm italic group-hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 group-hover:scale-110">
                    {rank.rank}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-emerald-700">{rank.name}</h4>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rank.batch} OPS/MTD</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-brand-black tabular">{rank.points} <span className="text-[9px] text-slate-400 uppercase">PTS</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

