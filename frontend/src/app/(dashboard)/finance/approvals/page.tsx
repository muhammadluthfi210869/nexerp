"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
 CheckCircle2, 
 Building2, 
 ArrowRightCircle,
 Search
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { getOperationalStatusLabel } from "@/components/operational/OperationalUI";
import { TableWrapper, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { 
 Table, 
 TableBody, 
 TableCell, 
 TableHead, 
 TableHeader, 
 TableRow 
} from "@/components/ui/table";

export default function FinanceApprovalsPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");

 const { data: requests = [] } = useQuery({
 queryKey: ["finance-fund-approvals"],
 queryFn: async () => {
 const resp = await api.get("/finance/fund-requests");
 return resp.data;
 },
 });

 const approveMutation = useMutation({
 mutationFn: (id: string) => api.patch(`/finance/fund-request/${id}/approve`, {}),
 onSuccess: () => {
 toast.success("Pengajuan disetujui.");
 queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
 }
 });

 const disburseMutation = useMutation({
 mutationFn: (id: string) => api.post(`/finance/fund-request/${id}/disburse`, {}),
 onSuccess: () => {
 toast.success("Dana dicairkan & Jurnal diposting.");
 queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
 }
 });

 const filteredRequests = requests.filter((req: any) => {
 const term = searchTerm.toLowerCase();
 return (
 req.reason?.toLowerCase().includes(term) ||
 req.departmentId?.toLowerCase().includes(term) ||
 req.requester?.fullName?.toLowerCase().includes(term) ||
 req.status?.toLowerCase().includes(term)
 );
 });

 const getDnaStatus = (status: string) => {
 switch (status) {
 case "PENDING_APPROVAL_MGR":
 return <DnaBadge status="warning">Menunggu Manager</DnaBadge>;
 case "APPROVED_BY_MGR":
 return <DnaBadge status="info">Disetujui Manager</DnaBadge>;
 case "PAID":
 return <DnaBadge status="success">Sudah Cair</DnaBadge>;
 default:
 return <DnaBadge status="default">{getOperationalStatusLabel(status)}</DnaBadge>;
 }
 };

 return (
 <OperationalMigrationShell
 title="Persetujuan Dana"
 subtitle="Pengawasan manajerial dan pelepasan fiskal"
 >
 <div className="space-y-6 animate-fade-slide-in">
 <TableWrapper
 filters={
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className="status-dot bg-blue-500 animate-pulse" />
 <div>
 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
 Daftar Pengajuan Dana
 </h3>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
 Memerlukan verifikasi dan validasi keuangan • {filteredRequests.length} item
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3 w-full md:w-auto">
 <div className="relative w-full md:w-64">
 <DnaInput
 icon={<Search className="w-4 h-4" />}
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Cari pengajuan..."
 className="bg-slate-50 border-none rounded-xl text-xs"
 />
 </div>
 </div>
 </div>
 }
 >
 <Table className="table-dense">
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">ID / Tanggal</TableHead>
 <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">Departemen</TableHead>
 <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">Deskripsi / Keperluan</TableHead>
 <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">Diajukan Oleh</TableHead>
 <TableHead className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">Nominal</TableHead>
 <TableHead className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</TableHead>
 <TableHead className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">Aksi</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredRequests.length === 0 ? (
 <TableRow>
 <TableCell colSpan={7} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
 Tidak ada pengajuan dana yang ditemukan
 </TableCell>
 </TableRow>
 ) : (
 filteredRequests.map((req: any) => (
 <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
 <TableCell className="py-3 pl-6">
 <p className="font-black text-slate-900 uppercase tracking-tight">#{req.id}</p>
 <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">
 {new Date(req.createdAt).toLocaleDateString("id-ID")}
 </p>
 </TableCell>
 <TableCell className="py-3">
 <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-700 bg-slate-100 rounded px-2 py-0.5 uppercase">
 <Building2 className="w-3 h-3 text-slate-400" /> {req.departmentId}
 </span>
 </TableCell>
 <TableCell className="py-3">
 <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{req.reason}</p>
 </TableCell>
 <TableCell className="py-3">
 <p className="text-[10px] font-medium text-slate-600 italic">{req.requester?.fullName || "—"}</p>
 </TableCell>
 <TableCell className="py-3 text-right font-mono tabular-nums text-xs font-black">
 {formatCurrency(req.amount)}
 </TableCell>
 <TableCell className="py-3 text-center">
 {getDnaStatus(req.status)}
 </TableCell>
 <TableCell className="py-3 pr-6 text-center">
 <div className="flex justify-center gap-2">
 {req.status === "PENDING_APPROVAL_MGR" && (
 <DnaButton
 variant="primary"
 size="sm"
 icon={<CheckCircle2 className="w-3.5 h-3.5" />}
 onClick={() => approveMutation.mutate(req.id)}
 disabled={approveMutation.isPending}
 >
 Setujui
 </DnaButton>
 )}
 {req.status === "APPROVED_BY_MGR" && (
 <DnaButton
 variant="secondary"
 size="sm"
 icon={<ArrowRightCircle className="w-3.5 h-3.5" />}
 onClick={() => disburseMutation.mutate(req.id)}
 disabled={disburseMutation.isPending}
 className="bg-emerald-600 hover:bg-emerald-700 text-white"
 >
 Cairkan
 </DnaButton>
 )}
 {req.status === "PAID" && (
 <DnaBadge status="success">
 Selesai
 </DnaBadge>
 )}
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </TableWrapper>
 </div>
 </OperationalMigrationShell>
 );
}
