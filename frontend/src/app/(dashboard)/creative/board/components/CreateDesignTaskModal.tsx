"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
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
import { DnaButton } from "@/components/dna";

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
      <DialogContent className="max-w-md border-none p-6 rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
        
        <DialogHeader className="mb-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shadow-sm">
                <Palette className="w-5 h-5 text-blue-600" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Initialize Project</DialogTitle>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5 italic">Phase 1: Design Brief & SO Handover</p>
             </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 relative z-10">
          {/* Sales Order Selection */}
          <div className="space-y-1.5">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> Linked Sales Order
             </label>
             <Select value={soId} onValueChange={(val: string | null) => setSoId(val ?? "")}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border border-slate-200 font-black text-[10px] px-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all uppercase tracking-wider text-slate-800 placeholder:text-slate-400">
                   <SelectValue placeholder="SELECT AN ACTIVE ORDER..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1.5">
                   {salesOrders.map((so: any) => (
                     <SelectItem 
                       key={so.id} 
                       value={so.id}
                       className="rounded-lg h-12 px-3 font-bold text-slate-700 focus:bg-slate-50 focus:text-blue-600 text-[10px] uppercase tracking-wider"
                     >
                       <div className="flex flex-col text-left">
                          <span className="text-[10px] font-black text-slate-900 leading-tight">{so.brandName || so.lead?.brandName}</span>
                          <span className="text-[8px] opacity-60 uppercase tracking-tighter mt-0.5">{so.orderNumber} • {so.lead?.clientName}</span>
                       </div>
                     </SelectItem>
                   ))}
                   {salesOrders.length === 0 && (
                      <div className="p-4 text-center text-[9px] font-black text-slate-300 uppercase tracking-wider">No active orders available</div>
                   )}
                 </SelectContent>
             </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Zap className="w-3.5 h-3.5 text-amber-500" /> Project Type
                </label>
                 <Select value={taskType} onValueChange={(val: string | null) => setTaskType(val ?? "PACKAGING_DESIGN")}>
                   <SelectTrigger className="h-11 rounded-xl bg-slate-50 border border-slate-200 font-black text-[10px] px-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all uppercase tracking-wider text-slate-800">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl border border-slate-100 shadow-xl p-1.5">
                      <SelectItem value="PACKAGING_DESIGN" className="h-10 text-[10px] font-black uppercase tracking-wider">Packaging Design</SelectItem>
                      <SelectItem value="LOGO_DESIGN" className="h-10 text-[10px] font-black uppercase tracking-wider">Logo Creation</SelectItem>
                      <SelectItem value="MARKETING_ASSET" className="h-10 text-[10px] font-black uppercase tracking-wider">Marketing Asset</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <FileText className="w-3.5 h-3.5 text-blue-500" /> Brand Focus
                </label>
                <div className="h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center px-4 text-[10px] font-black text-slate-850 uppercase tracking-wider">
                   {salesOrders.find((s: any) => s.id === soId)?.brandName || "—"}
                </div>
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Creative Direction / Brief</label>
             <Textarea 
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe color palettes, typography, and moodboard requirements..."
                className="min-h-[100px] rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold p-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all uppercase placeholder:text-slate-400 leading-relaxed text-slate-800"
             />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DnaButton 
            onClick={handleSubmit}
            disabled={!soId || !brief}
            variant="primary"
            className="w-full"
          >
             INITIALIZE KANBAN SESSION
          </DnaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
