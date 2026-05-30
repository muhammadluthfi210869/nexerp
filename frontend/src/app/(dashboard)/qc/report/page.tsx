"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/dna/StatCard";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { ShieldCheck, AlertTriangle, TrendingDown, FlaskConical, Loader2 } from "lucide-react";
import { DnaBadge } from "@/components/dna";

export default function QCReportPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["qc-report"],
    queryFn: async () => (await api.get("/qc/report")).data,
  });

  const { data: rejects } = useQuery({
    queryKey: ["qc-reject-analysis"],
    queryFn: async () => (await api.get("/qc/reject-analysis")).data,
  });

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
            <StatCard label="Pass Rate" value={stats?.passRate ?? "0%"} icon={<ShieldCheck />} />
            <StatCard label="Total Reject" value={stats?.totalReject ?? "0"} icon={<AlertTriangle />} />
            <StatCard label="Nilai Kerugian" value={stats?.totalLoss ?? "Rp 0"} icon={<TrendingDown />} />
          </div>

          {rejects?.length > 0 && (
            <div>
              <SectionLabel>Analisis Reject per Item</SectionLabel>
              <TableWrapper>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Material</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Part</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Jumlah Reject</TableHead>
                      <TableHead className="text-table-header text-slate-400 text-center py-4 px-4">Vendor</TableHead>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Penyebab</TableHead>
                      <TableHead className="text-table-header text-slate-400 py-4 px-4">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejects.map((r: any) => (
                      <TableRow key={r.id} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
                        <TableCell className="py-3 px-4 font-black text-slate-900 text-xs uppercase">{r.material}</TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <DnaBadge>
                            {r.part}
                          </DnaBadge>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-black text-slate-900 text-xs tabular-nums">{r.qty}</TableCell>
                        <TableCell className="py-3 px-4 text-center text-slate-500">{r.vendor || "-"}</TableCell>
                        <TableCell className="py-3 px-4 text-slate-500">{r.reason}</TableCell>
                        <TableCell className="py-3 px-4 text-blue-600 font-medium">{r.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </div>
          )}

          {rejects?.length === 0 && (
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
