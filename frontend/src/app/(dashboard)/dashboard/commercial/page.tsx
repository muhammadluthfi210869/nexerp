"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LeadBoard } from "@/components/commercial/lead-board";
import { MarketingForm } from "@/components/commercial/marketing-form";
import { Zap, Target, Users, AlertTriangle, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RetentionRadar } from "@/components/commercial/retention-radar";
import { KpiCard } from "@/components/dna/KpiCard";

export default function CommercialDashboard() {
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
    }
  }, []);

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const res = await api.get("/leads");
      return res.data;
    }
  });

  const conversionRate = leads?.length
    ? `${((leads.filter((l: any) => l.status === 'WON_DEAL').length / leads.length) * 100).toFixed(1)}%`
    : "—";
  const slaViolationRate = leads?.length
    ? `${((leads.filter((l: any) => l.is_sla_warning).length / leads.length) * 100).toFixed(1)}%`
    : "—";

  const { data: retentionRadar } = useQuery({
    queryKey: ["retention-radar"],
    queryFn: async () => {
      const res = await api.get("/commercial/retention/radar");
      return res.data;
    }
  });

  return (
    <DashboardShell
      title="Commercial"
      titleAccent="Workspace"
      subtitle="Strategic lead management & digital marketing operations."
    >
      {(() => {
        const slaWarn = leads?.filter((l: { sla_warning?: boolean }) => l.sla_warning).length || 0;
        const atRisk = retentionRadar?.filter((r: { risk_level?: string }) => r.risk_level === "HIGH").length || 0;
        return (
          <div className="grid grid-cols-3 gap-8 mb-6">
            <KpiCard label="Total Leads" value={String(leads?.length || 0)} targetPct={50} icon={<Users />} />
            <KpiCard
              label="SLA Warning"
              value={String(slaWarn)}
              targetPct={slaWarn === 0 ? 100 : Math.max(0, 100 - slaWarn * 5)}
              icon={<AlertTriangle />}
            />
            <KpiCard
              label="At Risk Clients"
              value={String(atRisk)}
              targetPct={atRisk === 0 ? 100 : 0}
              icon={<ShieldAlert />}
            />
          </div>
        );
      })()}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEADS TRACKER: Main Area */}
        <div className="lg:col-span-3 space-y-6">
           <LeadBoard />
        </div>

        {/* SIDEBAR: Tools & Marketing */}
        <div className="space-y-6">
           <RetentionRadar />
           <MarketingForm />

            <Card className="border-gray-200 bg-white shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-30" />
             <CardHeader>
                <CardTitle className="text-gray-900 text-xs font-bold uppercase tracking-tight flex items-center">
                   <Zap className="mr-2 h-4 w-4 text-emerald-500" />
                   Growth Metrics
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 font-sans">Live Conversion Data</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Conversion Rate</span>
                    <span className="text-sm font-bold text-gray-900">{conversionRate}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">SLA Violation Rate</span>
                    <span className="text-sm font-bold text-red-500">{slaViolationRate}</span>
                 </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

