"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  DollarSign,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { DataTable, DataTableHead, DataTableTh, DataTableBody, DataTableRow, DataTableCell } from "@/components/layout/DataTable";

export default function ProductionAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["productionAuditLogs"],
    queryFn: async () => (await api.get("/production/step-logs")).data,
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Clock className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-tight italic">Analyzing Audit Trails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-base min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Production Execution Audit
              <Badge className="bg-slate-900 text-white border-none font-black text-[10px] px-3">PHASE 5</Badge>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Operational Integrity / Cost Attribution / Machine Performance</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Work Order..." 
              className="pl-12 pr-6 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-slate-900 transition-all w-64 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5 text-slate-900" />
          </button>
        </div>
      </div>

      {/* COST ATTRIBUTION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Labor Cost" 
          value="Rp 12,450,000" 
          sub="Current Month Attribution"
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trend="+4.2%"
        />
        <MetricCard 
          label="Machine Overhead" 
          value="Rp 28,120,000" 
          sub="Active Asset Utilization"
          icon={<Cpu className="w-6 h-6 text-blue-600" />}
          trend="-2.1%"
        />
        <MetricCard 
          label="Avg. Reject Rate" 
          value="0.84%" 
          sub="Quality Performance Metric"
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          isAlert
        />
      </div>

      {/* AUDIT LOG TABLE */}
      <div>
        <SectionDivider number={1} title="DETAILED EXECUTION LOGS" accentColor="primary" />
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <DataTable>
            <DataTableHead>
              <DataTableTh>WORK ORDER</DataTableTh>
              <DataTableTh>STAGE</DataTableTh>
              <DataTableTh>OPERATOR</DataTableTh>
              <DataTableTh align="center">MASS BALANCE</DataTableTh>
              <DataTableTh align="center">REJECT %</DataTableTh>
              <DataTableTh align="right">LABOR COST</DataTableTh>
              <DataTableTh align="right">OVERHEAD</DataTableTh>
              <DataTableTh align="center">QC STATUS</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {auditLogs?.filter((log: any) => log.workOrderId.toLowerCase().includes(searchTerm.toLowerCase())).map((log: any) => (
                <DataTableRow key={log.id}>
                  <DataTableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase italic">WO-{log.workOrderId.slice(-6)}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.loggedAt).toLocaleDateString()}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge className="bg-slate-100 text-slate-900 border-none font-black text-[9px] uppercase tracking-tighter">
                      {log.stage}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[11px] font-bold text-slate-600 uppercase">{log.operatorId || "N/A"}</span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <span className={cn(
                      "text-[10px] font-black tabular-nums",
                      log.shrinkageQty > 0 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {log.goodQty} / {log.inputQty}
                    </span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    <span className={cn(
                      "text-[10px] font-black",
                      (log.rejectQty / log.inputQty) > 0.05 ? "text-rose-600" : "text-slate-400"
                    )}>
                      {((log.rejectQty / log.inputQty) * 100).toFixed(2)}%
                    </span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-[11px] font-black tabular-nums">Rp {Number(log.laborCost || 0).toLocaleString()}</span>
                  </DataTableCell>
                  <DataTableCell align="right">
                    <span className="text-[11px] font-black tabular-nums">Rp {Number(log.overheadCost || 0).toLocaleString()}</span>
                  </DataTableCell>
                  <DataTableCell align="center">
                    {log.qcAudits?.some((a: any) => a.status === 'GOOD') ? (
                      <div className="p-1.5 bg-emerald-50 rounded-full inline-block">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-amber-50 rounded-full inline-block">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                    )}
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, trend, isAlert }: any) {
  return (
    <Card className={cn(
      "p-8 border-none shadow-sm rounded-3xl bg-white group transition-all hover:shadow-xl hover:shadow-slate-200/50 relative overflow-hidden",
      isAlert && "ring-2 ring-rose-100"
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && (
          <Badge className={cn(
            "font-black text-[9px] px-2 py-0.5 border-none",
            trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend}
          </Badge>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-1">{value}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{label}</p>
        <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">{sub}</p>
      </div>
    </Card>
  );
}

