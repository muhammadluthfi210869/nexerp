"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Settings2, 
  Save, 
  Plus, 
  Zap, 
  History,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface KpiMetric {
  id: string;
  eventCode: string;
  label: string;
  points: number;
  division: string;
}

export function KpiConfigManager() {
  const [metrics, setMetrics] = useState<KpiMetric[]>([
    { id: "1", eventCode: "sales.so.paid", label: "SO Paid", points: 10, division: "BD" },
    { id: "2", eventCode: "qc.batch.rejected", label: "Batch Rejected (Penalti)", points: -15, division: "PRODUCTION" },
    { id: "3", eventCode: "rnd.formula.submitted", label: "Formula Submitted", points: 5, division: "RND" },
  ]);

  const handlePointChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, points: numValue } : m));
  };

  const handleSave = () => {
    toast.success("KPI Configuration updated successfully", {
      description: "Passive Harvesting Engine re-calibrated.",
      style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B' }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ⚙️ VI. KPI PARAMETER SETTINGS */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-rose-500 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">⚙️ VI. KPI PARAMETER SETTINGS (HARVEST LOGIC)</h3>
            </div>
            <Button onClick={handleSave} className="h-9 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] px-6 rounded-lg shadow-lg shadow-rose-900/20 transition-all">
               <Save className="w-3.5 h-3.5 mr-2" /> COMMIT CHANGES
            </Button>
          </div>
          <Card className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">EVENT TRIGGER</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">LABEL</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">DIVISION</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">POINTS</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {metrics.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-all">
                           <td className="px-6 py-4">
                              <code className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 tabular">
                                 {row.eventCode}
                              </code>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[11px] font-black text-brand-black uppercase italic tracking-tight">{row.label}</span>
                           </td>
                           <td className="px-6 py-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase px-2 py-1 bg-slate-100 rounded-md">
                                 {row.division}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <Input 
                                 type="number" 
                                 value={row.points} 
                                 onChange={(e) => handlePointChange(row.id, e.target.value)}
                                 className="w-20 ml-auto bg-white border-slate-200 text-brand-black font-black text-center h-8 rounded-lg focus:ring-rose-500 focus:border-rose-500 tabular"
                              />
                           </td>
                        </tr>
                     ))}
                     <tr>
                        <td colSpan={4} className="p-4 bg-slate-50/50">
                           <button className="w-full h-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-black uppercase text-[9px] tracking-widest hover:border-brand-black hover:text-brand-black transition-all flex items-center justify-center gap-2">
                              <Plus className="w-3.5 h-3.5" /> ADD TRIGGER DEFINITION
                           </button>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
          </Card>
        </div>

        {/* ℹ️ VII. SCORING GUIDE & AUDIT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-1 h-4 bg-indigo-500 rounded-full" />
               <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">ℹ️ VII. SCORING GUIDE</h3>
            </div>
            <Card className="bento-card p-6 space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                 <p className="text-[10px] font-black text-brand-black uppercase mb-1.5 tracking-tight">PASSIVE WEIGHTING (70%)</p>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    Points harvested automatically from operational modules. High-impact events like SO Payment define the baseline.
                 </p>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                 <p className="text-[10px] font-black text-rose-600 uppercase mb-1.5 tracking-tight">CRITICAL PENALTY LOGIC</p>
                 <p className="text-[10px] text-rose-600/60 leading-relaxed font-bold">
                    Negative points for QC Rejections are deducted instantly, affecting real-time leaderboard ranking.
                 </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <Button variant="outline" className="w-full h-11 border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] hover:border-brand-black hover:text-brand-black rounded-xl transition-all">
                    <History className="w-4 h-4 mr-2" /> OPEN AUDIT TRAIL
                 </Button>
              </div>
            </Card>
          </div>

          <Card className="bento-card p-6 bg-slate-900 text-white bento-card-hover border-none">
             <div className="relative z-10 flex flex-col justify-between h-32">
                <div>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">ALGO STATUS</p>
                   <h4 className="text-xl font-black italic uppercase tracking-tighter mt-1">ACTIVE RE-CALIBRATION</h4>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/60">SYSTEM HEALTHY</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    );
}

