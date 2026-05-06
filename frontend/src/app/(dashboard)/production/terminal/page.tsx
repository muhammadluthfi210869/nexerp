"use client";

import React, { useState, useEffect } from "react";
import { 
  Factory,
  Zap,
  Box,
  ChevronRight,
  FlaskConical,
  Package,
  Activity,
  User,
  ShieldCheck,
  Settings
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function TerminalHub() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData } = useQuery({
    queryKey: ["prodDashboard"],
    queryFn: async () => (await api.get("/production/dashboard")).data,
  });

  const { data: oeeData } = useQuery({
    queryKey: ["oeeStats"],
    queryFn: async () => (await api.get("/production/oee")).data,
  });

  const workshops = dashboardData?.workshops;
  const cards = dashboardData?.cards;

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 font-sans selection:bg-[#d4af37]/30 overflow-hidden relative">
      {/* Background Tech Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#d4af37]/5 rounded-full blur-[150px] -z-10" />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 pb-8 border-b border-white/5">
        <div className="flex items-center gap-6">
           <div className="h-20 w-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-white/10">
              <Factory className="h-10 w-10 text-black" />
           </div>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Plant Status: Operational</span>
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                 Nex <span className="text-[#d4af37]">Production</span> Hub
              </h1>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-2">V4.0 Terminal Orchestration System</p>
           </div>
        </div>

        <div className="flex items-center gap-8 bg-white/[0.03] p-3 rounded-[2.5rem] border border-white/5">
           <div className="text-right px-6">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Current Time</p>
              <p className="text-xl font-black italic text-white tracking-tight tabular-nums">
                 {currentTime.toLocaleTimeString([], { hour12: false })}
              </p>
           </div>
           <div className="h-12 w-px bg-white/10" />
           <Button variant="ghost" size="icon" className="h-16 w-16 rounded-3xl hover:bg-white/10">
              <Settings className="h-6 w-6 text-white/40" />
           </Button>
        </div>
      </header>

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <TerminalCard 
          title="Mixing" 
          subtitle="Stage 1: Bulk Formulation"
          icon={<FlaskConical className="w-10 h-10" />}
          href="/production/terminal/mixing"
          status={(workshops?.mixing ?? 0) > 0 ? "Active" : "Standby"}
          metrics={[
            { label: "Active Batches", value: `${workshops?.mixing ?? 0} batches` },
            { label: "Machine OEE", value: oeeData?.find((m: any) => m.name?.toLowerCase().includes('mix'))?.oee ? `${parseFloat(oeeData.find((m: any) => m.name?.toLowerCase().includes('mix'))?.oee ?? 0).toFixed(1)}%` : '—' },
          ]}
        />
        <TerminalCard 
          title="Filling" 
          subtitle="Stage 2: Precision Injection"
          icon={<Zap className="w-10 h-10" />}
          href="/production/terminal/filling"
          status={(workshops?.filling ?? 0) > 0 ? "Active" : "Ready"}
          metrics={[
            { label: "Active Batches", value: `${workshops?.filling ?? 0} batches` },
            { label: "Defect Rate", value: cards?.quality?.defectRate ? `${cards.quality.defectRate}%` : '—' },
          ]}
        />
        <TerminalCard 
          title="Packing" 
          subtitle="Stage 3: Final Consolidation"
          icon={<Package className="w-10 h-10" />}
          href="/production/terminal/packing"
          status={(workshops?.packing ?? 0) > 0 ? "Active" : "Ready"}
          metrics={[
            { label: "Active Batches", value: `${workshops?.packing ?? 0} batches` },
            { label: "QC Status", value: workshops?.fg && workshops.fg > 0 ? `${workshops.fg} Completed` : 'Standby' },
          ]}
        />
        <TerminalCard 
          title="Returns" 
          subtitle="Warehouse Reconciliation"
          icon={<Box className="w-10 h-10" />}
          href="/production/terminal/reconciliation"
          status={(cards?.alerts?.shortages ?? 0) > 0 ? "Alert" : "Nominal"}
          metrics={[
            { label: "Pending Returns", value: cards?.alerts?.shortages ? `${cards.alerts.shortages} issues` : 'None' },
            { label: "Delayed Orders", value: cards?.timeliness?.delayed ? `${cards.timeliness.delayed} orders` : 'None' },
          ]}
        />
      </div>

      {/* System Health / SSE Indicators */}
      <div className="mt-20 flex justify-center gap-16 border-t border-white/5 pt-12">
         <HealthIndicator label="Interlock Guard" status="Active" icon={<ShieldCheck className="w-4 h-4" />} />
         <HealthIndicator label="Costing Engine" status="Synchronized" icon={<Activity className="w-4 h-4" />} />
         <HealthIndicator label="SSE Gateway" status="Live" icon={<Zap className="w-4 h-4" />} />
      </div>
    </div>
  );
}

function TerminalCard({ title, subtitle, icon, href, status, metrics, disabled }: any) {
  return (
    <Link href={disabled ? "#" : href} className={cn(
      "group relative",
      disabled && "opacity-40 cursor-not-allowed"
    )}>
      <Card className="h-full bg-[#0A0A0A] border border-white/5 rounded-[3.5rem] p-10 transition-all duration-500 hover:border-[#d4af37]/30 hover:shadow-[0_40px_80px_rgba(212,175,55,0.08)] group-hover:-translate-y-2 overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl group-hover:bg-[#d4af37] group-hover:text-black transition-all duration-500">
               {icon}
            </div>
            <Badge className={cn(
              "font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1 rounded-full border-none",
              status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : 
              status === 'Ready' ? "bg-[#d4af37]/10 text-[#d4af37]" : "bg-white/5 text-white/30"
            )}>
              {status}
            </Badge>
          </div>
          
          <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">{title}</h3>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-10">{subtitle}</p>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
             {metrics.map((m: any, i: number) => (
                <div key={i}>
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                   <p className="text-sm font-black italic text-white/60">{m.value}</p>
                </div>
             ))}
          </div>
        </div>

        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#d4af37]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </Card>
    </Link>
  );
}

function HealthIndicator({ label, status, icon }: any) {
  return (
    <div className="flex items-center gap-3 opacity-30 hover:opacity-100 transition-opacity cursor-help">
       <div className="p-2 bg-white/5 rounded-lg text-[#d4af37]">
          {icon}
       </div>
       <div>
          <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
          <p className="text-[9px] font-bold text-white/40 uppercase">{status}</p>
       </div>
    </div>
  );
}

