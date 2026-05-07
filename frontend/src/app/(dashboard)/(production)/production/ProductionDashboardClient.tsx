"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";
import { 
  Activity, 
  Zap, 
  Target, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Clock, 
  Settings,
  Scale,
  CheckCircle2,
  AlertCircle,
  Play,
  Terminal,
  Microscope
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ProductionDashboardClient({ initialData, initialOee, initialCoc }: any) {
  usePerformanceAudit("Production Dashboard");
  
  // Use TanStack Query with initialData for instant hydration
  const { data: analytics } = useQuery({
    queryKey: ["prodDashboard"],
    queryFn: async () => (await api.get("/production/analytics/dashboard")).data,
    initialData,
    staleTime: 5000,
  });

  const { data: oeeData } = useQuery({
    queryKey: ["oeeStats"],
    queryFn: async () => (await api.get("/production/analytics/oee")).data,
    initialData: initialOee,
    staleTime: 10000,
  });

  const { data: chainOfCustody } = useQuery({
    queryKey: ["chainOfCustody"],
    queryFn: async () => (await api.get("/production/chain-of-custody")).data,
    initialData: initialCoc,
    staleTime: 5000,
  });

  const cards = analytics?.cards || {};

  return (
    <div className="min-h-screen bg-[#05070a] p-8 space-y-10 font-sans text-slate-300 selection:bg-emerald-500/30">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Production Nerve Center v4.2</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
            Workshop <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intelligence</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-tight text-[11px] max-w-xl">
            Real-time OEE telemetry, Mass Balance reconciliation, and Batch Flow monitoring.
          </p>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="h-14 px-8 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-[1.25rem] font-black uppercase tracking-tighter text-[10px]">
            <Terminal className="mr-2 h-4 w-4" /> System Logs
          </Button>
          <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-50 text-white rounded-[1.25rem] shadow-lg shadow-emerald-900/20 font-black uppercase tracking-tighter text-[10px] border-none group">
            <Play className="mr-2 h-4 w-4 fill-current group-hover:scale-110 transition-transform" /> Launch WO Terminal
          </Button>
        </div>
      </div>

      {/* CORE PERFORMANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Execution Rate" 
          value={`${cards.achievement?.rate || 0}%`} 
          subValue={`${cards.achievement?.actual || 0} / ${cards.achievement?.planned || 0} Units`}
          icon={Zap} 
          trend={+2.4}
          color="emerald"
        />
        <MetricCard 
          label="OEE Average" 
          value="88.2%" 
          subValue="Cross-Machine Performance"
          icon={Cpu} 
          trend={-1.2}
          color="cyan"
        />
        <MetricCard 
          label="Mass Balance" 
          value="99.8%" 
          subValue="Yield Accuracy Score"
          icon={Scale} 
          trend={+0.15}
          color="indigo"
        />
        <MetricCard 
          label="Defect Rate" 
          value={`${cards.quality?.defectRate || 0}%`} 
          subValue="Rejected vs Total Good"
          icon={AlertTriangle} 
          trend={-0.5}
          color="rose"
        />
      </div>

      {/* MAIN DATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BATCH FLOW MONITORING */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-[2.5rem] p-10 overflow-hidden relative group">
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Batch Pipeline</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active Work Orders & Stage Progress</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-4 py-1.5 rounded-full font-black text-[9px] uppercase">Live Sync</Badge>
              </div>

              <div className="space-y-6">
                {chainOfCustody?.map((batch: any) => (
                  <div key={batch.id} className="p-6 rounded-3xl bg-slate-950/50 border border-slate-800/50 hover:border-emerald-500/30 transition-all group/batch">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/batch:-rotate-6",
                          batch.anomalyStatus === 'LATE' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-white uppercase tracking-tight text-sm">{batch.woNumber}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{batch.productName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {batch.flow.map((stage: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className={cn(
                            "h-1.5 rounded-full transition-all duration-1000",
                            stage.isCompleted ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
                            batch.status === stage.stage ? "bg-cyan-500 animate-pulse" : "bg-slate-800"
                          )} />
                          <p className={cn(
                            "text-[8px] font-black uppercase text-center tracking-tighter",
                            stage.isCompleted || batch.status === stage.stage ? "text-slate-300" : "text-slate-600"
                          )}>{stage.stage.split('_')[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-900/40 border-slate-800/50 p-8 rounded-[2.5rem]">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Output Analytics
              </h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.precisionTracking?.slice(0, 7)}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="deadline" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 p-8 rounded-[2.5rem] flex flex-col justify-between">
              <div>
                 <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-2">Mass Balance Alert</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anomalies Detected</p>
              </div>
              <div className="space-y-4">
                {analytics?.anomalies?.slice(0, 2).map((anomaly: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{anomaly.batchId}</p>
                      <p className="text-[9px] font-bold text-rose-500/70 uppercase">Reject Rate: {anomaly.rate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* MACHINE OEE & TELEMETRY */}
        <div className="space-y-8">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-xl rounded-[2.5rem] p-10">
             <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Machine Node</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time OEE Gauges</p>
                </div>
                <Settings className="w-5 h-5 text-slate-600 hover:text-white cursor-pointer transition-colors" />
             </div>

             <div className="space-y-8">
               {oeeData?.map((m: any) => (
                 <div key={m.id} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-2 h-2 rounded-full",
                           m.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                         )} />
                         <span className="font-black text-white uppercase text-xs tracking-tight">{m.name}</span>
                      </div>
                      <span className="text-xl font-black italic text-cyan-400">{m.oee}%</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <OEEIndicator label="AVAL" value={m.availability} color="emerald" />
                      <OEEIndicator label="PERF" value={m.performance} color="cyan" />
                      <OEEIndicator label="QUAL" value={m.quality} color="indigo" />
                    </div>
                 </div>
               ))}
             </div>
          </Card>

          <Card className="bg-emerald-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-emerald-900/40 relative overflow-hidden group">
            <Microscope className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10" />
            <div className="relative z-10 space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">QC Audit Gate</h3>
              <Button className="w-full h-16 bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl font-black uppercase tracking-tighter shadow-xl">
                Open QC Command Center
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, trend, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    cyan: "text-cyan-500 bg-cyan-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  };

  return (
    <Card className="bg-slate-900/40 border-slate-800/50 p-8 rounded-[2.5rem] hover:bg-slate-900/60 transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl transition-transform group-hover:rotate-6", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn("text-[10px] font-black px-2 py-1 rounded-md", trend > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</h4>
        <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tight mt-2">{subValue}</p>
      </div>
    </Card>
  );
}

function OEEIndicator({ label, value, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    indigo: "bg-indigo-500",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[8px] font-black text-slate-500 uppercase">{label}</span>
        <span className="text-[10px] font-black text-white">{value}%</span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", colorMap[color])} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}

