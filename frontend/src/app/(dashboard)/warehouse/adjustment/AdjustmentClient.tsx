"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Layers,
  ChevronRight,
  MoreVertical,
  History,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Adjustment {
  id: string;
  adjNumber: string;
  materialName: string;
  type: 'WRITE_OFF' | 'CORRECTION' | 'DISPOSAL';
  qty: number;
  unit: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  warehouseName: string;
  date: string;
}

export default function AdjustmentClient() {
  const queryClient = useQueryClient();
  const [isNewAdjOpen, setIsNewAdjOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Form state
  const [formMaterialId, setFormMaterialId] = useState("");
  const [formType, setFormType] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => {
      const res = await api.get('/warehouse/adjustments');
      return (res.data || []) as Adjustment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      materialId: string;
      type: string;
      qty: number;
      warehouseId: string;
      notes?: string;
    }) => {
      const res = await api.post('/warehouse/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      setIsNewAdjOpen(false);
      setFormMaterialId("");
      setFormType("");
      setFormQty("");
      setFormWarehouseId("");
      setFormNotes("");
      toast.success("Adjustment submitted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create adjustment");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.post(`/warehouse/adjustments/${id}/approve`, { status, userId: "system" });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      toast.success(`Adjustment ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update adjustment");
    },
  });

  const pendingCount = adjustments.filter((a: Adjustment) => a.status === 'PENDING').length;
  const completedCount = adjustments.filter((a: Adjustment) => a.status !== 'PENDING').length;

  const filteredAdjustments = adjustments.filter((a: Adjustment) => {
    const matchesSearch = a.materialName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || a.type === filterType;
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <button className="hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-widest">Warehouse / Adjustment</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
             Stock Adjustment
             <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          </h1>
        </div>

        <Dialog open={isNewAdjOpen} onOpenChange={setIsNewAdjOpen}>
          <DialogTrigger asChild>
            <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl px-6 h-11 font-black uppercase tracking-tighter text-[11px] shadow-xl shadow-white/5">
               <Plus className="w-4 h-4 mr-2" /> NEW ADJ
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] max-w-md p-8 border-2">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">New Stock Adjustment</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-6">
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Material</label>
                   <Select value={formMaterialId} onValueChange={(v) => v && setFormMaterialId(v)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 rounded-xl h-12 text-[12px] font-bold">
                      <SelectValue placeholder="Choose Material..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="gly">Glycerin Pharma Grade</SelectItem>
                      <SelectItem value="nia">Niacinamide Powder</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adj Type</label>
                     <Select value={formType} onValueChange={(v) => v && setFormType(v)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 rounded-xl h-12 text-[12px] font-bold">
                        <SelectValue placeholder="Type..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="WRITE_OFF">Write Off</SelectItem>
                        <SelectItem value="CORRECTION">Correction</SelectItem>
                        <SelectItem value="DISPOSAL">Disposal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
                    <Input type="number" className="bg-slate-800/50 border-slate-700 rounded-xl h-12 text-[12px] font-black" placeholder="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} />
                  </div>
               </div>
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Warehouse Location</label>
                   <Select value={formWarehouseId} onValueChange={(v) => v && setFormWarehouseId(v)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 rounded-xl h-12 text-[12px] font-bold">
                      <SelectValue placeholder="Select Warehouse..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="ch">Central Hub</SelectItem>
                      <SelectItem value="rm">Raw Mat WH</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason / Notes</label>
                   <Input className="bg-slate-800/50 border-slate-700 rounded-xl h-12 text-[12px] font-bold" placeholder="Optional notes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
               </div>
               <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1 rounded-xl h-12 text-slate-400 font-bold" onClick={() => setIsNewAdjOpen(false)}>CANCEL</Button>
                   <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 font-black uppercase italic tracking-tighter" 
                     onClick={() => {
                       if (!formMaterialId || !formType || !formQty || !formWarehouseId) {
                         return toast.error("Please fill in all required fields");
                       }
                       createMutation.mutate({
                         materialId: formMaterialId,
                         type: formType,
                         qty: Number(formQty),
                         warehouseId: formWarehouseId,
                         notes: formNotes || undefined,
                       });
                     }}
                     disabled={createMutation.isPending}
                   >
                     {createMutation.isPending ? <Loader2 className="animate-spin" /> : "SUBMIT ADJUSTMENT"}
                   </Button>
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          { label: "TOTAL ADJUSTMENT", val: adjustments.length, icon: Layers, color: "text-blue-400" },
          { label: "PENDING APPR", val: pendingCount, icon: Clock, color: "text-amber-400" },
          { label: "COMPLETED", val: completedCount, icon: CheckCircle2, color: "text-emerald-400" },
        ].map((card, i) => (
          <Card key={i} className="bg-slate-800/60 backdrop-blur border-slate-700/30 p-6 rounded-[2.5rem] flex items-center justify-between shadow-lg">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-4xl font-black tracking-tighter tabular text-white">{card.val}</p>
            </div>
            <div className={cn("p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50", card.color)}>
               <card.icon className="w-6 h-6" />
            </div>
          </Card>
        ))}
      </div>

      {/* 3. FILTER BAR */}
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 p-4 rounded-[1.5rem] mb-6 flex gap-4 items-center shadow-inner shadow-slate-900/20">
         <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH MATERIAL..." 
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-[11px] font-black text-white focus:outline-none focus:ring-1 focus:ring-slate-500 transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
          <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
             <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700/50 rounded-xl h-[46px] text-[10px] font-black uppercase italic tracking-widest">
                <SelectValue placeholder="TYPE" />
             </SelectTrigger>
             <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="ALL">ALL TYPES</SelectItem>
                <SelectItem value="WRITE_OFF">WRITE OFF</SelectItem>
                <SelectItem value="CORRECTION">CORRECTION</SelectItem>
                <SelectItem value="DISPOSAL">DISPOSAL</SelectItem>
             </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
            <SelectTrigger className="w-40 bg-slate-900/50 border-slate-700/50 rounded-xl h-[46px] text-[10px] font-black uppercase italic tracking-widest">
               <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
               <SelectItem value="ALL">ALL STATUS</SelectItem>
               <SelectItem value="PENDING">PENDING</SelectItem>
               <SelectItem value="APPROVED">APPROVED</SelectItem>
               <SelectItem value="REJECTED">REJECTED</SelectItem>
            </SelectContent>
         </Select>
      </Card>

      {/* 4. TABLE SECTION */}
      <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/50 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900/40 border-b border-slate-700/50">
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">#ADJ</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Material</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Qty</th>
              <th className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredAdjustments.map((adj) => (
              <tr key={adj.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-blue-400 tabular">{adj.adjNumber}</td>
                <td className="px-6 py-4">
                   <p className="text-[11px] font-black text-white">{adj.materialName}</p>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{adj.warehouseName}</p>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-tighter">{adj.type.replace('_', ' ')}</span>
                </td>
                <td className={cn(
                  "px-6 py-4 text-right text-[11px] font-black tabular",
                  adj.qty < 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                   {adj.qty > 0 ? `+${adj.qty}` : adj.qty} {adj.unit}
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={cn(
                     "px-2 py-0.5 rounded text-[6.5px] font-black uppercase tracking-widest",
                     adj.status === 'PENDING' ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                     adj.status === 'APPROVED' ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" :
                     "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                   )}>
                     {adj.status}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-400">
                   {new Date(adj.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                </td>
                <td className="px-6 py-4 text-right">
                  {adj.status === 'PENDING' ? (
                    <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => approveMutation.mutate({ id: adj.id, status: 'APPROVED' })}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                          disabled={approveMutation.isPending}
                        >
                           <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => approveMutation.mutate({ id: adj.id, status: 'REJECTED' })}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-lg shadow-rose-500/10"
                          disabled={approveMutation.isPending}
                        >
                           <XCircle className="w-3.5 h-3.5" />
                        </button>
                    </div>
                  ) : (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-500">
                          <MoreVertical className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAdjustments.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center gap-4">
             <AlertCircle className="w-12 h-12 text-slate-800" />
             <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">No adjustments found matching filters</p>
          </div>
        )}
      </Card>

      {/* 5. RECENT ACTIVITY FOOTER */}
      <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">
               <History className="w-4 h-4 text-slate-400" />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recent Activity Log</p>
               <p className="text-[10px] font-bold text-slate-400 italic">"Adjustment ADJ-24002 was approved by Supervisor B." — 2h ago</p>
            </div>
         </div>
         <button className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline flex items-center gap-2">
            VIEW FULL AUDIT TRAIL <ChevronRight className="w-3 h-3" />
         </button>
      </div>

    </div>
  );
}
