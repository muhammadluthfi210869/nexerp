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
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";
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
          <p className="text-xs font-black text-slate-400 uppercase tracking-tight italic">Memuat jejak audit...</p>
        </div>
      </div>
    );
  }

  return (
    <OperationalMigrationShell
      title="Audit Eksekusi Produksi"
      subtitle="Integritas operasional, atribusi biaya, dan kinerja mesin"
      actions={
        <div className="flex gap-4">
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Cari work order..."
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
          label="Total Biaya Tenaga Kerja"
          value="Rp 12,450,000"
          subValue="Atribusi bulan berjalan"
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
        />
        <StatCard
          label="Overhead Mesin"
          value="Rp 28,120,000"
          subValue="Pemanfaatan aset aktif"
          icon={<Cpu className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          label="Rata-rata Tingkat Penolakan"
          value="0.84%"
          subValue="Metrik kinerja kualitas"
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
        />
      </div>

      {/* AUDIT LOG TABLE */}
      <div>
        <div className="flex items-center gap-3 mb-3" style={{ marginTop: "var(--section-gap)" }}>
          <div className="w-1 h-5 rounded-full bg-primary" />
          <h2 className="text-[10px] font-black text-slate-500 tracking-tight">1. Log Eksekusi Terperinci</h2>
        </div>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableTh>WORK ORDER</DataTableTh>
                <DataTableTh>Tahap</DataTableTh>
                <DataTableTh>Operator</DataTableTh>
                <DataTableTh align="center">Neraca Massa</DataTableTh>
                <DataTableTh align="center">Penolakan %</DataTableTh>
                <DataTableTh align="right">Biaya Tenaga Kerja</DataTableTh>
                <DataTableTh align="right">Overhead</DataTableTh>
                <DataTableTh align="center">Status QC</DataTableTh>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {auditLogs?.filter((log: any) => (log.workOrderId ?? '').toLowerCase().includes(searchTerm.toLowerCase())).map((log: any) => {
                const inputQty = Number(log.inputQty);
                const rejectRate = Number.isFinite(inputQty) && inputQty > 0
                  ? (Number(log.rejectQty || 0) / inputQty) * 100
                  : null;
                return (
                <DataTableRow key={log.id}>
                  <DataTableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-[11px] uppercase italic">WO-{(log.workOrderId ?? '').slice(-6)}</span>
                      <span className="text-[8px] font-black text-slate-400 tracking-widest">{formatOperationalDate(log.loggedAt)}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <DnaBadge status="info">
                      {getOperationalStatusLabel(log.stage)}
                    </DnaBadge>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="text-[11px] font-bold text-slate-600">{log.operatorId || "—"}</span>
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
                      rejectRate !== null && rejectRate > 5 ? "text-rose-600" : "text-slate-400"
                    )}>
                      {rejectRate === null ? "—" : `${rejectRate.toFixed(2)}%`}
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
                );
              })}
            </DataTableBody>
          </DataTable>
        </Card>
      </div>
    </OperationalMigrationShell>
  );
}


