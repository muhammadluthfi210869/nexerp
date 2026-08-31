"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 FileText,
 Search,
 Download,
 Eye,
 Printer,
 CheckCircle2,
 ShieldCheck,
 Zap,
 History as HistoryIcon,
 Calendar,
 Lock,
 Loader2,
 X,
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
import { formatOperationalDate } from "@/lib/operational-formatters";
import {
 Dialog,
 DialogContent,
} from "@/components/ui/dialog";
import type { ColumnDef } from "@tanstack/react-table";

export default function CoACenterPage() {
 const [search, setSearch] = useState("");
 const [viewCoaId, setViewCoaId] = useState<string | null>(null);

 const { data: coaRecords, isLoading } = useQuery({
 queryKey: ["coa-records"],
 queryFn: async () => {
 const res = await api.get("/qc/audits", { params: { status: "GOOD" } });
 return (res.data || []).map((a: any) => ({
 id: a.reportNumber || a.id,
 rawId: a.id,
 product: a.material?.name || a.notes || "Unknown",
 batch: a.materialBatchNo || a.id.substring(0, 8).toUpperCase(),
 releaseDate: new Date(a.createdAt).toISOString().split("T")[0],
 status: "VERIFIED",
 analyst: a.analyst?.fullName || "—",
 phase: a.phase,
 parameters: {
 ph: a.phValue,
 viscosity: a.viscosityValue,
 organoleptic: a.organoleptic,
 samplingVolume: a.samplingVolume,
 sealingCheck: a.sealingCheck,
 labelingCheck: a.labelingCheck,
 expDateCheck: a.expDateCheck,
 density: a.densityValue,
 homogenity: a.homogenityPass,
 torque: a.torqueValue,
 leakTest: a.leakTestPass,
 dimension: a.dimensionCheck,
 coaVerified: a.coaVerified,
 },
 defectCategory: a.defectCategory,
 defectType: a.defectType,
 notes: a.notes,
 }));
 },
 staleTime: 30_000,
 });

 const filtered = (coaRecords || []).filter(
 (r: any) =>
 search === "" ||
 r.product.toLowerCase().includes(search.toLowerCase()) ||
 r.batch.toLowerCase().includes(search.toLowerCase()) ||
 (r.id || "").toLowerCase().includes(search.toLowerCase()),
 );

 const selectedCoa = (coaRecords || []).find((r: any) => r.id === viewCoaId || r.rawId === viewCoaId);

 const totalRecords = coaRecords?.length ?? 0;
 const verifiedCount = (coaRecords || []).length;
 const monthCount = useMemo(() => {
 if (!coaRecords) return 0;
 const now = Date.now();
 return coaRecords.filter((r: any) => {
 const t = new Date(r.releaseDate).getTime();
 return now - t < 30 * 24 * 60 * 60 * 1000;
 }).length;
 }, [coaRecords]);

 const columns = useMemo<ColumnDef<any, any>[]>(
 () => [
 {
 accessorKey: "id",
 header: "Certificate ID",
 cell: ({ row }) => (
 <div className="flex items-center gap-3">
 <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
 <ShieldCheck className="h-4 w-4" />
 </div>
 <span className="text-[13px] font-medium text-slate-900 uppercase">{row.original.id}</span>
 </div>
 ),
 },
 {
 accessorKey: "product",
 header: "Product & Batch",
 cell: ({ row }) => (
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-slate-900">{row.original.product}</span>
 <span className="text-[11px] text-slate-500">Batch Ref: {row.original.batch}</span>
 </div>
 ),
 },
 {
 accessorKey: "analyst",
 header: "Authorized By",
 cell: ({ row }) => (
 <div className="flex items-center gap-2">
 <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
 {row.original.analyst !== "—" ? row.original.analyst.charAt(0) : "?"}
 </div>
 <span className="text-[12px] font-medium text-slate-700">{row.original.analyst}</span>
 </div>
 ),
 },
 {
 accessorKey: "releaseDate",
 header: "Release Date",
 cell: ({ getValue }) => (
 <div className="flex items-center gap-2 text-[12px] font-medium text-slate-700 tabular-nums">
 <Calendar className="h-3.5 w-3.5 text-slate-400" />
 <span>{formatOperationalDate(String(getValue())) || "—"}</span>
 </div>
 ),
 },
 {
 accessorKey: "status",
 header: () => <div className="text-center">Audit Status</div>,
 cell: ({ row }) => (
 <div className="flex justify-center">
 <StatusBadge variant={mapStatus(row.original.status)}>
 {row.original.status}
 </StatusBadge>
 </div>
 ),
 },
 {
 id: "actions",
 header: () => <div className="text-right">Documents</div>,
 cell: ({ row }) => (
 <div className="flex justify-end gap-2">
 <button
 type="button"
 className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
 aria-label="View"
 onClick={() => setViewCoaId(row.original.id)}
 >
 <Eye className="h-4 w-4" />
 </button>
 <button
 type="button"
 className="h-8 w-8 rounded-md border border-[#E2E8F0] bg-white text-slate-500 hover:bg-slate-50 inline-flex items-center justify-center"
 aria-label="Print"
 >
 <Printer className="h-4 w-4" />
 </button>
 <button
 type="button"
 className="h-8 px-3 inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-50"
 >
 <Download className="h-3.5 w-3.5" />
 <span>PDF CoA</span>
 </button>
 </div>
 ),
 },
 ],
 [],
 );

 return (
 <PageShell
 title="CoA Center"
 subtitle="Professional Certificate of Analysis generation & archive"
 actions={
 <div className="flex items-center gap-2">
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 <HistoryIcon className="h-4 w-4" />
 <span>Global Archive</span>
 </button>
 <button
 type="button"
 className="h-9 px-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 <Zap className="h-4 w-4" />
 <span>Batch Auto-Generate</span>
 </button>
 </div>
 }
 >
 <div className="flex flex-col gap-6">
 <CanonicalMetricGrid>
 <MetricCard label="Total CoA Records" value={totalRecords} icon={<FileText />} variant="info" />
 <MetricCard label="Verified" value={verifiedCount} icon={<ShieldCheck />} variant="success" />
 <MetricCard label="Released (30 hari)" value={monthCount} icon={<Calendar />} variant="warning" />
 </CanonicalMetricGrid>

 <SectionCard>
 <SectionCardContent>
 <div className="flex flex-row items-center gap-3">
 <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 flex-1">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <input
 type="search"
 placeholder="Search by Batch Number or Product Name..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
 />
 </label>
 <button
 type="button"
 onClick={() => setSearch("")}
 className="h-10 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
 >
 Clear Filter
 </button>
 </div>
 </SectionCardContent>
 </SectionCard>

 <DataTable
 data={filtered as any}
 columns={columns}
 getRowId={(row: any) => row.id}
 loading={isLoading}
 searchPlaceholder="Cari CoA..."
 emptyMessage="Belum ada CoA terverifikasi"
 enableSearch={false}
 />

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <SectionCard>
 <SectionCardContent>
 <h3 className="text-[13px] font-semibold text-slate-900">Standard CoA Template</h3>
 <div className="mt-3 flex flex-col gap-2">
 <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-2">
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-emerald-500" />
 <span className="text-[12px] font-medium text-slate-700">Clinical Export V1</span>
 </div>
 <StatusBadge variant="success">Active</StatusBadge>
 </div>
 <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-2 opacity-60">
 <div className="flex items-center gap-2">
 <FileText className="h-4 w-4 text-slate-400" />
 <span className="text-[12px] font-medium text-slate-700">Retail Minimalist V2</span>
 </div>
 </div>
 </div>
 <button
 type="button"
 className="h-9 mt-4 w-full rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700"
 >
 Manage Templates
 </button>
 </SectionCardContent>
 </SectionCard>

 <SectionCard>
 <SectionCardContent>
 <h3 className="text-[13px] font-semibold text-slate-900">CoA Security Vault</h3>
 <p className="mt-1 text-[11px] text-slate-500">Digital signatures & integrity verification</p>
 <div className="mt-4 flex items-center gap-3">
 <div className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
 <Lock className="h-6 w-6" />
 </div>
 <div>
 <p className="text-[12px] font-semibold text-slate-900">256-bit Encrypted</p>
 <p className="text-[11px] text-slate-500">All exported CoAs are cryptographically signed.</p>
 </div>
 </div>
 </SectionCardContent>
 </SectionCard>
 </div>
 </div>

 <Dialog open={!!viewCoaId} onOpenChange={(open) => !open && setViewCoaId(null)}>
 <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px] rounded-[12px] border border-[#E2E8F0] bg-white p-0">
 <div className="relative bg-emerald-600 p-5 text-white">
 <button
 onClick={() => setViewCoaId(null)}
 className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 hover:bg-white/30"
 aria-label="Close"
 >
 <X className="h-4 w-4" />
 </button>
 <div className="flex items-center gap-3">
 <ShieldCheck className="h-6 w-6" />
 <div>
 <h3 className="text-[16px] font-semibold">Certificate of Analysis</h3>
 <p className="mt-0.5 text-[11px] text-emerald-100">
 {selectedCoa?.id || viewCoaId}
 </p>
 </div>
 </div>
 </div>
 {selectedCoa ? (
 <div className="flex flex-col gap-5 p-5">
 <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#E2E8F0] bg-slate-50 p-3">
 <div>
 <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Product</p>
 <p className="mt-1 text-[13px] font-medium text-slate-900">{selectedCoa.product}</p>
 </div>
 <div>
 <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Batch</p>
 <p className="mt-1 text-[13px] font-medium text-slate-900">{selectedCoa.batch}</p>
 </div>
 <div>
 <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Release Date</p>
 <p className="mt-1 text-[13px] font-medium text-slate-900">{formatOperationalDate(selectedCoa.releaseDate)}</p>
 </div>
 <div>
 <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Inspector</p>
 <p className="mt-1 text-[13px] font-medium text-slate-900">{selectedCoa.analyst}</p>
 </div>
 {selectedCoa.phase && (
 <div className="col-span-2">
 <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Phase</p>
 <StatusBadge variant="info" className="mt-1">{selectedCoa.phase}</StatusBadge>
 </div>
 )}
 </div>

 <div>
 <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Test Parameters</h4>
 <div className="overflow-hidden rounded-lg border border-[#E2E8F0]">
 <table className="w-full text-left">
 <thead className="bg-slate-50">
 <tr>
 <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-400">Parameter</th>
 <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-400">Result</th>
 <th className="px-3 py-2 text-[10px] font-medium uppercase text-slate-400">Status</th>
 </tr>
 </thead>
 <tbody>
 {selectedCoa.parameters &&
 Object.entries(selectedCoa.parameters)
 .filter(([, v]) => v !== undefined && v !== null)
 .map(([key, value]) => (
 <tr key={key} className="border-t border-[#E2E8F0]">
 <td className="px-3 py-2 text-[12px] font-medium uppercase text-slate-700">{key}</td>
 <td className="px-3 py-2 font-mono text-[12px] text-slate-600">
 {typeof value === "boolean" ? (value ? "PASS" : "FAIL") : String(value)}
 </td>
 <td className="px-3 py-2">
 <StatusBadge variant={value !== false ? "success" : "destructive"}>
 {value !== false ? "PASS" : "FAIL"}
 </StatusBadge>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {selectedCoa.notes && (
 <div className="rounded-lg border border-[#E2E8F0] bg-slate-50 p-3">
 <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Notes</p>
 <p className="text-[12px] text-slate-600">{selectedCoa.notes}</p>
 </div>
 )}

 <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
 <CheckCircle2 className="h-5 w-5 text-emerald-600" />
 <div>
 <p className="text-[12px] font-medium text-emerald-800">This audit is verified as GOOD</p>
 <p className="text-[10px] text-emerald-600">
 The Certificate of Analysis confirms all parameters passed quality inspection.
 </p>
 </div>
 </div>
 </div>
 ) : (
 <div className="p-12 text-center">
 <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
 <p className="mt-3 text-[12px] text-slate-400">Loading CoA details...</p>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </PageShell>
 );
}
