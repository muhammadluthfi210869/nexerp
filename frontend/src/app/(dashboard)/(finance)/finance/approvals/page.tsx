"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Building2, 
  ArrowRightCircle,
  Banknote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function FinanceApprovalsPage() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["finance-fund-approvals"],
    queryFn: async () => {
      const resp = await api.get("/finance/fund-requests");
      return resp.data;
    },
    initialData: [
        { id: "1", amount: 2500000, reason: "Top Up Facebook Ads", departmentId: "MARKETING", status: "PENDING_APPROVAL_MGR", createdAt: new Date().toISOString(), user: { fullName: "Marketing Lead" } },
        { id: "2", amount: 500000, reason: "Beli Token Listrik Pabrik", departmentId: "GUDANG", status: "APPROVED_BY_MGR", createdAt: new Date().toISOString(), user: { fullName: "Staf GA" } }
    ]
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL_MGR": return <Badge className="bg-orange-100 text-orange-600 border-none uppercase text-[9px] font-black">Menunggu Manager</Badge>;
      case "APPROVED_BY_MGR": return <Badge className="bg-blue-100 text-blue-600 border-none uppercase text-[9px] font-black">Disetujui Manager</Badge>;
      case "PAID": return <Badge className="bg-emerald-100 text-emerald-600 border-none uppercase text-[9px] font-black">Sudah Cair</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <header className="border-b border-slate-100 pb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            PERSETUJUAN <span className="text-slate-400">DANA</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-emerald-600 text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">Pusat Pencairan Internal</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Pengawasan Manajerial & Pelepasan Fiskal</p>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
            {requests.map((req: any, idx: number) => (
                <motion.div 
                    key={req.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                >
                    <Card className="border-none bg-white shadow-xl shadow-slate-100 rounded-[2.5rem] overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-center p-8 gap-8">
                            <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                <Banknote className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{req.reason}</h3>
                                    {getStatusBadge(req.status)}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-tight mt-2">
                                    <span className="flex items-center gap-1.5 text-slate-900"><Building2 className="w-3 h-3" /> {req.departmentId}</span>
                                    <span className="text-slate-200">|</span>
                                    <span className="flex items-center gap-1.5 italic text-slate-500">Diajukan oleh: {req.user?.fullName}</span>
                                    <span className="text-slate-200">|</span>
                                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString("id-ID")}</span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-3 min-w-[200px]">
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight mb-1">Total Nominal</p>
                                    <p className="text-3xl font-black tracking-tighter text-slate-900">{formatCurrency(req.amount)}</p>
                                </div>
                                <div className="flex gap-2">
                                    {req.status === "PENDING_APPROVAL_MGR" && (
                                        <Button 
                                            onClick={() => approveMutation.mutate(req.id)}
                                            className="bg-brand-blue text-white font-black uppercase text-[10px] tracking-tight rounded-xl h-10 px-6 gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Setujui
                                        </Button>
                                    )}
                                    {req.status === "APPROVED_BY_MGR" && (
                                        <Button 
                                            onClick={() => disburseMutation.mutate(req.id)}
                                            className="bg-emerald-600 text-white font-black uppercase text-[10px] tracking-tight rounded-xl h-10 px-6 gap-2 shadow-lg shadow-emerald-600/20"
                                        >
                                            <ArrowRightCircle className="w-4 h-4" /> Cairkan Dana
                                        </Button>
                                    )}
                                    {req.status === "PAID" && (
                                        <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] italic">
                                            <CheckCircle2 className="w-4 h-4" /> Transaksi Selesai
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

