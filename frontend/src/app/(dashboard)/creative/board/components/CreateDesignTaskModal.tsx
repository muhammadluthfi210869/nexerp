"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Palette, FileText, ShoppingBag, Zap } from "lucide-react";

export function CreateDesignTaskModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onCreate: (data: any) => void;
}) {
  const [soId, setSoId] = useState("");
  const [brief, setBrief] = useState("");
  const [taskType, setTaskType] = useState("PACKAGING_DESIGN");

  const { data: salesOrders = [] } = useQuery({
    queryKey: ["available-sos"],
    queryFn: () => api.get("/creative/available-sales-orders").then(res => res.data),
    enabled: isOpen
  });

  const handleSubmit = () => {
    const selectedSO = salesOrders.find((s: any) => s.id === soId);
    if (!selectedSO) return;

    onCreate({
      leadId: selectedSO.leadId,
      soId: selectedSO.id,
      brief,
      taskType
    });
    
    // Reset and close
    setSoId("");
    setBrief("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl border-none p-10 rounded-[3rem] bg-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <DialogHeader className="mb-8 relative z-10">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-100">
                <Palette className="w-7 h-7 text-white" />
             </div>
             <div>
                <DialogTitle className="text-3xl font-black text-slate-900 tracking-tighter">Initialize Creative Project</DialogTitle>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.3em] mt-1 italic">Phase 1: Design Brief & SO Handover</p>
             </div>
          </div>
        </DialogHeader>

        <div className="space-y-10 relative z-10">
          {/* Sales Order Selection */}
          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" /> Linked Sales Order
             </label>
             <Select value={soId} onValueChange={(val) => setSoId(val ?? "")}>
                <SelectTrigger className="h-20 rounded-[1.5rem] bg-slate-50 border-none font-black text-lg px-8 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                   <SelectValue placeholder="SELECT AN ACTIVE ORDER..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                   {salesOrders.map((so: any) => (
                     <SelectItem 
                       key={so.id} 
                       value={so.id}
                       className="rounded-xl h-16 px-4 font-bold text-slate-700 focus:bg-indigo-50 focus:text-indigo-600"
                     >
                       <div className="flex flex-col">
                          <span className="text-sm font-black">{so.brandName || so.lead?.brandName}</span>
                          <span className="text-[10px] opacity-50 uppercase tracking-tighter">{so.orderNumber} • {so.lead?.clientName}</span>
                       </div>
                     </SelectItem>
                   ))}
                </SelectContent>
             </Select>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <Zap className="w-4 h-4 text-amber-500" /> Project Type
                </label>
                <Select value={taskType} onValueChange={(val) => setTaskType(val ?? "PACKAGING_DESIGN")}>
                   <SelectTrigger className="h-20 rounded-[1.5rem] bg-slate-50 border-none font-black text-lg px-8">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="PACKAGING_DESIGN" className="h-14 font-bold">Packaging Design</SelectItem>
                      <SelectItem value="LOGO_DESIGN" className="h-14 font-bold">Logo Creation</SelectItem>
                      <SelectItem value="MARKETING_ASSET" className="h-14 font-bold">Marketing Asset</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-blue-500" /> Brand Focus
                </label>
                <div className="h-20 rounded-[1.5rem] bg-slate-50 flex items-center px-8 text-xl font-black text-slate-900 border-none shadow-inner">
                   {salesOrders.find((s: any) => s.id === soId)?.brandName || "—"}
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Creative Direction / Brief</label>
             <Textarea 
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe color palettes, typography, and moodboard requirements..."
                className="min-h-[180px] rounded-[2rem] bg-slate-50 border-none font-medium text-base p-8 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
             />
          </div>
        </div>

        <DialogFooter className="mt-12">
          <Button 
            onClick={handleSubmit}
            disabled={!soId || !brief}
            className="w-full h-24 rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black uppercase text-sm tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
             INITIALIZE KANBAN SESSION
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

