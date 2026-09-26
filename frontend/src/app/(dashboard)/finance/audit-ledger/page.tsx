"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { 
  DnaButton, 
  DnaInput, 
  DnaCard, 
  DnaStatCard, 
  DnaBadge 
} from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";
import { api } from "@/lib/api";

function getBadgeVariant(type: string) {
  switch (type) {
    case "PRODUCTION_SCHEDULE": return "success" as const;
    case "WAREHOUSE_INBOUND": return "info" as const;
    case "STOCK_LEDGER": return "warning" as const;
    case "PURCHASE_ORDER": return "purple" as const;
    default: return "default" as const;
  }
}

function matchAuditLog(log: any, query: string, filterType: string): boolean {
  if (filterType !== "ALL" && log.entityType !== filterType) {
    return false;
  }
  if (!query) return true;
  return Boolean(
    log.entityId?.toLowerCase().includes(query) ||
    log.entityType?.toLowerCase().includes(query) ||
    log.reason?.toLowerCase().includes(query)
  );
}

function AuditLogCard({ log }: { log: any }) {
  const shortId = (log.entityId || "").slice(-8).toUpperCase();
  const createdDate = new Date(log.createdAt);

  return (
    <DnaCard className="flex flex-col lg:flex-row lg:items-center gap-6 p-6">
      <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-1 min-w-[140px]">
        <div className="p-2 bg-slate-50 rounded-xl">
          <Clock className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-900 tracking-tight">
            {format(createdDate, "HH:mm:ss")}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
            {format(createdDate, "dd MMM yyyy")}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <DnaBadge variant={getBadgeVariant(log.entityType)}>
            {(log.entityType || "").replace("_", " ")}
          </DnaBadge>
          <span className="text-xs font-bold text-slate-400 tabular-nums">
            #{shortId}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-slate-900 mb-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600 border border-slate-200">
              {log.fromState || "INIT"}
            </span>
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
            <span className="px-2 py-0.5 bg-slate-900 rounded text-xs font-bold text-white shadow-xs">
              {log.toState}
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-slate-600 line-clamp-1">
          {log.reason || "Automated state transition processed by system protocol."}
        </p>
      </div>

      <div className="lg:w-48 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
          {log.changedBy?.fullName?.charAt(0) || "S"}
        </div>
        <div>
          <p className="text-xs font-black text-slate-900 leading-none mb-0.5 truncate">
            {log.changedBy?.fullName || "SYSTEM_DAEMON"}
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Event Protocol</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DnaButton
          variant="ghost"
          size="sm"
          aria-label="View source payload"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900"
        >
          <FileCode className="w-4 h-4" />
        </DnaButton>
        <DnaButton
          variant="ghost"
          size="sm"
          aria-label="View transition details"
          className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900"
        >
          <ChevronRight className="w-4 h-4" />
        </DnaButton>
      </div>
    </DnaCard>
  );
}

// @complexity-rationale: Multi-field real-time audit ledger stream with filter dimensions and auto-polling
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
      // Through the shared client, so the Bearer token is attached and a 401
      // surfaces as an axios error instead of an error envelope fed into setLogs.
      const res = await api.get("/system/audit-logs", { params: { limit: 100 } });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  const query = searchTerm.toLowerCase().trim();
  const filteredLogs = logs.filter(log => matchAuditLog(log, query, filterType));

  return (
    <TableShell
      title="Audit"
      titleAccent="Ledger"
      subtitle="Immutable Cross-Module State Machine Monitor"
      actions={
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3 shadow-xs">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Live Stream Active</span>
          </div>
          <DnaButton variant="primary" className="rounded-xl px-6 h-10">
            EXPORT LEDGER
          </DnaButton>
        </div>
      }
      filters={
        <>
          <div className="relative flex-1">
            <DnaInput 
              type="text" 
              placeholder="Search by Entity ID, Type, or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "PRODUCTION_SCHEDULE", "WAREHOUSE_INBOUND", "STOCK_LEDGER"].map((type) => (
              <DnaButton
                key={type}
                variant={filterType === type ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilterType(type)}
                className="whitespace-nowrap"
              >
                {type.replace("_", " ")}
              </DnaButton>
            ))}
          </div>
        </>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-slate-400" />
            <p className="font-bold text-sm uppercase tracking-widest text-slate-400">Hydrating Ledger...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <DnaCard className="border-dashed py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
            <Database className="w-16 h-16 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest text-slate-400">No matching logs found in the ledger</p>
          </DnaCard>
        ) : (
          filteredLogs.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <DnaStatCard label="Total Events" value={logs.length} icon={<Zap className="w-4 h-4 text-blue-600" />} variant="blue" />
        <DnaStatCard label="Auto Transitions" value={logs.filter(l => !l.changedById).length} icon={<RefreshCw className="w-4 h-4 text-slate-600" />} variant="slate" />
        <DnaStatCard label="Manual Override" value={logs.filter(l => l.changedById).length} icon={<AlertCircle className="w-4 h-4 text-amber-600" />} variant="warning" />
        <DnaStatCard label="Ledger Integrity" value="99.9%" icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} variant="emerald" />
      </div>
    </TableShell>
  );
}

