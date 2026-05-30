"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap,
  Box,
  FlaskConical,
  Package,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { StatCard, DnaBadge } from "@/components/dna";
import { QueryLoading, QueryError } from "@/components/query-states";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function TerminalHub() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ["prodDashboard"],
    queryFn: async () => (await api.get("/production/dashboard")).data,
  });

  const { data: oeeData, isLoading: oeeLoading } = useQuery({
    queryKey: ["oeeStats"],
    queryFn: async () => (await api.get("/production/oee")).data,
  });

  if (dashLoading || oeeLoading) return <QueryLoading message="Loading terminal..." minHeight="min-h-screen" />;
  if (dashError) return <QueryError error="Failed to load production data" onRetry={() => window.location.reload()} minHeight="min-h-screen" />;

  const workshops = dashboardData?.workshops;
  const cards = dashboardData?.cards;

  return (
    <DashboardShell
      title="Production"
      titleAccent="Terminals"
      subtitle="Execution console gateways & plant floor orchestration kiosks"
      actions={
        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Plant Clock</span>
            <span className="text-xs font-black text-slate-900 tracking-tight tabular-nums mt-0.5">
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <DnaBadge status="success" className="py-0.5 px-2 rounded font-black text-[8px] tracking-widest">
            OPERATIONAL
          </DnaBadge>
        </div>
      }
    >
      {/* Kiosks Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/production/terminal/mixing">
          <StatCard
            label="Stage 1: Bulk Formulation"
            value="Mixing Kiosk"
            subValue={oeeData?.find((m: any) => m.name?.toLowerCase().includes('mix'))?.oee
              ? `${workshops?.mixing ?? 0} active · ${parseFloat(oeeData.find((m: any) => m.name?.toLowerCase().includes('mix'))?.oee ?? 0).toFixed(1)}% OEE`
              : `${workshops?.mixing ?? 0} active`}
            icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          />
        </Link>
        <Link href="/production/terminal/filling">
          <StatCard
            label="Stage 2: Precision Injection"
            value="Filling Kiosk"
            subValue={cards?.quality?.defectRate
              ? `${workshops?.filling ?? 0} active · ${cards.quality.defectRate}% defect`
              : `${workshops?.filling ?? 0} active`}
            icon={<Zap className="w-5 h-5 text-amber-500" />}
          />
        </Link>
        <Link href="/production/terminal/packing">
          <StatCard
            label="Stage 3: Packaging & Label"
            value="Packing Kiosk"
            subValue={workshops?.fg && workshops.fg > 0
              ? `${workshops?.packing ?? 0} active · ${workshops.fg} completed`
              : `${workshops?.packing ?? 0} active`}
            icon={<Package className="w-5 h-5 text-purple-600" />}
          />
        </Link>
        <Link href="/production/terminal/reconciliation">
          <StatCard
            label="Warehouse Reconciliation"
            value="Returns Gate"
            subValue={cards?.alerts?.shortages
              ? `${cards.alerts.shortages} issues · ${cards.timeliness?.delayed ?? 0} delayed`
              : 'Nominal'}
            icon={<Box className="w-5 h-5 text-rose-500" />}
          />
        </Link>
      </div>

      {/* System Health SSE Indicators */}
      <div className="mt-8 flex flex-col md:flex-row justify-center gap-8 border-t border-slate-200 pt-8">
        <HealthIndicator label="Interlock Guard" status="Active" icon={<ShieldCheck className="w-4 h-4" />} />
        <HealthIndicator label="Costing Engine" status="Synchronized" icon={<Activity className="w-4 h-4" />} />
        <HealthIndicator label="SSE Gateway" status="Live" icon={<Zap className="w-4 h-4" />} />
      </div>
    </DashboardShell>
  );
}


function HealthIndicator({ label, status, icon }: any) {
  return (
    <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-help">
      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-[9px] font-bold text-slate-800 uppercase leading-none">{status}</p>
      </div>
    </div>
  );
}
