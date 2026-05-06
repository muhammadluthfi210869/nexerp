"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Search, 
  LogIn, 
  Truck, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Trash2,
  Package,
  MapPin,
  ClipboardList,
  Activity,
  History,
  Boxes
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InboundItem {
  materialId: string;
  materialName: string;
  quantity: number;
  batchNumber: string;
  expiryDate?: string;
}

export default function GoodsReceivingPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedPO, setSelectedPO] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InboundItem[]>([]);
  
  const [newItemMaterialId, setNewItemMaterialId] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemBatch, setNewItemBatch] = useState("");
  const [newItemExp, setNewItemExp] = useState("");

  const { data: inbounds, isLoading } = useQuery<any[]>({
    queryKey: ["warehouse-inbounds"],
    queryFn: async () => {
      const res = await api.get("/warehouse/inbounds");
      return res.data.map((grn: any) => ({
        id: grn.inboundNumber || grn.id,
        date: grn.receivedAt?.split('T')[0] || '',
        supplier: grn.po?.supplier?.name || 'Direct Inbound',
        po: grn.po?.poNumber || '-',
        status: grn.status,
      }));
    },
  });

  const { data: activePOs } = useQuery({
    queryKey: ["purchase-orders-active"],
    queryFn: async () => {
      const res = await api.get("/scm/purchase-orders");
      return res.data
        .filter((po: any) => po.status === 'ORDERED' || po.status === 'PARTIAL')
        .map((po: any) => ({
          id: po.poNumber || po.id,
          supplier: { name: po.supplier?.name || 'Unknown' },
        }));
    }
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: () => api.get("/master/materials").then(r => r.data),
  });

  const createInboundMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/warehouse/inbounds", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Goods successfully received and entered into system inventory.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-inbounds"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create inbound");
    }
  });

  const resetForm = () => {
    setSelectedPO("");
    setNotes("");
    setItems([]);
  };

  const addItem = () => {
    if (!newItemMaterialId || !newItemQty || !newItemBatch) return;
    const material = materials?.find((m: any) => m.id === newItemMaterialId);
    if (!material) return;

    setItems([...items, {
      materialId: newItemMaterialId,
      materialName: material.name,
      quantity: Number(newItemQty),
      batchNumber: newItemBatch,
      expiryDate: newItemExp
    }]);
    setNewItemMaterialId("");
    setNewItemQty("");
    setNewItemBatch("");
    setNewItemExp("");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* 📥 I. INBOUND PROTOCOL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">INBOUND PROTOCOL ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">GOODS <span className="text-slate-300">RECEIVING</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MATERIAL INTAKE & BATCH INTEGRITY TERMINAL</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase">INTAKE VELOCITY</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">VERIFIED MANIFESTS</p>
           </div>
           <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none">
                   <Plus className="mr-2 h-5 w-5 stroke-[3px]" /> RECEIVE SHIPMENT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[850px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">INBOUND <span className="text-slate-500">ENTRY PORTAL</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">VERIFYING PHYSICAL ARRIVAL VS PURCHASE ORDER RECORD</p>
                    <LogIn className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">PO REFERENCE (CONTRACT)</label>
                           <Select value={selectedPO} onValueChange={(v) => setSelectedPO(v ?? '')}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="SELECT PURCHASE ORDER..." />
                             </SelectTrigger>
                             <SelectContent>
                                {activePOs?.map((po: any) => (
                                   <SelectItem key={po.id} value={po.id} className="font-black uppercase text-[10px]">{po.id} - {po.supplier.name}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">RECEIVED DATE</label>
                          <Input type="date" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                       <label className="text-[10px] font-black uppercase text-brand-black tracking-widest">MATERIAL INSPECTION & BATCH ENTRY</label>
                       <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-4">
                              <Select value={newItemMaterialId} onValueChange={(v) => setNewItemMaterialId(v ?? '')}>
                                <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-[10px]">
                                   <SelectValue placeholder="MATERIAL..." />
                                </SelectTrigger>
                                <SelectContent>
                                   {materials?.map((m: any) => (
                                      <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">{m.name}</SelectItem>
                                   ))}
                                </SelectContent>
                             </Select>
                          </div>
                          <Input placeholder="QTY" type="number" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-[10px] col-span-2" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} />
                          <Input placeholder="BATCH #" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-[10px] col-span-3" value={newItemBatch} onChange={(e) => setNewItemBatch(e.target.value)} />
                          <Input type="date" className="h-12 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-[10px] col-span-2" value={newItemExp} onChange={(e) => setNewItemExp(e.target.value)} />
                          <Button onClick={addItem} className="h-12 bg-brand-black text-white rounded-xl col-span-1">
                             <Plus className="h-5 w-5 stroke-[3px]" />
                          </Button>
                       </div>

                       <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="bg-slate-100/50 border-b border-slate-200">
                                   <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400">MATERIAL</th>
                                   <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">QTY</th>
                                   <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400">BATCH</th>
                                   <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-right">ACTION</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-200">
                                {items.map((item, idx) => (
                                   <tr key={idx} className="bg-white">
                                      <td className="px-4 py-3 text-[10px] font-black uppercase italic">{item.materialName}</td>
                                      <td className="px-4 py-3 text-[10px] font-black tabular text-center text-blue-600">{item.quantity}</td>
                                      <td className="px-4 py-3 text-[10px] font-black uppercase text-slate-500">{item.batchNumber}</td>
                                      <td className="px-4 py-3 text-right">
                                         <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                                            <Trash2 className="h-4 w-4" />
                                         </Button>
                                      </td>
                                   </tr>
                                ))}
                                {items.length === 0 && (
                                   <tr>
                                      <td colSpan={4} className="h-20 text-center text-[9px] font-black text-slate-300 uppercase italic">AWAITING MATERIAL ENTRY</td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>

                    <Button 
                       onClick={() => {
                         if (items.length === 0) return toast.error("Add at least one material item.");
                         createInboundMutation.mutate({
                           poId: selectedPO || undefined,
                           receivedAt: receivedDate,
                           items: items.map(i => ({
                             materialId: i.materialId,
                             quantity: i.quantity,
                             batchNumber: i.batchNumber,
                             expiryDate: i.expiryDate,
                           })),
                         });
                       }}
                       className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-100 transition-all italic"
                       disabled={createInboundMutation.isPending}
                    >
                       {createInboundMutation.isPending ? <Loader2 className="animate-spin" /> : "VERIFY & COMMIT TO INVENTORY"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* 📊 II. INTAKE ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <IntakeStatCard label="TODAY'S INTAKE" value={String(inbounds?.length || 0).padStart(2, '0')} color="text-blue-600" icon={LogIn} />
         <IntakeStatCard label="QC PASSED" value={inbounds?.length ? `${Math.round(inbounds.filter((g: any) => g.status === 'COMPLETED').length / inbounds.length * 100)}%` : '0%'} color="text-emerald-600" icon={ShieldCheck} />
         <IntakeStatCard label="AVG. CYCLE TIME" value="45M" color="text-amber-600" icon={Activity} />
         <IntakeStatCard label="SKUS ADDED" value={String(inbounds?.reduce((s: number, g: any) => s + (g.itemsCount || 0), 0) || 0)} color="text-brand-black" icon={Boxes} />
      </div>

      {/* 📑 III. GRN PROTOCOL REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. GRN PROTOCOL REGISTRY</h3>
        </div>
        <Card className="bento-card overflow-hidden bg-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">GRN PROTOCOL</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">VENDOR / SOURCE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CONTRACT REF</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">ACTION</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {inbounds?.map((grn: any) => (
                       <tr key={grn.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                                   <History className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{grn.id}</p>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{grn.date}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-2 mb-1">
                                <Truck className="h-3 w-3 text-blue-600" />
                                <p className="text-[11px] font-black text-brand-black uppercase italic">{grn.supplier}</p>
                             </div>
                             <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-slate-300" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter italic">CENTRAL DOCK</span>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <p className="text-[11px] font-black text-brand-black uppercase tabular italic">{grn.po}</p>
                             <p className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">VERIFIED CONTRACT</p>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className={cn(
                                "text-[9px] font-black uppercase px-4 py-1.5 rounded-xl tabular border shadow-sm",
                                grn.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                             )}>
                                {grn.status}
                             </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                             <Button className="h-9 px-6 font-black uppercase text-[9px] rounded-xl bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 transition-all italic shadow-sm">
                                REVIEW GRN <ClipboardList className="ml-2 h-3 w-3" />
                             </Button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>
    </div>
  );
}

function IntakeStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group hover:translate-y-[-5px] transition-all">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}

