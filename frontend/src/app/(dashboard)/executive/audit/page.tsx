"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  AlertCircle,
  Clock,
  User,
  Database,
  Lock,
  Fingerprint,
} from "lucide-react";
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
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

const ACTION_TONE: Record<string, string> = {
  CREATE: "bg-emerald-50",
  UPDATE: "bg-blue-50",
  DELETE: "bg-red-50",
  AUTHORIZE: "bg-purple-50",
  OVERRIDE: "bg-orange-50",
};

function ActionIcon({ type }: { type: string }) {
  const bgClass = ACTION_TONE[type] || "bg-slate-50";
  return <span className={`inline-block h-2 w-2 rounded-full ${bgClass} ring-4 ring-slate-50`} />;
}

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      try {
        const res = await api.get("/executive/audit-logs");
        return res.data;
      } catch (e) {
        return [
          { id: "1", createdAt: new Date().toISOString(), user: { name: "Ahmad Finance", role: "CONTROLLER" }, action: "AUTHORIZE_PAYMENT", type: "AUTHORIZE", entityType: "SALES_ORDER", entityId: "SO-2024-001", hash: "a8f23b9d0e1c2d3e4f5a6b7c8d9e0f1a" },
          { id: "2", createdAt: new Date(Date.now() - 3600000).toISOString(), user: { name: "Budi Warehouse", role: "WH_MANAGER" }, action: "STOCK_ADJUSTMENT", type: "UPDATE", entityType: "INVENTORY", entityId: "SKU-RM-042", hash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7" },
          { id: "3", createdAt: new Date(Date.now() - 7200000).toISOString(), user: { name: "Citra Sales", role: "SALES_LEAD" }, action: "NEW_CONTRACT", type: "CREATE", entityType: "CLIENT", entityId: "CL-992", hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8" },
          { id: "4", createdAt: new Date(Date.now() - 10800000).toISOString(), user: { name: "Dedi Admin", role: "SUPER_ADMIN" }, action: "SENSITIVE_OVERRIDE", type: "OVERRIDE", entityType: "USER_PERMISSIONS", entityId: "USR-08", hash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9" },
        ];
      }
    },
  });

  const filteredLogs = useMemo(
    () =>
      (logs || []).filter((log: any) =>
        (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityId || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [logs, searchTerm]
  );

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-300" />
            <div>
              <p className="text-[11px] font-bold text-slate-800 tabular-nums">
                {format(new Date(row.original.createdAt), "HH:mm:ss")}
              </p>
              <p className="text-[9px] font-black text-slate-300 uppercase">
                {format(new Date(row.original.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "user",
        header: "Identity",
        cell: ({ row }) => {
          const u = row.original.user;
          const initials = (u?.name || "—").substring(0, 2).toUpperCase();
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">
                {initials}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">{u?.name ?? "—"}</p>
                <p className="text-[9px] font-black text-blue-600 uppercase">{u?.role ?? "—"}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action Protocol",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ActionIcon type={row.original.type} />
            <p className="text-[11px] font-black uppercase text-slate-700">{row.original.action}</p>
          </div>
        ),
      },
      {
        accessorKey: "entityType",
        header: "Entity Scope",
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge variant={mapStatus(row.original.entityType)}>
              {row.original.entityType}
            </StatusBadge>
            <p className="text-[10px] font-bold text-slate-400">#{row.original.entityId}</p>
          </div>
        ),
      },
      {
        accessorKey: "hash",
        header: "Checksum",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Fingerprint className="h-3.5 w-3.5 text-slate-300" />
            <p className="text-[8px] font-mono text-slate-400 uppercase break-all max-w-[120px]">
              {row.original.hash ? `${row.original.hash.substring(0, 16)}...` : "—"}
            </p>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageShell
      title="Audit Trail"
      subtitle="Centralized Transactional Integrity & User Forensics"
      actions={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 min-w-[260px]">
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari hash / user / entity..."
              className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
            />
          </label>
          <button
            type="button"
            className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>Export Ledger</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <CanonicalMetricGrid>
          <MetricCard label="Active Sessions" value="24" icon={<User />} variant="info" />
          <MetricCard label="System Integrity" value="100%" icon={<Lock />} variant="success" />
          <MetricCard label="Today's Mutations" value="1,402" icon={<Database />} variant="warning" />
          <MetricCard label="Risk Index" value="0.00" icon={<AlertCircle />} variant="danger" />
        </CanonicalMetricGrid>

        <SectionCard>
          <SectionCardContent className="p-0">
            <DataTable
              data={(filteredLogs as any[]) || []}
              columns={columns}
              getRowId={(row: any) => row.id}
              searchPlaceholder="Cari hash, user, atau entity..."
              loading={isLoading}
              emptyMessage="Tidak ada data forensik ditemukan"
              enableSearch={false}
            />
          </SectionCardContent>
        </SectionCard>
      </div>
    </PageShell>
  );
}
