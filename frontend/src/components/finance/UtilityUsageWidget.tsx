"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Zap, Droplets, Flame, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UtilityMetric {
  name: string;
  value: string;
  unit: string;
  limit: number;
  current: number;
  icon: any;
  color: string;
}

export function UtilityUsageWidget() {
  const metrics: UtilityMetric[] = [
    { name: "Electricity", value: "14,204", unit: "kWh", limit: 20000, current: 14204, icon: Zap, color: "bg-yellow-500" },
    { name: "Production Water", value: "892", unit: "m³", limit: 1200, current: 892, icon: Droplets, color: "bg-blue-500" },
    { name: "LPG / Gas", value: "410", unit: "kg", limit: 600, current: 410, icon: Flame, color: "bg-orange-500" },
  ];

  return (
    <Card className="p-8 border-none bg-white shadow-sm rounded-[40px] flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white h-5 w-5" />
           </div>
           <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Utility Protocols</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Physical Resource Consumption</p>
           </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tight">Live Monitoring</p>
           <p className="text-[9px] font-bold text-slate-300 uppercase">Updated 2m ago</p>
        </div>
      </div>

      <div className="space-y-8">
        {metrics.map((m) => (
          <div key={m.name} className="space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`h-8 w-8 rounded-lg flex items-center justify-center opacity-80 ${m.color.replace('bg-', 'bg-')}/10`}>
                      <m.icon className={`h-4 w-4 ${m.color.replace('bg-', 'text-')}`} />
                   </div>
                   <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{m.name}</span>
                </div>
                <div className="text-right">
                   <span className="text-sm font-black text-slate-900">{m.value}</span>
                   <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{m.unit}</span>
                </div>
             </div>
             <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                   <div className="text-[9px] font-black uppercase text-slate-300 tracking-tight">Utilization Index</div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-slate-600">
                         {Math.round((m.current / m.limit) * 100)}%
                      </span>
                   </div>
                </div>
                <Progress value={(m.current / m.limit) * 100} className={`h-2 rounded-full bg-slate-50`} indicatorClassName={`${m.color}`} />
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight leading-relaxed text-center italic">
            Efficiency goal: -5% variance vs industrial benchmark
         </p>
      </div>
    </Card>
  );
}

