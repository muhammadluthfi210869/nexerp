"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Clock, 
  TrendingDown,
  DollarSign,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { StatCard, DnaBadge, DnaInput } from "@/components/dna";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { DashboardShell } from "@/components/layout/DashboardShell";
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
    <DashboardShell
      title="Production Execution Audit"
      subtitle="Operational Integrity / Cost Attribution / Machine Performance"
      actions={
        <div className="flex gap-4">
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Search Work Order..."
            className="w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5 text-slate-900" />
          </button>
        </div>
      }
    >

      {/* COST ATTRIBUTION ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Labor Cost"
          value="Rp 12,450,000"
          subValue="Current Month Attribution"
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
        />
        <StatCard
          label="Machine Overhead"
          value="Rp 28,120,000"
          subValue="Active Asset Utilization"
          icon={<Cpu className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          label="Avg. Reject Rate"
          value="0.84%"
          subValue="Quality Performance Metric"
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
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
              {auditLogs?.filter((log: any) => (log.workOrderId ?? '').toLowerCase().includes(searchTerm.toLowerCase())).map((log: any) => (
                <DataTableRow key={log.id}>
                  <DataTableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase italic">WO-{(log.workOrderId ?? '').slice(-6)}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.loggedAt).toLocaleDateString()}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <DnaBadge status="info">
                      {log.stage}
                    </DnaBadge>
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
    </DashboardShell>
  );
}


