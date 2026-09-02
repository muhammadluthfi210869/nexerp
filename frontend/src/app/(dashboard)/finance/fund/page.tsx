"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  FileText,
  CheckCircle2,
  Lock,
  Eye,
  Building2,
  Plus,
  ArrowRightCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { DnaInput, DnaButton, DnaBadge, StatCard, TableWrapper } from "@/components/dna";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

const STATUS_MAP: Record<string, { label: string; status: "success" | "info" | "warning" | "critical" | "purple" | "default" }> = {
  PENDING_APPROVAL_MGR: { label: "Menunggu Manager", status: "warning" },
  APPROVED_BY_MGR: { label: "Disetujui Manager", status: "info" },
  PENDING_APPROVAL_DIR: { label: "Menunggu Direktur", status: "warning" },
  APPROVED_BY_DIR: { label: "Disetujui Direktur", status: "purple" },
  WAITING_FINANCE_DISBURSEMENT: { label: "Menunggu Cair", status: "purple" },
  PAID: { label: "Dibayar", status: "success" },
  REJECTED: { label: "Ditolak", status: "critical" },
};

export default function FundConsolidatedPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchRequests, setSearchRequests] = useState("");
  const [searchApprovals, setSearchApprovals] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [form, setForm] = useState({ departmentId: "", amount: 0, reason: "", attachmentUrls: [] as string[] });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["fund-requests", "me"],
    queryFn: async () => (await api.get("/finance/fund-requests/me")).data,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["finance-fund-approvals"],
    queryFn: async () => (await api.get("/finance/fund-requests")).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/finance/fund-request", form),
    onSuccess: () => {
      toast.success("Fund request created.");
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
      setIsModalOpen(false);
      setForm({ departmentId: "", amount: 0, reason: "", attachmentUrls: [] });
    },
    onError: (err: any) => toast.error("Failed", { description: err.response?.data?.message }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/finance/fund-request/${id}/approve`, { approvedById: user?.id }),
    onSuccess: () => {
      toast.success("Approved");
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/finance/fund-request/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Rejected");
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] });
      queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
      setRejectId(null);
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/finance/fund-request/${id}/disburse`, {}),
    onSuccess: () => {
      toast.success("Dana dicairkan & Jurnal diposting.");
      queryClient.invalidateQueries({ queryKey: ["finance-fund-approvals"] });
    },
  });

  const filteredRequests = myRequests.filter((req: any) => {
    const term = searchRequests.toLowerCase();
    return req.reason?.toLowerCase().includes(term) || req.departmentId?.toLowerCase().includes(term) || req.status?.toLowerCase().includes(term);
  });

  const filteredApprovals = allRequests.filter((req: any) => {
    const term = searchApprovals.toLowerCase();
    return req.reason?.toLowerCase().includes(term) || req.departmentId?.toLowerCase().includes(term) || req.status?.toLowerCase().includes(term) || req.user?.fullName?.toLowerCase().includes(term);
  });

  const getBadge = (status: string) => {
    const info = STATUS_MAP[status] || { label: status, status: "default" as const };
    return <DnaBadge status={info.status}>{info.label}</DnaBadge>;
  };

  const pendingCount = myRequests.filter((r: any) => r.status === "PENDING_APPROVAL_MGR" || r.status === "PENDING_APPROVAL_DIR").length;
  const paidCount = myRequests.filter((r: any) => r.status === "PAID").length;
  const pendingApprovalCount = allRequests.filter((r: any) => r.status === "PENDING_APPROVAL_MGR" || r.status === "PENDING_APPROVAL_DIR").length;
  const readyDisburseCount = allRequests.filter((r: any) => r.status === "APPROVED_BY_MGR" || r.status === "APPROVED_BY_DIR" || r.status === "WAITING_FINANCE_DISBURSEMENT").length;

  return (
    <DashboardShell
      title="FUND"
      titleAccent="MANAGEMENT"
      subtitle="Pengajuan Dana Operasional & Approval Workflow"
    >
      <Tabs defaultValue="requests" className="space-y-6">
        <div className="relative">
          <TabsList className="bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl h-14 inline-flex gap-1 border border-slate-200/50 shadow-inner">
            {[
              { id: "requests", label: "Fund Requests", icon: FileText },
              { id: "approvals", label: "Approvals", icon: Lock },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative rounded-xl px-6 h-full data-[state=active]:text-slate-900 data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500 transition-all duration-300 text-[10px] font-black uppercase tracking-tight"
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="requests" className="space-y-6 animate-fade-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="My Requests" value={myRequests.length} icon={<FileText className="text-slate-500" />} />
            <StatCard label="Pending Approval" value={pendingCount} icon={<Lock className="text-amber-500" />} />
            <StatCard label="Disbursed" value={paidCount} icon={<CheckCircle2 className="text-emerald-500" />} />
          </div>
          <TableWrapper
            filters={
              <div className="flex items-center justify-between w-full">
                <div className="relative w-full max-w-md">
                  <DnaInput icon={<Search className="w-4 h-4" />} value={searchRequests} onChange={(e) => setSearchRequests(e.target.value)} placeholder="CARI PENGAJUAN DANA..." className="bg-slate-50 border-none rounded-xl text-xs" />
                </div>
                <DnaButton variant="primary" onClick={() => setIsModalOpen(true)} icon={<Plus className="stroke-[3px]" />} className="bg-rose-600 hover:bg-rose-700">
                  NEW REQUEST
                </DnaButton>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TANGGAL</TableHead>
                  <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DEPARTEMEN</TableHead>
                  <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">ALASAN / KEPERLUAN</TableHead>
                  <TableHead className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">NOMINAL</TableHead>
                  <TableHead className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
                  <TableHead className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Tidak ada pengajuan dana ditemukan</TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req: any) => (
                    <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                      <TableCell className="py-3 pl-6">
                        <p className="text-[11px] font-medium text-slate-400">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-slate-700 bg-slate-100 rounded px-2 py-0.5 uppercase">{req.departmentId}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-[11px] font-medium text-slate-700 max-w-[250px] truncate uppercase">{req.reason}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono tabular-nums text-xs font-black">{formatCurrency(req.amount)}</TableCell>
                      <TableCell className="py-3 text-center">{getBadge(req.status)}</TableCell>
                      <TableCell className="py-3 pr-6 text-center">
                        <div className="flex justify-center gap-2">
                          <DnaButton variant="primary" size="sm" className="bg-rose-600 hover:bg-rose-700" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => window.location.href = "/finance/fund-requests"}>DETAIL</DnaButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6 animate-fade-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Total Pengajuan" value={allRequests.length} icon={<FileText className="text-blue-600" />} />
            <StatCard label="Menunggu Approval" value={pendingApprovalCount} icon={<AlertTriangle className="text-amber-500" />} />
            <StatCard label="Siap Cair" value={readyDisburseCount} icon={<ArrowRightCircle className="text-emerald-500" />} />
          </div>
          <TableWrapper
            filters={
              <div className="flex items-center justify-between w-full">
                <div className="relative w-full max-w-md">
                  <DnaInput icon={<Search className="w-4 h-4" />} value={searchApprovals} onChange={(e) => setSearchApprovals(e.target.value)} placeholder="CARI PENGAJUAN..." className="bg-slate-50 border-none rounded-xl text-xs" />
                </div>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">ID / TANGGAL</TableHead>
                  <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DEPARTEMEN</TableHead>
                  <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">KEPERLUAN</TableHead>
                  <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DIAJUKAN</TableHead>
                  <TableHead className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">NOMINAL</TableHead>
                  <TableHead className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
                  <TableHead className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Tidak ada pengajuan dana ditemukan</TableCell>
                  </TableRow>
                ) : (
                  filteredApprovals.map((req: any) => (
                    <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                      <TableCell className="py-3 pl-6">
                        <p className="font-black text-slate-900 uppercase tracking-tight text-xs">#{req.id}</p>
                        <p className="text-[8px] font-medium text-slate-300 uppercase leading-none mt-0.5">{new Date(req.createdAt).toLocaleDateString("id-ID")}</p>
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
                        <p className="text-[10px] font-medium text-slate-600 italic">{req.user?.fullName}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono tabular-nums text-xs font-black">{formatCurrency(req.amount)}</TableCell>
                      <TableCell className="py-3 text-center">{getBadge(req.status)}</TableCell>
                      <TableCell className="py-3 pr-6 text-center">
                        <div className="flex justify-center gap-2">
                          {req.status === "PENDING_APPROVAL_MGR" && (
                            <DnaButton variant="primary" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                              SETUJUI
                            </DnaButton>
                          )}
                          {req.status === "APPROVED_BY_MGR" && (
                            <DnaButton variant="secondary" size="sm" icon={<ArrowRightCircle className="w-3.5 h-3.5" />} onClick={() => disburseMutation.mutate(req.id)} disabled={disburseMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              CAIRKAN
                            </DnaButton>
                          )}
                          {(req.status === "PENDING_APPROVAL_MGR" || req.status === "PENDING_APPROVAL_DIR") && (
                            <DnaButton variant="danger" size="sm" icon={<XCircle className="w-3.5 h-3.5" />} onClick={() => { setRejectId(req.id); setRejectReason(""); }} disabled={rejectMutation.isPending}>
                              TOLAK
                            </DnaButton>
                          )}
                          {req.status === "PAID" && <DnaBadge status="success">SELESAI</DnaBadge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-rose-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">NEW FUND REQUEST</DialogTitle>
            <DialogDescription className="text-rose-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">Formulir Pengajuan Pengeluaran Dana Operasional</DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Department</label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
                  <SelectValue placeholder="Pilih departemen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {["MARKETING", "RND", "PRODUCTION", "SCM", "LEGAL", "CREATIVE", "HR", "FINANCE", "GENERAL"].map((d) => (
                    <SelectItem key={d} value={d} className="font-medium text-xs uppercase">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Amount (IDR)</label>
              <DnaInput type="number" value={form.amount || ""} onChange={(e: any) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" className="bg-slate-50 border-none rounded-xl text-lg font-black text-rose-600 h-12" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all" placeholder="Jelaskan tujuan pengajuan dana..." />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>CANCEL</DnaButton>
            <DnaButton variant="primary" className="bg-rose-600 hover:bg-rose-700" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "SUBMITTING..." : "SUBMIT REQUEST"}
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-rose-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter leading-none italic text-white">REJECT REQUEST</DialogTitle>
            <DialogDescription className="text-rose-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">Tentukan Alasan Penolakan Fiskal</DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-rose-500 focus:bg-white transition-all" placeholder="Alasan penolakan pengajuan dana..." />
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setRejectId(null)}>CANCEL</DnaButton>
            <DnaButton variant="danger" onClick={() => { if (rejectId) rejectMutation.mutate({ id: rejectId, reason: rejectReason }); setRejectId(null); }}>CONFIRM REJECT</DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
