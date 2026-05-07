"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
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
      case "PENDING_APPROVAL_MGR": return <Badge className="bg-orange-100 text-orange-600 border-orange-200 uppercase text-[10px] font-black">Waiting Manager</Badge>;
      case "APPROVED_BY_MGR": return <Badge className="bg-blue-100 text-blue-600 border-blue-200 uppercase text-[10px] font-black">Approved - Queueing Finance</Badge>;
      case "PAID": return <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200 uppercase text-[10px] font-black italic">Disbursed / Paid</Badge>;
      case "REJECTED": return <Badge className="bg-red-100 text-red-600 border-red-200 uppercase text-[10px] font-black">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-1 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
            MY <span className="text-slate-400">REQUESTS</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <Badge className="bg-brand-blue text-white font-bold tracking-tight text-[10px] uppercase px-4 py-1.5 rounded-full border-none">OPEX Protocol v1.0</Badge>
             <p className="text-slate-400 font-bold uppercase tracking-tight text-[10px]">Internal Fund Requisition & Tracking</p>
          </div>
        </motion.div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="h-14 bg-brand-blue text-white font-black px-8 rounded-2xl uppercase tracking-tight text-[10px] shadow-xl shadow-brand-blue/20 hover:scale-105 transition-all">
                    <Plus className="mr-3 h-5 w-5" /> New Fund Request
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden font-inter">
                <div className="bg-brand-blue p-10 text-white relative">
                    <DialogTitle className="text-4xl font-black uppercase tracking-tighter leading-none italic">Requisition Form</DialogTitle>
                    <DialogDescription className="text-white/60 font-medium uppercase text-[10px] tracking-tight mt-3">Internal Fund Disbursement Request</DialogDescription>
                    <Wallet className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/10" />
                </div>
                <div className="p-10 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Divisi Pengaju</Label>
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
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Nominal Dana (IDR)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                type="number" 
                                placeholder="0" 
                                className="h-14 bg-slate-50 border-none font-black text-lg rounded-2xl pl-12" 
                                value={formData.amount || ""}
                                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Keperluan / Justifikasi</Label>
                        <Input 
                            placeholder="Misal: Biaya Langganan Software R&D" 
                            className="h-14 bg-slate-50 border-none font-bold rounded-2xl" 
                            value={formData.reason}
                            onChange={(e) => setFormData({...formData, reason: e.target.value})}
                        />
                    </div>
                    <Button 
                        onClick={() => createMutation.mutate(formData)}
                        disabled={createMutation.isPending}
                        className="w-full h-16 bg-brand-blue text-white font-black uppercase tracking-tight rounded-3xl shadow-2xl mt-4 hover:scale-[1.02] transition-all"
                    >
                        {createMutation.isPending ? "Submitting..." : "Submit Requisition"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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
                    <Card className="border-none bg-white shadow-xl shadow-slate-100 rounded-[2.5rem] overflow-hidden hover:translate-x-2 transition-all duration-300">
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
                                <p className="text-3xl font-black tracking-tighter text-slate-900">{formatCurrency(req.amount)}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </AnimatePresence>

        {requests.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-tight text-xs">No fund requests found</p>
            </div>
        )}
      </div>
    </div>
  );
}

