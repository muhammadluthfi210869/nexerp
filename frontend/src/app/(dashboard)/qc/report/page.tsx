"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import {
 OperationalDataTable,
 OperationalMetricCard,
 OperationalMetricGrid,
 OperationalPanel,
 OperationalStatusBadge,
 getOperationalStatusLabel,
} from "@/components/operational";
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

const SEVERITY_TONE: Record<string, "danger" | "pending" | "neutral"> = {
 CRITICAL: "danger",
 MAJOR: "pending",
};

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

 const rejectColumns = useMemo(
 () => [
 {
 accessorKey: "createdAt",
 header: "Tanggal",
 cell: ({ getValue }: { getValue: () => string }) => (
 <span className="text-[13px] tabular-nums text-slate-700">{formatDate(String(getValue()))}</span>
 ),
 },
 {
 accessorKey: "phase",
 header: () => <div className="text-center">Part</div>,
 cell: ({ getValue }: { getValue: () => string | null }) => (
 <div className="text-center text-[13px] text-slate-700">{getValue() ?? "—"}</div>
 ),
 },
 {
 accessorKey: "severity",
 header: () => <div className="text-center">Severity</div>,
 cell: ({ getValue }: { getValue: () => string | null }) => {
 const s = getValue();
 if (!s) return <div className="text-center text-slate-400">—</div>;
 const tone = SEVERITY_TONE[s] ?? "neutral";
 return (
 <div className="flex justify-center">
 <OperationalStatusBadge status={tone}>{s}</OperationalStatusBadge>
 </div>
 );
 },
 },
 {
 accessorKey: "defectCategory",
 header: () => <div className="text-center">Category</div>,
 cell: ({ getValue }: { getValue: () => string | null }) => (
 <div className="text-center text-[13px] text-slate-700">{getValue() ?? "—"}</div>
 ),
 },
 {
 accessorKey: "defectType",
 header: "Cause",
 cell: ({ getValue }: { getValue: () => string | null }) => (
 <span className="text-[13px] text-slate-700">{getValue() ?? "—"}</span>
 ),
 },
 {
 accessorKey: "notes",
 header: "Description",
 cell: ({ getValue }: { getValue: () => string | null }) => (
 <span className="text-[13px] text-slate-500 line-clamp-1 max-w-xs">
 {getValue() ?? "—"}
 </span>
 ),
 },
 ],
 [],
 );

 return (
 <OperationalMigrationShell
 title="Laporan QC"
 subtitle="Aktivitas QC, performa vendor & analisis reject"
 >
 {isLoading ? (
 <div className="flex justify-center p-20">
 <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
 </div>
 ) : (
 <div className="space-y-6">
 <OperationalMetricGrid>
 <OperationalMetricCard
 label="Inspeksi Bulan Ini"
 value={stats?.totalInspections ?? "0"}
 icon={<FlaskConical className="h-4 w-4" />}
 tone="blue"
 />
 <OperationalMetricCard
 label="Pass Rate"
 value={stats?.passRate ?? "0%"}
 icon={<ShieldCheck className="h-4 w-4" />}
 tone="green"
 helper={`Target ${stats?.passRate ?? "0%"}`}
 />
 <OperationalMetricCard
 label="Total Reject"
 value={stats?.totalReject ?? "0"}
 icon={<AlertTriangle className="h-4 w-4" />}
 tone="amber"
 />
 <OperationalMetricCard
 label="Nilai Kerugian"
 value={stats?.totalLoss ?? "Rp 0"}
 icon={<TrendingDown className="h-4 w-4" />}
 tone="red"
 />
 </OperationalMetricGrid>

 {rejects && rejects.length > 0 && (
 <OperationalPanel>
 <OperationalDataTable
 data={rejects}
 columns={rejectColumns as any}
 getRowId={(row: QCAudit) => row.id}
 searchPlaceholder="Cari part, kategori, atau deskripsi..."
 emptyMessage="Tidak ada data reject."
 />
 </OperationalPanel>
 )}

 {rejects && rejects.length === 0 && (
 <OperationalPanel className="flex flex-col items-center justify-center py-16 text-center">
 <ShieldCheck className="w-12 h-12 text-emerald-300 mb-3" />
 <p className="text-[13px] font-medium text-slate-500">
 Belum ada data reject. Semua produk dalam kondisi baik.
 </p>
 </OperationalPanel>
 )}
 </div>
 )}
 </OperationalMigrationShell>
 );
}
