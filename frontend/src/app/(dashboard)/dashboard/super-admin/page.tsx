"use client";

import { useState } from "react";
import {
  Terminal,
  ShieldCheck,
  Search,
  Users,
  FlaskConical,
  History,
  CreditCard,
  Zap,
  Boxes,
  Wifi,
  Server
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KpiCard } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dna";
import { Card } from "@/components/dna";
import { Badge } from "@/components/dna";
import { Button } from "@/components/dna";

// Import Departmental Views (We will use the actual page components or variants)
import { DashboardShell } from "@/components/layout/DashboardShell";
import CommercialDashboard from "../commercial/page";
import RndDashboard from "../../samples/rnd-dashboard/page";
import ProductionFloor from "../../production/production-floor-dashboard/page";
import FinanceDashboard from "../finance/page";

type SystemHealth = {
  status?: string;
  version?: string;
  modules?: { name: string; status: string }[];
};

type ErrorSummary = {
  totalErrors?: number;
  criticalErrors?: number;
};

type AuditLog = {
  id: string;
  timestamp: string;
  user: string;
  module: string;
  description: string;
  status: string;
};

export default function SuperAdminTerminal() {
  const health = useQuery<SystemHealth>({
    queryKey: ["system-health"],
    queryFn: async () => (await api.get("/system/health")).data,
    staleTime: 30_000,
  });

  const errors = useQuery<ErrorSummary>({
    queryKey: ["system-error-summary", 24],
    queryFn: async () => (await api.get("/system/errors/summary", { params: { hours: 24 } })).data,
    staleTime: 30_000,
  });

  const auditLogs = useQuery<AuditLog[]>({
    queryKey: ["system-audit-logs", 20],
    queryFn: async () => (await api.get("/system/audit-logs", { params: { limit: 20 } })).data,
    staleTime: 30_000,
  });

  const anyError = health.isError || errors.isError || auditLogs.isError;
  const modules = health.data?.modules ?? [];
  const activeModules = modules.filter((m) => m.status === "ACTIVE").length;
  const logs = Array.isArray(auditLogs.data) ? auditLogs.data : [];
  const lastLog = logs[0];

  const retryAll = () => {
    void health.refetch();
    void errors.refetch();
    void auditLogs.refetch();
  };

  return (
    <DashboardShell
      title="Executive Command"
      titleAccent="Terminal v7.0"
      subtitle="Hyper-Unified Audit Interface. Monitoring cross-departmental UX integrity and data interlocks across the entire ERP ecosystem from a single encrypted link."
    >
      <div className="grid grid-cols-4 gap-8 mb-6">
        <KpiCard
          label="Network Status"
          value={health.data?.status ?? "—"}
          subValue={health.data?.version ? `Build ${health.data.version}` : "GET /system/health"}
          icon={<Wifi />}
        />
        <KpiCard
          label="Active Modules"
          value={modules.length > 0 ? `${activeModules}/${modules.length}` : "—"}
          subValue={modules.length > 0 ? modules.map((m) => m.name).join(" · ") : "GET /system/health"}
          icon={<Server />}
        />
        <KpiCard
          label="Audit Trail (24h)"
          value={auditLogs.isLoading ? "…" : logs.length}
          subValue={lastLog ? `${lastLog.user} · ${lastLog.module}` : "GET /system/audit-logs"}
          icon={<ShieldCheck />}
        />
        <KpiCard
          label="Errors (24h)"
          value={errors.isLoading ? "…" : (errors.data?.totalErrors ?? "—")}
          subValue={
            errors.data
              ? `${errors.data.criticalErrors ?? 0} critical · GET /system/errors/summary`
              : "GET /system/errors/summary"
          }
          icon={<Zap />}
        />
      </div>

      {anyError && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          <span>Sebagian metrik sistem gagal dimuat dari server — nilai ditampilkan sebagai &quot;—&quot;.</span>
          <Button variant="outline" size="sm" onClick={retryAll} className="rounded-xl">
            Retry
          </Button>
        </div>
      )}

      <Tabs defaultValue="marketing" className="w-full space-y-8">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-gray-200">
          <TabsList className="bg-gray-50 border border-gray-200 p-1 rounded-xl w-full flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="marketing" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <Users className="w-3 h-3 mr-2" /> Commercial
            </TabsTrigger>
            <TabsTrigger value="rnd" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <FlaskConical className="w-3 h-3 mr-2" /> R&D Lab
            </TabsTrigger>
            <TabsTrigger value="production" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <History className="w-3 h-3 mr-2" /> Factory Floor
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <CreditCard className="w-3 h-3 mr-2" /> Treasury
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black text-[10px] font-black uppercase tracking-tight h-10 italic">
              <Boxes className="w-3 h-3 mr-2" /> Logistics
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Commercial Department UX */}
        <TabsContent value="marketing" className="mt-0">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-1 overflow-hidden">
            <div className="bg-gray-50 p-6 flex items-center justify-between border-b border-gray-200">
              <div>
                 <h3 className="text-xl font-bold text-gray-900 uppercase italic">Commercial Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Lead Attribution & Prospect Funnel UX</p>
              </div>
              <Button size="sm" variant="ghost" className="text-zinc-500 hover:text-white group">
                <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Inspect Source Code
              </Button>
            </div>
            <div className="p-4 bg-gray-50">
              <CommercialDashboard />
            </div>
          </div>
        </TabsContent>

        {/* R&D Department UX */}
        <TabsContent value="rnd" className="mt-0">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-1 overflow-hidden">
             <div className="bg-gray-50 p-6 flex items-center justify-between border-b border-gray-200">
              <div>
                 <h3 className="text-xl font-bold text-gray-900 uppercase italic">Chemical R&D Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Dosage Precision & Formula Interlocks</p>
              </div>
              <Badge className="bg-orange-500 text-black font-black italic">MODULE: R&D</Badge>
            </div>
            <div className="p-4 bg-gray-50">
              <RndDashboard />
            </div>
          </div>
        </TabsContent>

        {/* Production Department UX */}
        <TabsContent value="production" className="mt-0">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-1 overflow-hidden">
             <div className="bg-gray-50 p-6 flex items-center justify-between border-b border-gray-200">
              <div>
                 <h3 className="text-xl font-bold text-gray-900 uppercase italic">Floor Execution Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Mass Balance & Station Telemetry</p>
              </div>
              <Badge className="bg-emerald-500 text-black font-black italic">MODULE: PRODUCTION</Badge>
            </div>
            <div className="p-4 bg-gray-50">
              <ProductionFloor />
            </div>
          </div>
        </TabsContent>

        {/* Finance Department UX */}
        <TabsContent value="finance" className="mt-0">
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-1 overflow-hidden">
             <div className="bg-gray-50 p-6 flex items-center justify-between border-b border-gray-200">
              <div>
                 <h3 className="text-xl font-bold text-gray-900 uppercase italic">Treasury Control Audit</h3>
                <p className="text-xs text-zinc-500 font-medium">Validating Financial Interlocks & Revenue Gates</p>
              </div>
              <Badge className="bg-blue-500 text-white font-black italic">LEDGER_STATION</Badge>
            </div>
            <div className="p-4 bg-gray-50">
              <FinanceDashboard />
            </div>
          </div>
        </TabsContent>

        {/* Placeholder for Warehouse */}
        <TabsContent value="warehouse" className="mt-0">
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
            <Boxes size={48} className="text-zinc-700 mb-4 animate-bounce" />
            <p className="text-xl font-black text-zinc-600 uppercase tracking-tight italic tracking-tighter">Under Construction: Batch 3 - Smart Warehouse</p>
            <p className="text-xs text-zinc-800 font-sans mt-2 uppercase tracking-tighter">Initial Alpha Modules Required: Stock Intake & QR Matrix</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Audit Notification Rail — hanya muncul kalau ada audit log nyata. */}
      {lastLog && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-4 bg-white text-black p-4 rounded-xl shadow-[0_20px_50px_rgba(255,255,255,0.2)] border-2 border-white overflow-hidden">
             <div className="p-2 bg-gray-900 text-white rounded">
                <ShieldCheck size={16} className="fill-current" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-tight leading-none">
                  {lastLog.user} · {lastLog.module}
                </p>
                <p className="text-xs font-bold leading-none mt-1 uppercase italic">{lastLog.description}</p>
             </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

