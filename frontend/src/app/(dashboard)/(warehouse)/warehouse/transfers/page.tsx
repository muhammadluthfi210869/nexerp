"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ArrowRightLeft, 
  Search, 
  PlusCircle, 
  Truck, 
  Warehouse, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Package,
  History as HistoryIcon,
  Navigation,
  MapPin,
  MoreVertical,
  Activity,
  Boxes,
  Trash2,
  Play,
  ArrowRight,
  Zap
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TransferOrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceWarehouse, setSourceWarehouse] = useState<string>("");
  const [destWarehouse, setDestWarehouse] = useState<string>("");
  const [transferItems, setTransferItems] = useState<any[]>([]);
  const [notes, setNotes] = useState("");

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["transfer-orders"],
    queryFn: () => api.get("/warehouse/transfers").then(r => r.data),
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
    mutationFn: async (data: any) => api.post("/warehouse/transfers", data),
    onSuccess: () => {
      toast.success("Transfer Order created.");
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
      setIsModalOpen(false);
      setTransferItems([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed")
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/warehouse/transfers/${id}/execute`, { userId: "system" }),
    onSuccess: () => {
      toast.success("Transfer executed. Inventory synced.");
      queryClient.invalidateQueries({ queryKey: ["transfer-orders"] });
    }
  });

  const addMaterial = (materialId: string) => {
    const mat = materials?.find((m: any) => m.id === materialId);
    if (!mat || transferItems.find(i => i.materialId === materialId)) return;
    setTransferItems([...transferItems, { materialId: mat.id, name: mat.name, qty: 1, stockAvailable: Number(mat.stockQty) }]);
  };

  const handleSubmit = () => {
    if (!sourceWarehouse || !destWarehouse) return toast.error("Select both warehouses.");
    if (transferItems.length === 0) return toast.error("Add at least one material.");
    createMutation.mutate({
      sourceWarehouseId: sourceWarehouse,
      destWarehouseId: destWarehouse,
      notes,
      items: transferItems.map(i => ({ materialId: i.materialId, qty: i.qty }))
    });
  };

  const pendingCount = transfers?.filter((t: any) => t.status === 'PENDING')?.length || 0;
  const completedCount = transfers?.filter((t: any) => t.status === 'COMPLETED')?.length || 0;

  return (
    <div className="space-y-8">
      {/* 🚀 I. DISTRIBUTION HUB HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">INVENTORY DISTRIBUTION HUB ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">TRANSFER <span className="text-slate-300">ORDERS</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">INTER-WAREHOUSE MOVEMENT & STOCK RELOCATION PROTOCOLS</p>
        </div>
        <div className="flex items-center gap-3">
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none italic">
                   <PlusCircle className="mr-2 h-5 w-5 stroke-[3px]" /> CREATE TRANSFER
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
                 <div className="bg-brand-black p-10 text-white relative">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">TRANSFER <span className="text-slate-500">PROTOCOL</span></h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">INTER-WAREHOUSE STOCK RELOCATION PROTOCOL V4.0</p>
                    <ArrowRightLeft className="absolute right-10 top-1/2 -translate-y-1/2 h-16 w-16 text-white/5" />
                 </div>
                 <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">SOURCE WAREHOUSE</label>
                           <Select onValueChange={(v) => setSourceWarehouse(v as string ?? '')}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="ORIGIN..." />
                             </SelectTrigger>
                             <SelectContent>
                                {warehouses?.map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DESTINATION WAREHOUSE</label>
                           <Select onValueChange={(v) => setDestWarehouse(v as string ?? '')}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs">
                                <SelectValue placeholder="DESTINATION..." />
                             </SelectTrigger>
                             <SelectContent>
                                {warehouses?.filter((w: any) => w.id !== sourceWarehouse).map((w: any) => <SelectItem key={w.id} value={w.id} className="font-black uppercase text-[10px]">{w.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">VEHICLE PLATE (LOGISTICS)</label>
                          <Input placeholder="E.G. B 1234 ABC" className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TRANSFER NOTES</label>
                          <Input placeholder="RELOCATION PROTOCOL..." value={notes} onChange={(e) => setNotes(e.target.value)} className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black uppercase text-xs" />
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-black uppercase text-brand-black tracking-widest">APPEND MATERIAL TO TRANSFER</label>
                         <Select onValueChange={(v) => addMaterial(v as string ?? '')}>
                          <SelectTrigger className="h-14 border-2 border-dashed border-slate-200 bg-white rounded-2xl font-black uppercase text-[10px] text-slate-400">
                             <SelectValue placeholder="+ APPEND MATERIAL TO TRANSFER" />
                          </SelectTrigger>
                          <SelectContent>
                             {materials?.map((m: any) => <SelectItem key={m.id} value={m.id} className="font-black uppercase text-[10px]">{m.name} (AVAIL: {Number(m.stockQty)})</SelectItem>)}
                          </SelectContent>
                       </Select>

                       {transferItems.length > 0 && (
                          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                             <table className="w-full text-left">
                                <thead>
                                   <tr className="bg-slate-100/50 border-b border-slate-200">
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400">MATERIAL</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">AVAILABLE</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-center">TRANSFER QTY</th>
                                      <th className="px-4 py-3 text-[8px] font-black uppercase text-slate-400 text-right">ACTION</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                   {transferItems.map((item, idx) => (
                                      <tr key={idx} className="bg-white">
                                         <td className="px-4 py-3 text-[10px] font-black uppercase italic">{item.name}</td>
                                         <td className="px-4 py-3 text-[10px] font-black tabular text-center text-slate-400">{item.stockAvailable}</td>
                                         <td className="px-4 py-3 text-center">
                                            <Input 
                                               type="number" value={item.qty}
                                               onChange={(e) => {
                                                  const val = Number(e.target.value);
                                                  if (val > item.stockAvailable) return toast.error("Exceeds available stock");
                                                  const newItems = [...transferItems]; newItems[idx].qty = val; setTransferItems(newItems);
                                               }}
                                               className="w-20 h-9 bg-slate-50 border-indigo-100 rounded-lg text-center font-black text-xs text-indigo-600"
                                            />
                                         </td>
                                         <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))} className="text-rose-500 hover:bg-rose-50 h-8 w-8 p-0">
                                               <Trash2 className="h-4 w-4" />
                                            </Button>
                                         </td>
                                      </tr>
                                   ))}
                                </tbody>
                             </table>
                          </div>
                       )}
                    </div>

                    <Button 
                       onClick={handleSubmit}
                       className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 transition-all italic"
                       disabled={createMutation.isPending}
                    >
                       {createMutation.isPending ? <Loader2 className="animate-spin" /> : "COMMIT TRANSFER ORDER"}
                    </Button>
                 </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      {/* 📊 II. KPI ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <TransitStatCard label="PENDING" value={String(pendingCount).padStart(2, '0')} color="text-amber-600" icon={Clock} />
         <TransitStatCard label="COMPLETED" value={String(completedCount).padStart(2, '0')} color="text-emerald-600" icon={CheckCircle2} />
         <TransitStatCard label="TOTAL TRANSFERS" value={String(transfers?.length || 0).padStart(2, '0')} color="text-indigo-600" icon={Truck} />
         <TransitStatCard label="ACTIVE NODES" value={String(warehouses?.length || 0).padStart(2, '0')} color="text-brand-black" icon={Warehouse} />
      </div>

      {/* 📑 III. TRANSFER REGISTRY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-brand-black rounded-full" />
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 III. TRANSFER REGISTRY</h3>
        </div>
        <Card className="bento-card overflow-hidden bg-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">TRANSFER #</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">MOVEMENT ROUTE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">ITEMS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">OPERATIONS</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {transfers?.map((trf: any) => (
                       <tr key={trf.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-slate-200">
                                   <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div>
                                   <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{trf.transferNumber}</p>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{trf.date}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-3">
                                <div className="flex flex-col text-right">
                                   <p className="text-[10px] font-black text-brand-black uppercase italic leading-none">{trf.sourceWarehouse?.name}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ORIGIN</p>
                                </div>
                                <ArrowRight className="h-3 w-3 text-indigo-500 animate-pulse" />
                                <div className="flex flex-col">
                                   <p className="text-[10px] font-black text-brand-black uppercase italic leading-none">{trf.destWarehouse?.name}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">TARGET</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <Boxes className="h-4 w-4 text-slate-300" />
                                <p className="text-[11px] font-black text-brand-black tabular uppercase italic">{trf.items?.length} UNITS</p>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-center">
                             <span className={cn(
                                "text-[9px] font-black uppercase px-4 py-1.5 rounded-xl tabular border shadow-sm",
                                trf.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                             )}>
                                {trf.status}
                             </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                             {trf.status === 'PENDING' ? (
                                <Button 
                                   onClick={() => executeMutation.mutate(trf.id)}
                                   className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] rounded-xl shadow-md border-none transition-all italic"
                                >
                                   <Play className="mr-2 h-3 w-3 fill-white" /> EXECUTE
                                </Button>
                             ) : (
                                <div className="flex items-center justify-end gap-2 text-emerald-600">
                                   <CheckCircle2 className="h-4 w-4" />
                                   <span className="text-[9px] font-black uppercase tracking-widest italic">SYNCED</span>
                                </div>
                             )}
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

function TransitStatCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group hover:translate-y-[-5px] transition-all">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 4.2 2.8 2.8" />
      <path d="M18 12h4" />
      <path d="m16.2 19.8 2.8-2.8" />
      <path d="M12 18v4" />
      <path d="m4.8 19.8 2.8-2.8" />
      <path d="M2 12h4" />
      <path d="m4.8 4.2 2.8 2.8" />
    </svg>
  )
}

