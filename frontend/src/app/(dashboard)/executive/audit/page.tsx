"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  History,
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
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DnaButton,
  DnaBadge,
  TableWrapper,
  StatCard,
  KpiCard,
} from "@/components/dna";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { format } from "date-fns";

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      try {
        const res = await api.get("/executive/audit-logs");
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } catch (e) {
        return [];
      }
    },
  });

  const filteredLogs = logs?.filter((log: any) => {
    const action = log.action || "";
    const userName = typeof log.user === "object" ? log.user?.name || "" : log.user || "";
    const entityId = log.entityId || "";
    return (
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entityId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <DashboardShell
      title="AUDIT"
      titleAccent="TRAIL"
      subtitle="Centralized Transactional Integrity & User Forensics"
      actions={
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search hash / user / entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-64 pl-11 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>
          <DnaButton variant="outline" icon={<Filter />} />
          <DnaButton variant="secondary" icon={<Download />}>Export Ledger</DnaButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--card-gap)]">
        <StatCard label="Active Sessions" value="24" icon={<User />} />
        <KpiCard label="System Integrity" value="100%" targetPct={100} icon={<Lock />} />
        <StatCard label="Today's Mutations" value="1,402" icon={<Database />} />
        <StatCard label="Risk Index" value="0.00" icon={<AlertCircle />} />
      </div>

      <TableWrapper>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Timestamp</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Identity</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Action Protocol</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4">Entity Scope</TableHead>
                <TableHead className="text-table-header text-slate-400 px-6 py-4 text-right">Checksum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredLogs?.length > 0 ? (
                filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="group hover:bg-slate-50/30 border-b border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-slate-300" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-800">{format(new Date(log.createdAt), "HH:mm:ss")}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase">{format(new Date(log.createdAt), "MMM dd, yyyy")}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {(() => {
                        const userName = typeof log.user === 'object' ? log.user?.name || 'System' : log.user || 'System';
                        const userRole = typeof log.user === 'object' ? log.user?.role || 'STAFF' : 'STAFF';
                        return (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">
                              {userName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-800">{userName}</p>
                              <p className="text-[9px] font-black text-blue-600 uppercase">{userRole}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ActionIcon type={log.type || log.action || 'UPDATE'} />
                        <p className="text-[11px] font-black uppercase text-slate-700">{log.action}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1">
                        <DnaBadge>
                          {log.entityType || log.entity || 'General'}
                        </DnaBadge>
                        <p className="text-[10px] font-bold text-slate-400">#{log.entityId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Fingerprint className="h-4 w-4 text-slate-200" />
                        <p className="text-[8px] font-mono text-slate-300 uppercase break-all max-w-[120px]">
                          {(log.hash || log.id || '0000000000000000').substring(0, 16)}...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <History size={48} className="stroke-[1px] text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-tighter text-slate-400">No forensic data found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TableWrapper>
    </DashboardShell>
  );
}

function ActionIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    CREATE: "bg-emerald-50",
    UPDATE: "bg-blue-50",
    DELETE: "bg-red-50",
    AUTHORIZE: "bg-purple-50",
    OVERRIDE: "bg-orange-50",
  };

  const bgClass = colors[type] || "bg-slate-50";

  return <div className={`h-2 w-2 rounded-full ${bgClass} ring-4 ring-slate-50`} />;
}

function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="px-6 py-4"><div className="h-8 w-32 bg-slate-100 rounded-xl" /></TableCell>
      <TableCell className="px-6 py-4"><div className="h-8 w-40 bg-slate-100 rounded-xl" /></TableCell>
      <TableCell className="px-6 py-4"><div className="h-8 w-36 bg-slate-100 rounded-xl" /></TableCell>
      <TableCell className="px-6 py-4"><div className="h-8 w-28 bg-slate-100 rounded-xl" /></TableCell>
      <TableCell className="px-6 py-4"><div className="h-8 w-20 bg-slate-100 rounded-xl ml-auto" /></TableCell>
    </TableRow>
  );
}
