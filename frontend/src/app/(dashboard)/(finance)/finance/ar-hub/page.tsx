"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  FileImage, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ZoomIn,
  RefreshCcw,
  ArrowRight,
  TrendingUp,
  History,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface PendingPayment {
  id: string;
  type: 'SAMPLE' | 'DOWN_PAYMENT' | 'DP_ORDER' | 'PELUNASAN';
  clientName: string;
  amount: number;
  proofUrl: string;
  requestedAt: string;
  projectName?: string;
}

export default function ARValidationHub() {
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form State
  const [receivingAccountId, setReceivingAccountId] = useState("1111");
  const [actualAmount, setActualAmount] = useState(0);
  const [bankAdminFee, setBankAdminFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
    api.get("/finance/accounts").then(res => setAccounts(res.data));
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/finance/ar-hub/pending");
      const combined = [
        ...data.samples.map((s: any) => ({
          id: s.id,
          type: s.activityType === 'SAMPLE_PAYMENT' ? 'SAMPLE' : 'DOWN_PAYMENT',
          clientName: s.lead?.clientName || "Unknown Client",
          amount: Number(s.amount || 0),
          proofUrl: s.fileUrl,
          requestedAt: s.createdAt,
          projectName: s.activityType === 'SAMPLE_PAYMENT' ? `Sample: ${s.lead?.clientName}` : `DP Produksi: ${s.lead?.brandName || s.lead?.clientName}`
        })),
        ...data.orders.map((o: any) => ({
          id: o.id,
          type: 'DP_ORDER', // Defaulting to DP for now, can be adjusted if needed
          clientName: o.so?.lead?.clientName || o.workOrder?.lead?.clientName || "Unknown Client",
          amount: Number(o.amountDue || 0),
          proofUrl: o.attachmentUrls?.[0] || "",
          requestedAt: o.createdAt,
          projectName: `Order: ${o.so?.lead?.clientName || o.workOrder?.lead?.clientName}`
        }))
      ];
      setPending(combined);
    } catch (err) {
      toast.error("Failed to fetch pending items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      setActualAmount(selected.amount);
      setBankAdminFee(0);
      setTaxAmount(0);
      setNotes("");
    }
  }, [selected]);

  const handleVerify = async () => {
    if (!selected) return;
    try {
      await api.post("/finance/ar-hub/verify", {
        type: selected.type,
        id: selected.id,
        receivingAccountId,
        actualAmount,
        bankAdminFee,
        taxAmount,
        notes
      });
      toast.success("Payment verified and journal posted!");
      fetchData();
      setSelected(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  // Real-time Preview Logic
  const baseAmount = (actualAmount + bankAdminFee) - taxAmount;
  const targetAccountLabel = selected?.type === 'SAMPLE' ? "4102 - Pendapatan Sampel" : 
                             selected?.type === 'DOWN_PAYMENT' ? "2301 - Hutang DP Produksi (L)" :
                             selected?.type === 'DP_ORDER' ? "2301 - DP Produksi Klien" : 
                             "4101 - Pendapatan Maklon";

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden gap-4 p-1">
      {/* LEFT: PENDING LIST (Narrow) */}
      <div className="w-[350px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <header className="mb-4">
           <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase italic">
             AR <span className="text-slate-400">HUB</span>
           </h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
             Verification Protocol V5.1
           </p>
        </header>

        <div className="space-y-3">
           {pending.map((item) => (
             <motion.div 
               key={item.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               whileHover={{ scale: 1.02 }}
               onClick={() => setSelected(item)}
               className={cn(
                 "p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group",
                 selected?.id === item.id 
                   ? "bg-slate-900 border-slate-900 shadow-xl" 
                   : "bg-white border-slate-100 hover:border-brand-blue"
               )}
             >
                <div className="flex justify-between items-start relative z-10">
                   <div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tight px-3 py-1 rounded-full mb-2 inline-block",
                        item.type === 'SAMPLE' ? "bg-amber-100 text-amber-600" : 
                        item.type === 'DOWN_PAYMENT' ? "bg-brand-blue/10 text-brand-blue" :
                        "bg-emerald-100 text-emerald-600"
                      )}>
                        {item.type.replace('_', ' ')}
                      </span>
                      <h3 className={cn("text-sm font-black tracking-tight", selected?.id === item.id ? "text-white" : "text-slate-900")}>
                        {item.clientName}
                      </h3>
                      <p className={cn("text-[9px] font-bold mt-1", selected?.id === item.id ? "text-slate-400" : "text-slate-400")}>
                        {item.projectName}
                      </p>
                   </div>
                   <div className="text-right">
                      <p className={cn("text-sm font-black tracking-tighter", selected?.id === item.id ? "text-emerald-400" : "text-emerald-600")}>
                        Rp {item.amount.toLocaleString()}
                      </p>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* CENTER & RIGHT: SWAPPED LAYOUT */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div 
              key={selected.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex gap-4"
            >
              {/* LEFT (60%): PROOF VIEWER (EYE-FLOW START) */}
              <Card className="flex-[3] rounded-[3rem] border-none shadow-2xl shadow-slate-200 overflow-hidden relative flex flex-col bg-slate-900">
                 <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <FileImage size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-white/40 tracking-tight leading-none mb-1">Incoming Evidence</p>
                          <p className="text-xs font-bold text-white uppercase italic">Reference: {selected.id.slice(0,10)}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/10">
                          <ZoomIn size={16} />
                       </Button>
                    </div>
                 </div>
                 <div className="flex-1 p-8 flex items-center justify-center overflow-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <motion.img 
                      src={selected.proofUrl} 
                      className="max-h-[90%] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    />
                 </div>
              </Card>

              {/* RIGHT (40%): DATA ENTRY FORM */}
              <Card className="flex-[2] rounded-[3rem] border-none shadow-2xl shadow-slate-200 p-10 flex flex-col bg-white overflow-y-auto custom-scrollbar">
                 <div className="flex-1 space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-12 h-12 rounded-[1.2rem] bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                          <ShieldCheck size={24} />
                       </div>
                       <div>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Audit & Journal</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic">Manual Verification Input</p>
                       </div>
                    </div>

                    <div className="grid gap-5">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Receiving Bank</Label>
                          <Select value={receivingAccountId} onValueChange={(val) => setReceivingAccountId(val || "")}>
                             <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {accounts.filter(a => a.code.startsWith('11')).map(acc => (
                                  <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Actual Net Amount</Label>
                             <Input 
                               type="number"
                               value={actualAmount}
                               onChange={(e) => setActualAmount(Number(e.target.value))}
                               className="h-14 rounded-2xl bg-emerald-50/30 border-none font-black text-emerald-600 text-lg"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Admin Fee (Debit)</Label>
                             <Input 
                               type="number"
                               value={bankAdminFee}
                               onChange={(e) => setBankAdminFee(Number(e.target.value))}
                               className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">PPN Amount (Credit)</Label>
                          <Input 
                            type="number"
                            value={taxAmount}
                            onChange={(e) => setTaxAmount(Number(e.target.value))}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                          />
                       </div>

                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-tight text-slate-400 ml-1">Internal Notes</Label>
                          <Input 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional audit notes..."
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                          />
                       </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white/90">
                       <h4 className="text-[10px] font-black uppercase text-white/40 mb-4 tracking-tight italic">Dynamic Journal Split</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="text-white/60">Bank Account (Debit)</span>
                             <span className="text-emerald-400">Rp {actualAmount.toLocaleString()}</span>
                          </div>
                          {bankAdminFee > 0 && (
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-white/60">Beban Admin 8100 (Debit)</span>
                               <span className="text-emerald-400">Rp {bankAdminFee.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-3">
                             <span className="text-white/60">{targetAccountLabel} (Credit)</span>
                             <span className="text-rose-400">Rp {baseAmount.toLocaleString()}</span>
                          </div>
                          {taxAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-white/60">PPN 2201 (Credit)</span>
                               <span className="text-rose-400">Rp {taxAmount.toLocaleString()}</span>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="pt-8 flex gap-4">
                    <Button 
                      onClick={handleVerify}
                      className="h-20 w-full rounded-[1.5rem] bg-brand-blue hover:bg-slate-900 text-white font-black uppercase tracking-tight text-xs shadow-2xl shadow-brand-blue/20 transition-all group"
                    >
                       Confirm Verification <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </Button>
                 </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center bg-slate-50 rounded-[3.5rem] border-4 border-dashed border-slate-200"
            >
               <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-6 text-slate-100">
                     <FileText size={48} />
                  </div>
                  <p className="text-sm font-black text-slate-300 uppercase tracking-tight">Select an item to begin verification</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

