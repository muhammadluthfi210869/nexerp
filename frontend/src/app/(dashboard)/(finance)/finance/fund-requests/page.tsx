"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Wallet, Plus, Send, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING_APPROVAL_MGR: { label: "Menunggu Manager", color: "bg-amber-100 text-amber-700" },
  APPROVED_BY_MGR: { label: "Disetujui Manager", color: "bg-blue-100 text-blue-700" },
  PENDING_APPROVAL_DIR: { label: "Menunggu Direktur", color: "bg-amber-100 text-amber-700" },
  APPROVED_BY_DIR: { label: "Disetujui Direktur", color: "bg-indigo-100 text-indigo-700" },
  WAITING_FINANCE_DISBURSEMENT: { label: "Menunggu Cair", color: "bg-purple-100 text-purple-700" },
  PAID: { label: "Dibayar", color: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Ditolak", color: "bg-rose-100 text-rose-700" },
};

export default function FundRequestsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDetail, setViewDetail] = useState<any>(null);

  const [form, setForm] = useState({ departmentId: "", amount: 0, reason: "", attachmentUrls: [] as string[] });

  const { data: myRequests } = useQuery({
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
    onSuccess: () => { toast.success("Approved"); queryClient.invalidateQueries({ queryKey: ["fund-requests"] }); },
    onError: (err: any) => toast.error(err.response?.data?.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => api.patch(`/finance/fund-request/${id}/reject`, { reason }),
    onSuccess: () => { toast.success("Rejected"); queryClient.invalidateQueries({ queryKey: ["fund-requests"] }); },
    onError: (err: any) => toast.error(err.response?.data?.message),
  });

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-rose-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">OPEX Protocol v4</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            Fund <span className="text-rose-500">Requests</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Pengajuan &amp; Approval Dana Operasional</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-12 bg-rose-500 hover:bg-rose-600 text-white font-black px-8 rounded-2xl shadow-xl border-none uppercase tracking-tighter text-sm">
          <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-6 bg-white">
          <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">My Requests</p>
          <p className="text-2xl font-black tracking-tighter text-rose-600 mt-1">{myRequests?.length || 0}</p>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-6 bg-white">
          <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">Pending Approval</p>
          <p className="text-2xl font-black tracking-tighter text-amber-600 mt-1">{myRequests?.filter((r: any) => r.status === "PENDING_APPROVAL_MGR" || r.status === "PENDING_APPROVAL_DIR").length || 0}</p>
        </Card>
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-100 p-6 bg-white">
          <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">Disbursed</p>
          <p className="text-2xl font-black tracking-tighter text-emerald-600 mt-1">{myRequests?.filter((r: any) => r.status === "PAID").length || 0}</p>
        </Card>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-100 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-7 pl-10 font-black text-slate-400 uppercase tracking-tight text-[9px]">Date</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Department</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">Reason</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-right">Amount</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">Status</TableHead>
              <TableHead className="pr-10 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myRequests?.map((req: any) => {
              const st = STATUS_MAP[req.status] || { label: req.status, color: "bg-slate-100 text-slate-700" };
              return (
                <TableRow key={req.id} className="group hover:bg-rose-50/30 transition-all border-slate-50">
                  <TableCell className="py-6 pl-10 font-bold text-slate-400 text-[10px]">{new Date(req.createdAt).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="font-black text-slate-900 uppercase italic text-sm">{req.departmentId}</TableCell>
                  <TableCell className="font-bold text-slate-600 text-xs max-w-[200px] truncate">{req.reason}</TableCell>
                  <TableCell className="text-right font-black text-slate-900">Rp {Number(req.amount).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn("rounded-lg font-black text-[8px] border-none", st.color)}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="pr-10 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setViewDetail(req)} className="rounded-xl text-[9px] font-black uppercase">Detail</Button>
                      {(req.status === "PENDING_APPROVAL_MGR" || req.status === "PENDING_APPROVAL_DIR") && hasRole("SUPER_ADMIN", "FINANCE", "DIRECTOR") && (
                        <>
                          <Button size="sm" onClick={() => approveMutation.mutate(req.id)} className="rounded-xl bg-emerald-500 text-white font-black text-[9px] uppercase h-8"><CheckCircle2 className="w-3 h-3 mr-1" /> Approve</Button>
                          <Button size="sm" onClick={() => { setRejectId(req.id); setRejectReason(""); }} className="rounded-xl bg-rose-500 text-white font-black text-[9px] uppercase h-8"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-[2.5rem] border-none shadow-2xl p-0">
          <div className="bg-rose-600 p-8 text-white">
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none italic">New Fund Request</DialogTitle>
            <DialogDescription className="text-rose-100 font-medium uppercase text-[10px] tracking-tight mt-2">Pengajuan dana operasional</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Department</label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v || "" })}>
                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold"><SelectValue placeholder="Pilih departemen..." /></SelectTrigger>
                <SelectContent>
                  {["MARKETING", "RND", "PRODUCTION", "SCM", "LEGAL", "CREATIVE", "HR", "FINANCE", "GENERAL"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Amount (IDR)</label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" className="h-14 bg-slate-50 border-none rounded-2xl font-black text-2xl text-rose-600" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full h-24 bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm resize-none" placeholder="Jelaskan tujuan pengajuan dana..." />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px]">
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl p-0">
          <div className="bg-rose-600 p-8 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Reject Request</DialogTitle>
          </div>
          <div className="p-8 space-y-4">
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full h-24 bg-slate-50 border-none rounded-2xl p-4 font-bold text-sm resize-none" placeholder="Alasan penolakan..." />
          </div>
          <DialogFooter className="p-8 pt-0">
            <Button variant="ghost" onClick={() => setRejectId(null)} className="rounded-xl font-black uppercase text-[10px]">Cancel</Button>
            <Button onClick={() => { if (rejectId) rejectMutation.mutate({ id: rejectId, reason: rejectReason }); setRejectId(null); }} className="rounded-xl bg-rose-600 text-white font-black uppercase text-[10px]">Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewDetail} onOpenChange={() => setViewDetail(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl p-0">
          <div className="bg-slate-900 p-8 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Request Detail</DialogTitle>
          </div>
          <div className="p-8 space-y-4">
            {viewDetail && (
              <>
                <div className="flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">Department</span><span className="font-black text-slate-900 uppercase">{viewDetail.departmentId}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">Amount</span><span className="font-black text-slate-900">Rp {Number(viewDetail.amount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[10px] font-black text-slate-400 uppercase">Status</span><Badge className={cn(STATUS_MAP[viewDetail.status]?.color, "rounded-lg font-black text-[8px] border-none")}>{STATUS_MAP[viewDetail.status]?.label || viewDetail.status}</Badge></div>
                <div className="pt-4 border-t border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Reason</p><p className="font-bold text-slate-700 text-sm">{viewDetail.reason}</p></div>
                {viewDetail.rejectReason && <div className="pt-4 border-t border-slate-100"><p className="text-[10px] font-black text-rose-500 uppercase mb-1">Rejection Reason</p><p className="font-bold text-rose-700 text-sm">{viewDetail.rejectReason}</p></div>}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

