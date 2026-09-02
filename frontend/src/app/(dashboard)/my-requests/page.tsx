"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardCard } from "@/components/dna/DashboardCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { DnaInput } from "@/components/dna/DnaInput";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { 
  Plus, 
  Wallet, 
  Clock, 
  AlertCircle,
  FileText,
  Building2,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormShell } from "@/components/layout/FormShell";
import { formatCurrency } from "@/lib/utils";

export default function MyFundRequestsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: "BD",
    amount: 0,
    reason: "",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-fund-requests"],
    queryFn: async () => {
      const resp = await api.get("/finance/fund-requests/me");
      return resp.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/finance/fund-request", data),
    onSuccess: () => {
      toast.success("Fund request submitted successfully.");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-fund-requests"] });
    },
    onError: () => toast.error("Submission failed.")
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL_MGR": return <DnaBadge status="warning">Waiting Manager</DnaBadge>;
      case "APPROVED_BY_MGR": return <DnaBadge status="info">Approved - Queueing Finance</DnaBadge>;
      case "PAID": return <DnaBadge status="success">Disbursed / Paid</DnaBadge>;
      case "REJECTED": return <DnaBadge status="critical">Rejected</DnaBadge>;
      default: return <DnaBadge>{status}</DnaBadge>;
    }
  };

  return (
    <FormShell
      title="MY"
      titleAccent="REQUESTS"
      subtitle="Internal Fund Requisition & Tracking"
      actions={
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <DnaButton variant="primary" icon={<Plus />}>
              New Fund Request
            </DnaButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white rounded-[24px] border-none shadow-2xl p-0 overflow-hidden font-inter">
            <div className="bg-brand-blue p-10 text-white relative">
              <DialogTitle className="text-4xl font-black uppercase tracking-tighter leading-none italic">Requisition Form</DialogTitle>
              <DialogDescription className="text-white/60 font-medium uppercase text-[10px] tracking-tight mt-3">Internal Fund Disbursement Request</DialogDescription>
              <Wallet className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/10" />
            </div>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Divisi Pengaju</label>
                <Select value={formData.departmentId} onValueChange={(val) => val && setFormData({...formData, departmentId: val})}>
                  <SelectTrigger className="h-14 bg-slate-50 border-none font-bold rounded-2xl">
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BD">Business Development</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                    <SelectItem value="SCM">Supply Chain</SelectItem>
                    <SelectItem value="HR">Human Resources</SelectItem>
                    <SelectItem value="PRODUCTION">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Nominal Dana (IDR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <DnaInput 
                    type="number" 
                    placeholder="0" 
                    className="pl-12"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Keperluan / Justifikasi</label>
                <DnaInput 
                  placeholder="Misal: Biaya Langganan Software R&D" 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>
              <DnaButton 
                variant="primary"
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Submitting..." : "Submit Requisition"}
              </DnaButton>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
            {requests.map((req: any, idx: number) => (
                <motion.div 
                    key={req.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                >
                    <DashboardCard className="!p-0 overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center p-8 gap-8">
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <FileText className="w-7 h-7 text-brand-blue" />
                            </div>
                            <div className="flex-1 space-y-1 text-center md:text-left">
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{req.reason}</h3>
                                    {getStatusBadge(req.status)}
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-tight mt-2">
                                    <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> {req.departmentId}</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}</span>
                                    <span className="text-slate-200">|</span>
                                    <span className="text-brand-blue">REQ-ID: {req.id.slice(0, 8)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight mb-1">Requested Amount</p>
                                <p className="text-3xl font-black tracking-tighter text-slate-900 tabular-nums">{formatCurrency(req.amount)}</p>
                            </div>
                        </div>
                    </DashboardCard>
                </motion.div>
            ))}
        </AnimatePresence>

        {requests.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-tight text-xs">No fund requests found</p>
            </div>
        )}
      </div>
    </FormShell>
  );
}

