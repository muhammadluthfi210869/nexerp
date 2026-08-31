"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  TrendingDown,
  DollarSign,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  PageShell,
  CanonicalMetricGrid,
  MetricCard,
  DataTable,
  StatusBadge,
  mapStatus,
  SectionCard,
  SectionCardContent,
} from "@/components/canonical";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { formatOperationalDate } from "@/lib/operational-formatters";
import type { ColumnDef } from "@tanstack/react-table";

export default function ProductionAuditPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["productionAuditLogs"],
    queryFn: async () => (await api.get("/production/step-logs")).data,
  });

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs.filter((log: any) =>
      (log.workOrderId ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditLogs, searchTerm]);

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        id: "workOrder",
        header: "Work Order",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 text-[12px] uppercase">WO-{(row.original.workOrderId ?? '').slice(-6)}</span>
            <span className="text-[10px] text-slate-400">{formatOperationalDate(row.original.loggedAt)}</span>
          </div>
        ),
      },
      {
        id: "stage",
        header: "Tahap",
        cell: ({ row }) => (
          <StatusBadge variant={mapStatus(row.original.stage)}>
            {getOperationalStatusLabel(row.original.stage)}
          </StatusBadge>
        ),
      },
      {
        id: "operator",
        header: "Operator",
        cell: ({ row }) => (
          <span className="text-[12px] font-medium text-slate-600">
            {row.original.operatorId || "—"}
          </span>
        ),
      },
      {
        id: "massBalance",
        header: () => <div className="text-center">Neraca Massa</div>,
        cell: ({ row }) => {
          const shrink = Number(row.original.shrinkageQty ?? 0);
          return (
            <span className={cn(
              "text-[11px] font-medium tabular-nums",
              shrink > 0 ? "text-amber-600" : "text-emerald-600"
            )}>
              {row.original.goodQty} / {row.original.inputQty}
            </span>
          );
        },
      },
      {
        id: "reject",
        header: () => <div className="text-center">Penolakan %</div>,
        cell: ({ row }) => {
          const inputQty = Number(row.original.inputQty);
          const rate = Number.isFinite(inputQty) && inputQty > 0
            ? (Number(row.original.rejectQty || 0) / inputQty) * 100
            : null;
          return (
            <span className={cn(
              "text-[11px] font-medium",
              rate !== null && rate > 5 ? "text-rose-600" : "text-slate-500"
            )}>
              {rate === null ? "—" : `${rate.toFixed(2)}%`}
            </span>
          );
        },
      },
      {
        id: "laborCost",
        header: () => <div className="text-right">Biaya Tenaga Kerja</div>,
        cell: ({ row }) => (
          <span className="block text-right text-[12px] font-medium tabular-nums">
            Rp {Number(row.original.laborCost || 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: "overheadCost",
        header: () => <div className="text-right">Overhead</div>,
        cell: ({ row }) => (
          <span className="block text-right text-[12px] font-medium tabular-nums">
            Rp {Number(row.original.overheadCost || 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: "qcStatus",
        header: () => <div className="text-center">Status QC</div>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {row.original.qcAudits?.some((a: any) => a.status === 'GOOD') ? (
              <span className="h-7 w-7 rounded-full bg-emerald-50 inline-flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            ) : (
              <span className="h-7 w-7 rounded-full bg-amber-50 inline-flex items-center justify-center border border-amber-100">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  if (isLoading) {
    return (
      <PageShell title="Audit Eksekusi Produksi" subtitle="Integritas operasional, atribusi biaya, dan kinerja mesin">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-[11px] font-medium text-slate-400">Memuat jejak audit...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Audit Eksekusi Produksi"
      subtitle="Integritas operasional, atribusi biaya, dan kinerja mesin"
      actions={
        <div className="flex gap-3">
          <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 w-64">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              placeholder="Cari work order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            aria-label="Filter"
            className="h-9 w-9 rounded-lg border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <CanonicalMetricGrid>
          <MetricCard
            label="Total Biaya Tenaga Kerja"
            value="Rp 12,450,000"
            helper="Atribusi bulan berjalan"
            icon={<DollarSign />}
            variant="success"
          />
          <MetricCard
            label="Overhead Mesin"
            value="Rp 28,120,000"
            helper="Pemanfaatan aset aktif"
            icon={<Cpu />}
            variant="info"
          />
          <MetricCard
            label="Rata-rata Tingkat Penolakan"
            value="0.84%"
            helper="Metrik kinerja kualitas"
            icon={<TrendingDown />}
            variant="danger"
          />
        </CanonicalMetricGrid>

        <SectionCard>
          <SectionCardContent className="p-0">
            <DataTable
              title="Log Eksekusi Terperinci"
              data={filteredLogs}
              columns={columns}
              getRowId={(row: any) => row.id}
              searchPlaceholder="Cari work order..."
              emptyMessage="Belum ada log audit"
              enableSearch={false}
            />
          </SectionCardContent>
        </SectionCard>
      </div>
    </PageShell>
  );
}
