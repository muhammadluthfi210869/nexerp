"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Plus, CheckCircle2, Eye, Search, FileText, Lock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TableWrapper, StatCard, DnaBadge, DnaButton, DnaInput } from "@/components/dna";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const STATUS_MAP: Record<string, { label: string; status: "success" | "info" | "warning" | "critical" | "purple" | "default" }> = {
  PENDING_APPROVAL_MGR: { label: "Menunggu Manager", status: "warning" },
  APPROVED_BY_MGR: { label: "Disetujui Manager", status: "info" },
  PENDING_APPROVAL_DIR: { label: "Menunggu Direktur", status: "warning" },
  APPROVED_BY_DIR: { label: "Disetujui Direktur", status: "purple" },
  WAITING_FINANCE_DISBURSEMENT: { label: "Menunggu Cair", status: "purple" },
  PAID: { label: "Dibayar", status: "success" },
  REJECTED: { label: "Ditolak", status: "critical" },
};

export default function FundRequestsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDetail, setViewDetail] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({ departmentId: "", amount: 0, reason: "", attachmentUrls: [] as string[] });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["fund-requests", "me"],
    queryFn: async () => (await api.get("/finance/fund-requests/me")).data,
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
    mutationFn: async (id: string) => api.patch(`/finance/fund-request/${id}/approve`, { approvedById: user?.id }),
    onSuccess: () => { 
      toast.success("Approved"); 
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] }); 
      setViewDetail(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => api.patch(`/finance/fund-request/${id}/reject`, { reason }),
    onSuccess: () => { 
      toast.success("Rejected"); 
      queryClient.invalidateQueries({ queryKey: ["fund-requests"] }); 
      setViewDetail(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message),
  });

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredRequests = myRequests.filter((req: any) => {
    const term = searchTerm.toLowerCase();
    return (
      req.reason?.toLowerCase().includes(term) ||
      req.departmentId?.toLowerCase().includes(term) ||
      req.status?.toLowerCase().includes(term)
    );
  });

  const getDnaBadge = (status: string) => {
    const info = STATUS_MAP[status] || { label: status, status: "default" };
    return <DnaBadge status={info.status}>{info.label}</DnaBadge>;
  };

  return (
    <DashboardShell
      title="FUND"
      titleAccent="REQUESTS"
      subtitle="Pengajuan & Approval Dana Operasional"
      actions={
        <DnaButton 
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="stroke-[3px]" />}
          className="bg-rose-600 hover:bg-rose-700"
        >
          NEW REQUEST
        </DnaButton>
      }
    >
      <div className="space-y-6 animate-fade-slide-in">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="MY REQUESTS"
            value={myRequests.length}
            icon={<FileText className="text-slate-500" />}
          />
          <StatCard
            label="PENDING APPROVAL"
            value={myRequests.filter((r: any) => r.status === "PENDING_APPROVAL_MGR" || r.status === "PENDING_APPROVAL_DIR").length}
            icon={<Lock className="text-amber-500" />}
          />
          <StatCard
            label="DISBURSED"
            value={myRequests.filter((r: any) => r.status === "PAID").length}
            icon={<CheckCircle2 className="text-emerald-500" />}
          />
        </div>

        {/* Central Data Table */}
        <TableWrapper
          filters={
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="status-dot bg-rose-500 animate-pulse" />
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    DAFTAR PENGAJUAN OPERASIONAL
                  </h3>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                    Monitoring Usulan Dana & Keputusan Manajerial • {filteredRequests.length} Records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <DnaInput
                    icon={<Search className="w-4 h-4" />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="CARI PENGAJUAN DANA..."
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
                <TableHead className="py-4 pl-6 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TANGGAL</TableHead>
                <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DEPARTEMEN</TableHead>
                <TableHead className="text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">ALASAN / KEPERLUAN</TableHead>
                <TableHead className="text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">NOMINAL NOMINASI</TableHead>
                <TableHead className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</TableHead>
                <TableHead className="pr-6 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">AKSI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Tidak ada pengajuan dana operasional ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req: any) => (
                  <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-all cursor-default border-slate-50">
                    <TableCell className="py-3 pl-6">
                      <p className="text-[11px] font-medium text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </TableCell>
                    <TableCell className="py-3">
                      <DnaBadge className="text-slate-700">
                        {req.departmentId}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-[11px] font-medium text-slate-700 max-w-[250px] truncate uppercase">{req.reason}</p>
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono tabular-nums text-xs font-black">
                      {formatCurrency(req.amount)}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {getDnaBadge(req.status)}
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-center">
                      <div className="flex justify-center gap-2">
                        <DnaButton
                          variant="primary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setViewDetail(req)}
                        >
                          DETAIL
                        </DnaButton>
                        {(req.status === "PENDING_APPROVAL_MGR" || req.status === "PENDING_APPROVAL_DIR") && hasRole("SUPER_ADMIN", "FINANCE", "DIRECTOR") && (
                          <>
                            <DnaButton
                              variant="secondary"
                              size="sm"
                              onClick={() => approveMutation.mutate(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={approveMutation.isPending}
                            >
                              APPROVE
                            </DnaButton>
                            <DnaButton
                              variant="danger"
                              size="sm"
                              onClick={() => { setRejectId(req.id); setRejectReason(""); }}
                              disabled={rejectMutation.isPending}
                            >
                              REJECT
                            </DnaButton>
                          </>
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

      {/* New Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-rose-600 p-6 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">
              NEW FUND REQUEST
            </DialogTitle>
            <DialogDescription className="text-rose-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">
              Formulir Pengajuan Pengeluaran Dana Operasional
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Department</label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase focus:ring-4 focus:ring-blue-500/5 transition-all">
                  <SelectValue placeholder="Pilih departemen..." />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {["MARKETING", "RND", "PRODUCTION", "SCM", "LEGAL", "CREATIVE", "HR", "FINANCE", "GENERAL"].map((d) => (
                    <SelectItem key={d} value={d} className="font-medium text-xs uppercase cursor-pointer hover:bg-slate-50">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Amount (IDR)</label>
              <DnaInput
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="0"
                className="bg-slate-50 border-none rounded-xl text-lg font-black text-rose-600 h-12 focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Jelaskan secara mendetail tujuan pengajuan dana operasional..."
              />
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </DnaButton>
            <DnaButton
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "SUBMITTING..." : "SUBMIT REQUEST"}
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-rose-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter leading-none italic text-white">
              REJECT REQUEST
            </DialogTitle>
            <DialogDescription className="text-rose-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">
              Tentukan Alasan Penolakan Fiskal
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-xs resize-none focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
              placeholder="Alasan penolakan pengajuan dana..."
            />
          </div>
          <DialogFooter className="p-6 pt-0 flex gap-2 justify-end">
            <DnaButton variant="outline" onClick={() => setRejectId(null)}>
              CANCEL
            </DnaButton>
            <DnaButton
              variant="danger"
              onClick={() => {
                if (rejectId) rejectMutation.mutate({ id: rejectId, reason: rejectReason });
                setRejectId(null);
              }}
            >
              CONFIRM REJECT
            </DnaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!viewDetail} onOpenChange={() => setViewDetail(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden">
          <div className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter leading-none italic text-white">
              REQUEST DETAIL
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium uppercase text-[9px] tracking-widest mt-2 leading-none">
              Informasi Pengajuan Dana Terkini
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4 text-xs">
            {viewDetail && (
              <>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Department</span>
                  <DnaBadge className="font-black text-slate-900">{viewDetail.departmentId}</DnaBadge>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Amount</span>
                  <span className="font-black text-slate-900 text-sm tabular-nums">{formatCurrency(viewDetail.amount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Status</span>
                  {getDnaBadge(viewDetail.status)}
                </div>
                <div className="pt-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Reason</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed uppercase">{viewDetail.reason}</p>
                </div>
                {viewDetail.rejectReason && (
                  <div className="pt-2 border-t border-rose-100 mt-2">
                    <p className="text-[8px] font-black text-rose-500 uppercase mb-1">Rejection Reason</p>
                    <p className="font-medium text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-100 leading-relaxed uppercase">{viewDetail.rejectReason}</p>
                  </div>
                )}
                
                {/* Embedded Actions inside Detail Modal for Manager/Director */}
                {(viewDetail.status === "PENDING_APPROVAL_MGR" || viewDetail.status === "PENDING_APPROVAL_DIR") && hasRole("SUPER_ADMIN", "FINANCE", "DIRECTOR") && (
                  <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                    <DnaButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setRejectId(viewDetail.id); setRejectReason(""); }}
                    >
                      REJECT
                    </DnaButton>
                    <DnaButton
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => approveMutation.mutate(viewDetail.id)}
                      disabled={approveMutation.isPending}
                    >
                      APPROVE
                    </DnaButton>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
