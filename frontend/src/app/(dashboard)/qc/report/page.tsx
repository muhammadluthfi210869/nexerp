"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard, KpiCard, TableWrapper, SectionLabel, DnaBadge } from "@/components/dna";
import { ShieldCheck, AlertTriangle, TrendingDown, FlaskConical, Loader2 } from "lucide-react";

interface QCAudit {
  id: string;
  phase: string | null;
  status: string;
  defectType: string | null;
  defectCategory: string | null;
  defectCause: string | null;
  severity: string | null;
  disposition: string | null;
  correctiveAction: string | null;
  notes: string | null;
  createdAt: string;
}

export default function QCReportPage() {
  const { data: audits, isLoading } = useQuery<QCAudit[]>({
    queryKey: ["qc-report"],
    queryFn: async () => (await api.get("/qc/report")).data,
  });

  const { data: rejects } = useQuery<QCAudit[]>({
    queryKey: ["qc-reject-analysis"],
    queryFn: async () => (await api.get("/qc/analytics/reject-analysis")).data,
  });

  const stats = useMemo(() => {
    if (!audits) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAudits = audits.filter((a) => new Date(a.createdAt) >= monthStart);
    const totalInspections = monthAudits.length;
    const goodCount = monthAudits.filter((a) => a.status === "GOOD").length;
    const passRate = totalInspections > 0 ? `${((goodCount / totalInspections) * 100).toFixed(0)}%` : "0%";
    const totalReject = audits.filter((a) => a.status === "REJECT").length;
    return { totalInspections, passRate, totalReject, totalLoss: "Rp 0" };
  }, [audits]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <DashboardShell
      title="QC"
      titleAccent="Report"
      subtitle="Aktivitas QC, performa vendor & analisis reject"
    >
      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Inspeksi Bulan Ini" value={stats?.totalInspections ?? "0"} icon={<FlaskConical />} />
            <KpiCard label="Pass Rate" value={stats?.passRate ?? "0%"} targetPct={parseInt(stats?.passRate ?? "0") || 0} icon={<ShieldCheck />} />
            <StatCard label="Total Reject" value={stats?.totalReject ?? "0"} icon={<AlertTriangle />} />
            <StatCard label="Nilai Kerugian" value={stats?.totalLoss ?? "Rp 0"} icon={<TrendingDown />} />
          </div>

          {rejects && rejects.length > 0 && (
            <div>
              <SectionLabel>Analisis Reject per Item</SectionLabel>
              <TableWrapper>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Date</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Part</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Severity</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Category</TableHead>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Cause</TableHead>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejects.map((r) => (
                      <TableRow key={r.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-3 px-4 text-slate-500 text-xs tabular-nums">{formatDate(r.createdAt)}</TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <DnaBadge>{r.phase || "—"}</DnaBadge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <DnaBadge status={r.severity === "CRITICAL" ? "critical" : r.severity === "MAJOR" ? "warning" : "default"}>
                            {r.severity || "—"}
                          </DnaBadge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center text-slate-500">{r.defectCategory || "—"}</TableCell>
                        <TableCell className="py-3 px-4 text-slate-500">{r.defectType || "—"}</TableCell>
                        <TableCell className="py-3 px-4 text-slate-400 text-xs max-w-xs truncate">{r.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </div>
          )}

          {rejects && rejects.length === 0 && (
            <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-[24px]">
              <ShieldCheck className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">Belum ada data reject. Semua produk dalam kondisi baik.</p>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
