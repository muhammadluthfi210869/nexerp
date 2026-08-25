"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  Zap,
  Clock,
  AlertCircle,
  Database,
  ArrowRightLeft,
  ChevronRight,
  Activity,
  FileCode,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  OperationalMetricCard,
  OperationalMetricGrid,
  OperationalPageShell,
  OperationalPanel,
  OperationalInput,
} from "@/components/operational";

const ENTITY_TYPES = ["ALL", "PRODUCTION_SCHEDULE", "WAREHOUSE_INBOUND", "STOCK_LEDGER"] as const;

const ENTITY_COLOR: Record<string, string> = {
  PRODUCTION_SCHEDULE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  WAREHOUSE_INBOUND: "bg-blue-50 text-blue-700 border-blue-100",
  STOCK_LEDGER: "bg-amber-50 text-amber-700 border-amber-100",
  PURCHASE_ORDER: "bg-purple-50 text-purple-700 border-purple-100",
};

export default function AuditLedgerPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/system/audit-logs?limit=100`);
      const data = await res.json();
      setLogs(data);
    } catch {
      if (process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true") {
        try {
          const { getMockData } = await import("@/lib/mock-data");
          setLogs(getMockData("/system/audit-log"));
        } catch {
          setLogs([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      String(log.entityId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.entityType ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.reason ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "ALL" || log.entityType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <OperationalPageShell
      title="Audit Ledger"
      subtitle="Pemantau state machine lintas-modul yang tidak dapat dimodifikasi"
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px]">
            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-500">Live stream aktif</span>
          </div>
          <button type="button" className="operational-button is-primary">
            Ekspor Ledger
          </button>
        </div>
      }
    >
      <div className="operational-stack">
        <OperationalMetricGrid>
          <OperationalMetricCard label="Total Event" value={logs.length} icon={<Zap className="h-4 w-4" />} tone="blue" />
          <OperationalMetricCard
            label="Transisi Otomatis"
            value={logs.filter((l) => !l.changedById).length}
            icon={<Activity className="h-4 w-4" />}
            tone="purple"
          />
          <OperationalMetricCard
            label="Override Manual"
            value={logs.filter((l) => l.changedById).length}
            icon={<AlertCircle className="h-4 w-4" />}
            tone="amber"
          />
          <OperationalMetricCard label="Integritas Ledger" value="99.9%" icon={<ShieldCheck className="h-4 w-4" />} tone="green" />
        </OperationalMetricGrid>

        <OperationalPanel>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <OperationalInput
                icon={<Search className="h-4 w-4" />}
                placeholder="Cari entity ID, tipe, atau alasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {ENTITY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "h-9 rounded-md px-3 text-[11px] font-medium uppercase tracking-wider transition",
                    filterType === type
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {String(type).replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </OperationalPanel>

        <OperationalPanel>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Activity className="h-8 w-8 animate-spin" />
              <p className="text-[13px] font-medium">Memuat ledger...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-300">
              <Database className="h-12 w-12 opacity-30" />
              <p className="text-[13px] font-medium">Tidak ada log yang cocok di ledger</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center"
                >
                  <div className="flex items-center gap-3 lg:w-[140px] lg:flex-col lg:items-start">
                    <div className="rounded-md bg-slate-100 p-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-900 tabular-nums">
                        {format(new Date(log.createdAt), "HH:mm:ss")}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        {format(new Date(log.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          ENTITY_COLOR[log.entityType] ?? "bg-slate-50 text-slate-700 border-slate-100",
                        )}
                      >
                        {String(log.entityType ?? "").replace("_", " ")}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        #{String(log.entityId ?? "").slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {log.fromState ?? "INIT"}
                      </span>
                      <ArrowRightLeft className="h-3 w-3 text-slate-300" />
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
                        {log.toState ?? "—"}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-[13px] text-slate-600">
                      {log.reason ?? "Transisi state otomatis diproses oleh protokol sistem."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 lg:w-[200px]">
                    <div className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-[11px] font-medium text-slate-400">
                      {String(log.changedBy?.fullName ?? "S").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-slate-900">
                        {log.changedBy?.fullName ?? "SYSTEM_DAEMON"}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Protokol event
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Detail event">
                      <FileCode className="h-4 w-4" />
                    </button>
                    <button type="button" className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Lihat event">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OperationalPanel>
      </div>
    </OperationalPageShell>
  );
}
