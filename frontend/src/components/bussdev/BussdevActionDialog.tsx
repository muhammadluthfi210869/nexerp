"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ActivityType, WorkflowStatus, ProductCategory, LostReason } from "@prisma/client";
import { 
  Send, 
  Loader2,
  FileText,
  DollarSign,
  History,
  ClipboardCheck,
  Upload,
  FlaskConical,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityStreamTimeline } from "./ActivityStreamTimeline";
import { PipelineHUD } from "./PipelineHUD";
import StatusActions from "./StatusActions";
import { useGranularData } from "@/hooks/use-granular-data";


interface BussdevActionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onSuccess?: () => void;
}

// MANDAT V4: Linear State Machine Logic
const NEXT_STAGES: Record<string, string[]> = {
  NEW_LEAD: [WorkflowStatus.CONTACTED, WorkflowStatus.LOST],
  CONTACTED: [WorkflowStatus.FOLLOW_UP_1, WorkflowStatus.NEGOTIATION, WorkflowStatus.LOST],
  FOLLOW_UP_1: [WorkflowStatus.FOLLOW_UP_2, WorkflowStatus.NEGOTIATION, WorkflowStatus.LOST],
  FOLLOW_UP_2: [WorkflowStatus.FOLLOW_UP_3, WorkflowStatus.NEGOTIATION, WorkflowStatus.LOST],
  FOLLOW_UP_3: [WorkflowStatus.NEGOTIATION, WorkflowStatus.LOST],
  NEGOTIATION: ["WAITING_FINANCE_APPROVAL", WorkflowStatus.LOST], // For Sample Payment
  SAMPLE_REQUESTED: [WorkflowStatus.SAMPLE_SENT, WorkflowStatus.LOST],
  SAMPLE_SENT: [WorkflowStatus.SAMPLE_APPROVED, WorkflowStatus.LOST],
  SAMPLE_APPROVED: [WorkflowStatus.SPK_SIGNED, WorkflowStatus.LOST],
  SPK_SIGNED: ["WAITING_FINANCE_APPROVAL", WorkflowStatus.LOST], // For DP 50% Payment
  WAITING_FINANCE_APPROVAL: [], // LOCKED for BusDev
  DP_PAID: [], // LOCKED (Auto-advance to PRODUCTION_PLAN by Finance/System)
  PRODUCTION_PLAN: [WorkflowStatus.READY_TO_SHIP, WorkflowStatus.LOST],
  READY_TO_SHIP: [WorkflowStatus.WON_DEAL, WorkflowStatus.LOST],
  WON_DEAL: [],
  LOST: [],
  ABORTED: [],
};

export function BussdevActionDialog({ isOpen, onOpenChange, lead, onSuccess }: BussdevActionDialogProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [newStage, setNewStage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("action");

  // Protocol Implementation Fields
  const [productCategory, setProductCategory] = useState<string>("");
  const [estimatedMoq, setEstimatedMoq] = useState<string>("");
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [productConcept, setProductConcept] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [pnfFile, setPnfFile] = useState<File | null>(null);
  const [spkFile, setSpkFile] = useState<File | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [downPaymentAmount, setDownPaymentAmount] = useState("");
  
  const [lostReason, setLostReason] = useState<string>("");
  const [packagingSuggestion, setPackagingSuggestion] = useState("");
  const [designSuggestion, setDesignSuggestion] = useState("");
  const [valueSuggestion, setValueSuggestion] = useState("");

  const { updateLead } = useGranularData();

  useEffect(() => {
    if (lead) {
      setNewStage(lead.status || lead.stage || "");
      setProductCategory(lead.categoryEnum || "");
      setEstimatedMoq(lead.moq?.toString() || "");
      setProductConcept(lead.notes || "");
      setTargetPrice(lead.estimatedValue?.toString() || "");
      setLostReason(lead.lostReason || "");
      setPackagingSuggestion(lead.packagingSuggestion || "");
      setDesignSuggestion(lead.designSuggestion || "");
      setValueSuggestion(lead.valueSuggestion || "");
      setNotes("");
    }
  }, [lead, isOpen]);

  const isStageChanged = newStage !== (lead?.status || lead?.stage);
  const currentStatus = lead?.status || lead?.stage;
  const allowedNextStages = NEXT_STAGES[currentStatus] || [];


  const handleSave = () => {
    // BLUEPRINT SIMULATION LOGIC
    const updates: any = {
      notes,
      stage: newStage,
      status: newStage,
      categoryEnum: productCategory,
      moq: estimatedMoq,
      packagingSuggestion,
      designSuggestion,
      valueSuggestion,
    };

    // Specific Blueprint Actions
    if (newStage === "SAMPLE_REQUESTED") {
      toast.info("G1 Gate Triggered: Bukti bayar sampel dikirim ke Finance.");
      toast.info("R&D Notification: NPF & Konsep produk dikirim ke tim Lab.");
      updates.hki = "PROGRESS"; // Simulate start
    }

    if (newStage === "SPK_SIGNED") {
      toast.info("G2 Gate Triggered: SPK & Bukti DP dikirim ke Finance untuk verifikasi Produksi.");
    }

    if (newStage === "WON_DEAL") {
      toast.success("G3 Gate Triggered: Pelunasan terdeteksi. Pesanan siap dikirim!");
      updates.realisasi = lead.omset;
    }

    updateLead(lead.id, updates);
    toast.success(`Progress updated to ${newStage.replace(/_/g, ' ')}`);
    onOpenChange(false);
  };

  const isWaitingFinance = newStage === "WAITING_FINANCE_APPROVAL";
  const isRndHandover = currentStatus === WorkflowStatus.NEGOTIATION && isWaitingFinance;
  const isSpkHandover = currentStatus === WorkflowStatus.SPK_SIGNED && isWaitingFinance;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!lead ? null : (
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-slate-900 uppercase tracking-tight truncate">
                {lead.clientName}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[9px] uppercase tracking-tight mt-0.5">
                V4 Operational State Machine
              </DialogDescription>
            </div>
            <Badge className="bg-slate-900 text-white border-none font-bold text-[8px] px-2 py-0.5 rounded uppercase shrink-0">
              {currentStatus?.replace(/_/g, ' ')}
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-slate-200/50 border border-slate-200 h-9 p-0.5 rounded-lg">
              <TabsTrigger value="action" className="flex-1 rounded-md font-bold uppercase text-[9px] tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all">
                <ClipboardCheck className="h-3 w-3 mr-1.5" /> Action
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1 rounded-md font-bold uppercase text-[9px] tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all">
                <History className="h-3 w-3 mr-1.5" /> History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="action" className="m-0 space-y-4">
              
              <PipelineHUD lead={lead} />

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stage Transition</label>
                <StatusActions
                  currentStatus={currentStatus}
                  allowedTransitions={allowedNextStages}
                  onTransition={(target) => {
                    setNewStage(target);
                  }}
                  isPending={false}
                />

                {/* BLUEPRINT GUIDANCE HUD */}
                {isStageChanged && (
                  <div className={cn(
                    "p-3 rounded-xl border flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300",
                    newStage === "SAMPLE_REQUESTED" ? "bg-blue-50 border-blue-100" :
                    newStage === "SPK_SIGNED" ? "bg-amber-50 border-amber-100" :
                    newStage === "WON_DEAL" ? "bg-emerald-50 border-emerald-100" :
                    "bg-slate-50 border-slate-100"
                  )}>
                     <AlertCircle className={cn(
                       "h-4 w-4 shrink-0 mt-0.5",
                       newStage === "SAMPLE_REQUESTED" ? "text-blue-600" :
                       newStage === "SPK_SIGNED" ? "text-amber-600" :
                       newStage === "WON_DEAL" ? "text-emerald-600" :
                       "text-slate-400"
                     )} />
                     <div className="space-y-1">
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-tight",
                          newStage === "SAMPLE_REQUESTED" ? "text-blue-700" :
                          newStage === "SPK_SIGNED" ? "text-amber-700" :
                          newStage === "WON_DEAL" ? "text-emerald-700" :
                          "text-slate-700"
                        )}>
                          Blueprint Interlock: {newStage.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-500 leading-normal">
                          {newStage === "SAMPLE_REQUESTED" && "Wajib upload bukti bayar sampel. Notifikasi otomatis akan dikirim ke Finance (G1) dan R&D."}
                          {newStage === "SPK_SIGNED" && "Komitmen Produksi (G2). Wajib upload SPK bertanda tangan dan bukti DP minimal 50%."}
                          {newStage === "WON_DEAL" && "Fase Akhir (G3). Pelunasan terdeteksi. Pesanan akan diproses oleh tim Warehouse untuk pengiriman."}
                          {newStage !== "SAMPLE_REQUESTED" && newStage !== "SPK_SIGNED" && newStage !== "WON_DEAL" && "Pastikan semua catatan operasional telah diisi sebelum melanjutkan transisi stage."}
                        </p>
                     </div>
                  </div>
                )}

                {/* FINANCIAL GATE INPUTS */}
                {(newStage === "SAMPLE_REQUESTED" || newStage === "SPK_SIGNED") && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-2">
                       <DollarSign className="h-3 w-3 text-emerald-600" /> Dokumen Pembayaran & Legal
                    </p>
                    <div className="space-y-2">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase italic">Bukti Transfer (Wajib)</label>
                          <div className="flex items-center gap-2">
                             <Input type="file" className="h-9 border-slate-100 text-[9px] p-1.5 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors" onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                             {paymentProofFile && <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" />}
                          </div>
                       </div>
                       {newStage === "SPK_SIGNED" && (
                         <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase italic">SPK Signed (Wajib)</label>
                            <Input type="file" className="h-9 border-slate-100 text-[9px] p-1.5 bg-slate-50 rounded-lg" onChange={(e) => setSpkFile(e.target.files?.[0] || null)} />
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {/* R&D PROTOCOL INPUTS */}
                {newStage === "SAMPLE_REQUESTED" && (
                  <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-700 flex items-center gap-2">
                       <FlaskConical className="h-3 w-3 text-amber-600" /> Briefing R&D (NPF)
                    </p>
                    <div className="space-y-2">
                       <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase italic">Konsep Produk / Request Wangi</label>
                          <Textarea 
                            placeholder="Contoh: Tekstur Gel, Wangi Rose, Target HPP 5rb/pcs..."
                            className="min-h-[70px] rounded-lg border-slate-100 bg-slate-50 font-bold text-xs p-3 focus:bg-white transition-all"
                            value={productConcept}
                            onChange={(e) => setProductConcept(e.target.value)}
                          />
                       </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catatan Progress Tambahan</label>
                  <Textarea 
                    placeholder="Contoh: Klien setuju dengan penawaran, lanjut ke tahap sampel..." 
                    className="min-h-[80px] rounded-xl border-slate-200 bg-slate-50 text-xs font-bold p-3 focus:bg-white transition-all"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="m-0 min-h-[300px]">
               <ActivityStreamTimeline leadId={lead.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <Button 
            className={cn(
              "w-full h-11 font-bold uppercase text-[11px] tracking-wider rounded-xl shadow-lg transition-all",
              isStageChanged ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" : "bg-slate-900 hover:bg-slate-800 shadow-slate-100"
            )}
            onClick={handleSave}
            disabled={!notes || (newStage === "SAMPLE_REQUESTED" && !paymentProofFile) || (newStage === "SPK_SIGNED" && (!paymentProofFile || !spkFile))}
          >
            <Send className="h-4 w-4 mr-2" /> 
            {isStageChanged ? `Execute Workflow: ${newStage.replace(/_/g, ' ')}` : "Save Operation Log"}
          </Button>
        </div>

      </DialogContent>
      )}
    </Dialog>
  );
}

