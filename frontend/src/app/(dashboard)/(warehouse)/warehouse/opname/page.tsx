"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ClipboardCheck, 
  Search, 
  History as HistoryIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Package,
  Barcode,
  ArrowRightLeft,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Zap,
  Box,
  Warehouse,
  Lock,
  ShieldCheck,
  Trash2,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StockOpnamePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedOpnameId, setSelectedOpnameId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [opnameItems, setOpnameItems] = useState<any[]>([]);
  const [opnameNotes, setOpnameNotes] = useState("");

  const { data: opnameSessions, isLoading } = useQuery({
    queryKey: ["opname-sessions"],
    queryFn: () => api.get("/warehouse/opname").then(r => r.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => api.get("/master/warehouses").then(r => r.data),
  });

  const { data: materials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: () => api.get("/master/materials").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post("/warehouse/opname", data),
    onSuccess: () => {
      toast.success("Stock Opname session created.");
      queryClient.invalidateQueries({ queryKey: ["opname-sessions"] });
      setIsModalOpen(false);
      setOpnameItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to create opname")
  });

  const pinApproveMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => 
      api.post(`/warehouse/opname/${id}/approve-pin`, { userId: "system", pin }),
    onSuccess: () => {
      toast.success("Opname approved with Manager PIN. Inventory adjusted.");
      queryClient.invalidateQueries({ queryKey: ["opname-sessions"] });
      setIsPinModalOpen(false);
      setPin("");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "PIN Verification Failed")
  });

  const addMaterial = (materialId: string) => {
    const mat = materials?.find((m: any) => m.id === materialId);
    if (!mat || opnameItems.find(i => i.materialId === materialId)) return;
    setOpnameItems([...opnameItems, { materialId: mat.id, name: mat.name, systemQty: Number(mat.stockQty), actualQty: Number(mat.stockQty) }]);
  };

  const handleCreate = () => {
    if (!selectedWarehouse) return toast.error("Select a warehouse.");
    if (opnameItems.length === 0) return toast.error("Add at least one material.");
    createMutation.mutate({
      warehouseId: selectedWarehouse,
      picId: "system",
      notes: opnameNotes,
      items: opnameItems.map(i => ({ materialId: i.materialId, systemQty: i.systemQty, actualQty: i.actualQty }))
    });
  };

  const draftCount = opnameSessions?.filter((s: any) => s.status === 'DRAFT')?.length || 0;
  const completedCount = opnameSessions?.filter((s: any) => s.status === 'COMPLETED')?.length || 0;

  return (
    <div className="space-y-8">
      {/* 🚀 I. INVENTORY INTEGRITY HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">INVENTORY INTEGRITY AUDIT ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">STOCK <span className="text-slate-300">OPNAME</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">PHYSICAL STOCK RECONCILIATION & VARIANCE ANALYSIS TERMINAL</p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none italic">
                   <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> NEW AUDIT SESSION
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1000px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">PHYSICAL <span className="text-slate-500">STOCK COUNT</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">INVENTORY AUDIT PROTOCOL V4.0</p>
                    <ClipboardCheck className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AUDIT DATE</label>
                          <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">LEAD AUDITOR (PIC)</label>
                          <Select defaultValue="system">
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="SELECT PIC..." />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="system" className="font-black uppercase text-[10px]">ZAKI (SYSTEM ADMIN)</SelectItem>
                                <SelectItem value="wh_sup" className="font-black uppercase text-[10px]">ANDI (WH SUPERVISOR)</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TARGET WAREHOUSE</label>
                           <Select onValueChange={(v) => setSelectedWarehouse(v as string ?? '')}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="SELECT WAREHOUSE..." />
                             </SelectTrigger>
                             <SelectContent>
                                {warehouses?.map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">AUDIT NOTES</label>
                          <Input value={opnameNotes} onChange={(e) => setOpnameNotes(e.target.value)} placeholder="ROUTINE CYCLE COUNT..." className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black uppercase text-brand-black tracking-widest">APPEND MATERIAL TO AUDIT</label>
                        <Select onValueChange={(v) => addMaterial(v as string ?? '')}>
                          <SelectTrigger className="h-14 border-2 border-dashed border-slate-200 bg-white rounded-2xl font-black uppercase text-[10px] text-slate-400">
                             <SelectValue placeholder="+ APPEND MATERIAL TO AUDIT" />
                          </SelectTrigger>
                          <SelectContent>
                             {materials?.map((m: any) => <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">{m.name} (SYSTEM: {Number(m.stockQty)})</SelectItem>)}
                          </SelectContent>
                       </Select>

                       {opnameItems.length > 0 && (
                          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="bg-slate-100/50 border-b border-slate-200">
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400">MATERIAL</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">SYSTEM QTY</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">ACTUAL QTY</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">DIFF</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-right">ACTION</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {opnameItems.map((item, idx) => {
                                      const diff = item.actualQty - item.systemQty;
                                      return (
                                         <tr key={idx} className="bg-white">
                                            <td className="px-4 py-3 text-[10px] font-black uppercase italic">{item.name}</td>
                                            <td className="px-4 py-3 text-[10px] font-black tabular text-center text-slate-400">{item.systemQty}</td>
                                            <td className="px-4 py-3 text-center">
                                               <Input 
                                                  type="number" value={item.actualQty}
                                                  onChange={(e) => {
                                                     const newItems = [...opnameItems]; 
                                                     newItems[idx].actualQty = Number(e.target.value); 
                                                     setOpnameItems(newItems);
                                                  }}
                                                  className="w-24 h-9 bg-slate-50 border-amber-100 rounded-lg text-center font-black text-xs text-amber-600"
                                               />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                               <span className={cn("text-[10px] font-black tabular", diff < 0 ? "text-rose-600" : diff > 0 ? "text-emerald-600" : "text-slate-300")}>
                                                  {diff > 0 ? "+" : ""}{diff}
                                               </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                               <Button variant="ghost" size="sm" onClick={() => setOpnameItems(opnameItems.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                                                  <Trash2 className="h-4 w-4" />
                                               </Button>
                                            </td>
                                         </tr>
                                      );
                                   })}
                                </tbody>
                             </table>
                          </div>
                       )}
                    </div>

                    <Button 
                       onClick={handleCreate}
                       className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-100 transition-all italic"
                       disabled={createMutation.isPending}
                    >
                       {createMutation.isPending ? "PROCESSING..." : "SUBMIT AUDIT RESULTS"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* 📊 II. AUDIT ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <AuditStatCard label="TOTAL SESSIONS" value={String(opnameSessions?.length || 0).padStart(2, '0')} color="text-brand-black" icon={Box} />
         <AuditStatCard label="DRAFT / PENDING" value={String(draftCount).padStart(2, '0')} color="text-amber-600" icon={AlertCircle} />
         <AuditStatCard label="COMPLETED" value={String(completedCount).padStart(2, '0')} color="text-emerald-600" icon={CheckCircle2} />
         <AuditStatCard label="NODES AUDITED" value={String(warehouses?.length || 0).padStart(2, '0')} color="text-indigo-600" icon={Warehouse} />
      </div>

      {/* 📑 III. AUDIT SESSIONS */}
      <div className="space-y-6">
         <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-brand-black rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. AUDIT SESSIONS</h3>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {opnameSessions?.map((session: any) => {
               const totalDiff = session.items?.reduce((sum: number, i: any) => sum + Number(i.difference || 0), 0) || 0;
               const isDraft = session.status === 'DRAFT';
               return (
                  <Card key={session.id} className={cn(
                     "bento-card overflow-hidden group transition-all duration-500",
                     isDraft ? "bg-brand-black text-white border-amber-500/20" : "bg-white border-slate-100"
                  )}>
                     <div className="p-8 space-y-8">
                        <div className="flex justify-between items-start">
                           <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:-rotate-12 shadow-xl",
                              isDraft ? "bg-amber-500 text-brand-black shadow-amber-500/20" : "bg-slate-50 text-slate-300"
                           )}>
                              {isDraft ? <ClipboardCheck className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6 text-emerald-500" />}
                           </div>
                           <Badge className={cn(
                              "rounded-xl px-4 py-1.5 font-black uppercase tracking-widest text-[9px] border-none shadow-sm",
                              isDraft ? "bg-amber-500 text-brand-black animate-pulse" : "bg-emerald-50 text-emerald-700"
                           )}>
                              {session.status}
                           </Badge>
                        </div>

                        <div>
                           <h3 className={cn("text-2xl font-black italic uppercase tracking-tighter", isDraft ? "text-white" : "text-brand-black")}>
                              {session.warehouse?.name}
                           </h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">ID: {session.opnameNumber} • {session.createdAt}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className={cn("p-4 rounded-2xl border", isDraft ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">ITEMS</p>
                              <p className={cn("text-xl font-black tabular", isDraft ? "text-white" : "text-brand-black")}>{session.items?.length || 0}</p>
                           </div>
                           <div className={cn("p-4 rounded-2xl border", isDraft ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">VARIANCE</p>
                              <p className={cn("text-xl font-black tabular", totalDiff < 0 ? "text-rose-500" : "text-emerald-500")}>
                                 {totalDiff > 0 ? '+' : ''}{totalDiff}
                              </p>
                           </div>
                        </div>

                        {isDraft ? (
                           <Button 
                              onClick={() => { setSelectedOpnameId(session.id); setIsPinModalOpen(true); }}
                              className="w-full h-14 bg-white text-brand-black hover:bg-amber-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all italic border-none shadow-xl"
                           >
                              <Lock className="mr-2 h-4 w-4" /> AUTHORIZE PIN
                           </Button>
                        ) : (
                           <div className="h-14 flex items-center justify-center gap-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest italic">SYNCED & VERIFIED</span>
                           </div>
                        )}
                     </div>
                  </Card>
               );
            })}
         </div>
      </div>

      {/* 🛠️ IV. ADVANCED AUDIT TOOLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="bento-card p-10 bg-white group relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-8">
               <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <FileSpreadsheet className="h-10 w-10 text-slate-300 group-hover:text-amber-500 transition-colors" />
               </div>
               <div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter text-brand-black">BULK RECONCILIATION</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">IMPORT PHYSICAL COUNTS FROM EXCEL TO MASS-VERIFY INVENTORY LOCATIONS.</p>
                  <Button className="mt-6 h-12 px-8 bg-brand-black text-white rounded-xl font-black uppercase tracking-widest text-[9px] italic border-none">UPLOAD SPREADSHEET</Button>
               </div>
            </div>
            <Zap className="h-40 w-40 text-slate-50 absolute -right-10 -bottom-10 group-hover:scale-110 transition-transform duration-1000" />
         </Card>

         <Card className="bento-card p-10 bg-white group relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-8">
               <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center group-hover:-rotate-6 transition-transform">
                  <Barcode className="h-10 w-10 text-slate-300 group-hover:text-indigo-500 transition-colors" />
               </div>
               <div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter text-brand-black">SCANNER PROTOCOL</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">CONNECT WIRELESS BARCODE SCANNERS FOR HIGH-SPEED PHYSICAL STOCK COUNTING.</p>
                  <Button className="mt-6 h-12 px-8 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] italic border-none shadow-lg shadow-indigo-100">ENABLE SCANNER</Button>
               </div>
            </div>
            <ClipboardCheck className="h-40 w-40 text-slate-50 absolute -right-10 -bottom-10 group-hover:scale-110 transition-transform duration-1000" />
         </Card>
      </div>

      {/* PIN Approval Dialog */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="bg-brand-black p-10 text-white text-center relative">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
              <Lock className="h-8 w-8 text-brand-black" />
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">MANAGER <span className="text-slate-500">AUTHORIZATION</span></h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">ENTER 6-DIGIT ESCALATION PIN TO COMMIT ADJUSTMENT</p>
          </div>
          <div className="p-10 space-y-8">
            <Input 
              type="password" 
              maxLength={6}
              value={pin} 
              onChange={(e) => setPin(e.target.value)} 
              placeholder="••••••"
              className="h-20 text-center text-4xl tracking-[0.5em] font-black bg-slate-50 border-slate-200 rounded-2xl focus:ring-amber-500/20"
            />
            <Button 
              onClick={() => selectedOpnameId && pinApproveMutation.mutate({ id: selectedOpnameId, pin })}
              disabled={pin.length < 4 || pinApproveMutation.isPending}
              className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-100 italic transition-all"
            >
              <ShieldCheck className="mr-2 h-5 w-5" /> VERIFY & EXECUTE ADJUSTMENT
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group hover:translate-y-[-5px] transition-all">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-brand-black transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}

