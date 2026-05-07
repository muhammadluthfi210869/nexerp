"use client";

import React from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertTriangle, 
  Target, 
  Activity, 
  PieChart, 
  Filter,
  History as HistoryIcon,
  Factory,
  Beaker,
  Boxes,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function YieldAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["prodYieldAnalytics"],
    queryFn: async () => (await api.get("/production/dashboard")).data,
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-tight italic">Calculating Yield Analytics...</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards;
  const precisionTracking = data?.precisionTracking || [];
  const totalActual = cards?.achievement?.actual ?? 0;
  const totalGood = cards?.quality?.goodUnits ?? 0;
  const totalReject = cards?.quality?.defectRate ?? 0;
  const netYield = cards?.achievement?.rate ?? 0;
  const totalLoss = totalActual > 0 ? parseFloat((((totalActual - totalGood) / totalActual) * 100).toFixed(1)) : 0;
  const oeeScore = cards?.efficiency?.utilization ?? 0;
  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Plant Efficiency Intelligence</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">
             Yield <span className="text-emerald-500">& Loss</span>
           </h1>
           <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">
             Material efficiency, waste analysis & manufacturing OEE
           </p>
        </div>

        <div className="flex gap-4">
           <Button variant="outline" className="h-14 px-6 border-2 border-slate-100 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-tight text-[10px] shadow-sm">
              <Filter className="mr-2 h-4 w-4" /> Filter Metrics
           </Button>
           <Button className="h-14 px-8 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none">
              <HistoryIcon className="mr-2 h-5 w-5" /> Efficiency Logs
           </Button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       <EfficiencyCard label="Net Yield" value={`${netYield}%`} trend={`${netYield > 90 ? '+' : ''}${netYield.toFixed(1)}%`} up={netYield >= 90} />
          <EfficiencyCard label="Total Loss" value={`${totalLoss}%`} trend={`${totalLoss.toFixed(1)}%`} up={totalLoss < 5} />
          <EfficiencyCard label="Rejection Rate" value={`${totalReject}%`} trend={`${(totalReject / 10).toFixed(1)}%`} up={totalReject < 1} />
          <EfficiencyCard label="OEE Score" value={`${oeeScore}%`} trend={`${oeeScore > 75 ? '+' : ''}${oeeScore.toFixed(1)}%`} up={oeeScore >= 75} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Yield Over Time (Conceptual) */}
         <Card className="lg:col-span-8 rounded-[3.5rem] border-none shadow-2xl shadow-slate-100 bg-white p-12 overflow-hidden relative group">
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-12">
                  <div>
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Yield Performance</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Comparison against theoretical formulation</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[10px] px-4 py-2">EXCELLENT</Badge>
               </div>

               {/* Visual Placeholder for Graph */}
               <div className="h-64 flex items-end gap-2 group/bars">
                  {[45, 80, 55, 90, 70, 85, 98, 92, 88, 95, 97, 98].map((h, i) => (
                     <div key={i} className="flex-1 bg-slate-50 rounded-t-2xl relative group/bar">
                        <div 
                           className="absolute bottom-0 left-0 right-0 bg-indigo-500/20 rounded-t-2xl transition-all duration-1000 group-hover/bars:bg-indigo-500/40" 
                           style={{ height: `${h}%` }} 
                        />
                        {i === 11 && (
                           <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]" style={{ height: `98%` }} />
                        )}
                     </div>
                  ))}
               </div>
               <div className="flex justify-between mt-6 text-[9px] font-black text-slate-300 uppercase tracking-tight">
                  <span>Start Q1</span>
                  <span>End Q1</span>
               </div>
            </div>
            <Activity className="h-64 w-64 text-slate-50 absolute -right-16 -bottom-16 group-hover:scale-110 transition-transform duration-1000" />
         </Card>

         {/* Loss Breakdown */}
         <Card className="lg:col-span-4 rounded-[3.5rem] border-none shadow-2xl shadow-slate-100 bg-slate-900 text-white p-12 overflow-hidden group">
            <div className="relative z-10">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-8">Loss Breakdown</h3>
               
               <div className="space-y-8">
                  <LossItem label="Piping Residual" value="0.8%" color="bg-amber-500" />
                  <LossItem label="Evaporation" value="0.4%" color="bg-blue-500" />
                  <LossItem label="Sampling" value="0.3%" color="bg-indigo-500" />
                  <LossItem label="Filling Loss" value="0.3%" color="bg-rose-500" />
               </div>

               <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-between">
                  <div>
                     <p className="text-[10px] font-black text-white/30 uppercase tracking-tight mb-1">Total Waste Value</p>
                     <p className="text-2xl font-black italic tracking-tighter">$1,420 <span className="text-xs font-light">/ Mo</span></p>
                  </div>
                  <Target className="h-8 w-8 text-rose-500 opacity-50" />
               </div>
            </div>
            <PieChart className="h-48 w-48 text-white/5 absolute -right-12 -top-12 group-hover:rotate-12 transition-transform duration-1000" />
         </Card>
      </div>

      {/* Product-Specific Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       {precisionTracking.slice(0, 3).map((row: any, i: number) => {
          const icons = [Beaker, Boxes, Zap];
          const Icon = icons[i % 3];
          const flowParts = (row.unitFlow || '0>>0').split('>>');
          const inputQty = parseInt(flowParts[0]?.trim() || '0');
          const goodQty = parseInt(flowParts[1]?.trim() || '0');
          const yieldPct = inputQty > 0 ? ((goodQty / inputQty) * 100).toFixed(1) : '100.0';
          return (
            <ProductMetricCard key={i} product={row.productName || 'Unknown'} yieldValue={`${yieldPct}%`} icon={Icon} />
          );
        })}
      </div>
    </div>
  );
}

function EfficiencyCard({ label, value, trend, up }: any) {
   return (
      <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-8 bg-white flex flex-col justify-center group overflow-hidden">
         <p className="text-[10px] font-black uppercase tracking-tight text-slate-400 mb-2">{label}</p>
         <div className="flex items-end justify-between">
            <h4 className="text-4xl font-black italic tracking-tighter text-slate-900 leading-none">{value}</h4>
            <div className={cn(
               "flex items-center gap-1 text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-lg",
               up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
               {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
               {trend}
            </div>
         </div>
      </Card>
   );
}

function LossItem({ label, value, color }: any) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
            <span className="text-white/50">{label}</span>
            <span className="text-white">{value}</span>
         </div>
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", color)} style={{ width: value }} />
         </div>
      </div>
   );
}

function ProductMetricCard({ product, yieldValue, icon: Icon }: any) {
   return (
      <Card className="rounded-[3rem] border-none shadow-xl shadow-slate-100 p-10 bg-white group hover:bg-slate-900 transition-all duration-500 overflow-hidden relative">
         <div className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 group-hover:bg-white/10 flex items-center justify-center mb-6 transition-colors">
               <Icon className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <h5 className="text-lg font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-white mb-1 transition-colors">{product}</h5>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight group-hover:text-white/30 transition-colors">Batch Average Yield</p>
            <div className="mt-8 text-4xl font-black italic tracking-tighter text-emerald-500">{yieldValue}</div>
         </div>
         <ArrowUpRight className="h-24 w-24 text-slate-50 absolute -right-4 -bottom-4 group-hover:text-white/5 transition-colors duration-500" />
      </Card>
   );
}

