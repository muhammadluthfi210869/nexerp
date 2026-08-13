"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Timer, 
  Beaker,
  Layers,
  Lock,
  History,
  Droplets,
  Package
} from "lucide-react";
import { KpiCard } from "@/components/dna/KpiCard";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/layout/DashboardShell";

// --- Constants ---
const STAGES = ["BATCHING", "MIXING", "FILLING", "PACKING"];

// --- Types ---
interface ProductionPlan {
  id: string;
  batch_no: string;
  status: string;
  so: { lead: { client_name: string } };
  stepLogs: {
    id: string;
    stage: string;
    qty_result: number;
    qcAudits: { status: string }[];
  }[];
}

export default function ProductionFloor() {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // --- Mass Balance State ---
  const [inputQty, setInputQty] = useState<number>(0);
  const [goodQty, setGoodQty] = useState<number>(0);
  const [rejectQty, setRejectQty] = useState<number>(0);
  const [quarantineQty, setQuarantineQty] = useState<number>(0);
  // Hindari hydration mismatch: set waktu via effect (bukan saat render).
  const [systemTime, setSystemTime] = useState<string | null>(null);
  useEffect(() => {
    setSystemTime(new Date().toLocaleTimeString());
  }, []);

  const totalOutput = goodQty + rejectQty + quarantineQty;
  const difference = inputQty - totalOutput;
  const tolerance = inputQty * 0.01;
  const isWithinTolerance = Math.abs(difference) <= tolerance;

  // --- Fetchers ---
  const { data: plans } = useQuery<ProductionPlan[]>({
    queryKey: ["production-plans-floor"],
    queryFn: async () => {
      const res = await api.get("/production-plans");
      // Filter only READY or ON_PROGRESS for the floor
      return res.data.filter((p: { status: string }) => p.status === "READY" || p.status === "ON_PROGRESS");
    }
  });

  // --- Mutations ---
  const logStepMutation = useMutation({
    mutationFn: async (payload: { wo_id: string; stage: string; input_qty: number; qty_result: number; qty_reject: number; qty_quarantine: number }) => {
      return api.post("/production-plans/log-step", payload);
    },
    onSuccess: () => {
      toast.success("Stage Result Logged. Transmitting to Lab for Audit.");
      queryClient.invalidateQueries({ queryKey: ["production-plans-floor"] });
      setIsLogModalOpen(false);
      resetLogForm();
    },
    onError: () => toast.error("Transmission error. Check factory connectivity.")
  });

  const resetLogForm = () => {
    setInputQty(0);
    setGoodQty(0);
    setRejectQty(0);
    setQuarantineQty(0);
  };

  // --- Helpers ---
  const getStageStatus = (plan: ProductionPlan, stage: string) => {
    const log = plan.stepLogs.find(l => l.stage === stage);
    if (!log) return "PENDING";
    const pass = log.qcAudits.some(a => a.status === "PASS");
    if (pass) return "PASS";
    return "WAITING_QC";
  };

  const isStageLocked = (plan: ProductionPlan, stage: string) => {
    const stageIndex = STAGES.indexOf(stage);
    if (stageIndex === 0) return false; // First stage never locked by QC

    const prevStage = STAGES[stageIndex - 1];
    return getStageStatus(plan, prevStage) !== "PASS";
  };

  return (
    <DashboardShell
      title="Workstation"
      titleAccent="Alpha"
      subtitle="Terminal Lantai Produksi - Tablet Optimized"
      actions={
        <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-bold uppercase">System Time</p>
            <p className="text-xl font-sans text-gray-900">{systemTime ?? "--:--:--"}</p>
          </div>
        </div>
      }
    >
      {(() => {
        const mixingCount = plans?.filter(p => p.stepLogs.some(l => l.stage === "MIXING")).length || 0;
        const fillingCount = plans?.filter(p => p.stepLogs.some(l => l.stage === "FILLING")).length || 0;
        const packingCount = plans?.filter(p => p.stepLogs.some(l => l.stage === "PACKING")).length || 0;
        return (
          <div className="grid grid-cols-4 gap-8 mb-6">
            <KpiCard label="Active Batches" value={String(plans?.length || 0)} targetPct={50} icon={<Layers />} />
            <KpiCard label="Mixing" value={String(mixingCount)} targetPct={50} icon={<Beaker />} />
            <KpiCard label="Filling" value={String(fillingCount)} targetPct={50} icon={<Droplets />} />
            <KpiCard label="Packing" value={String(packingCount)} targetPct={50} icon={<Package />} />
          </div>
        );
      })()}
      <div className="grid grid-cols-1 gap-8">
        {plans?.map(plan => (
          <Card key={plan.id} className="border-gray-200 bg-white/80 overflow-hidden">
             <div className="bg-white px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200">
                <div>
                   <Badge className="bg-emerald-500 text-black font-black text-[10px] uppercase rounded-none mb-2">RUNNING BATCH</Badge>
                    <CardTitle className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">{plan.batch_no}</CardTitle>
                   <CardDescription className="text-zinc-500 uppercase font-bold text-xs mt-1">Client: {plan.so?.lead?.client_name}</CardDescription>
                </div>
                <div className="flex gap-4 mt-4 md:mt-0">
                   <Button variant="outline" className="border-gray-200 bg-white text-gray-500 hover:text-gray-900 h-16 w-16 p-0 group">
                      <History className="h-6 w-6 group-hover:rotate-[-45deg] transition-transform" />
                   </Button>
                </div>
             </div>
             
             <CardContent className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {STAGES.map((stage, idx) => {
                     const status = getStageStatus(plan, stage);
                     const locked = isStageLocked(plan, stage);
                     
                     return (
                       <button
                         key={stage}
                         disabled={locked || status === "PASS" || status === "WAITING_QC"}
                         onClick={() => { setSelectedPlan(plan); setActiveStage(stage); setIsLogModalOpen(true); }}
                         className={`relative h-48 rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-4 group active:scale-95 ${
                           status === "PASS" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" :
                           status === "WAITING_QC" ? "bg-amber-500/10 border-amber-500 text-amber-500" :
                           locked ? "bg-gray-50 border-gray-200 text-zinc-700 opacity-50 grayscale" :
                            "bg-white border-gray-200 text-gray-900 hover:border-emerald-500 hover:bg-gray-100"
                         }`}
                       >
                          {status === "PASS" && <CheckCircle2 className="h-10 w-10 animate-in zoom-in" />}
                          {status === "WAITING_QC" && <Timer className="h-10 w-10 animate-pulse" />}
                          {locked && <Lock className="h-10 w-10 mb-2" />}
                          {!locked && status === "PENDING" && <Activity className="h-10 w-10 group-hover:animate-bounce" />}
                          
                          <div className="text-center">
                             <p className="text-[10px] font-black uppercase tracking-tight opacity-60">Stage 0{idx + 1}</p>
                             <p className="text-2xl font-black uppercase italic tracking-tighter">{stage}</p>
                          </div>

                          {locked && (
                            <div className="absolute top-2 right-2">
                               <Badge className="bg-amber-500 text-black text-[9px] font-black italic rounded-none tracking-tight">LOCKED: QC PENDING</Badge>
                            </div>
                          )}
                       </button>
                     );
                   })}
                </div>
             </CardContent>
          </Card>
        ))}
        
        {plans?.length === 0 && (
          <div className="py-40 text-center opacity-20 flex flex-col items-center">
             <Layers className="h-32 w-32 mb-4 text-zinc-500" />
             <p className="text-2xl font-black uppercase tracking-[0.5em] italic">No Work Orders on Platform</p>
          </div>
        )}
      </div>

      {/* Touch-First Log Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
         <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-4xl p-0 overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)]">
            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
               {/* Left Info Panel */}
               <div className="md:col-span-4 bg-white p-10 flex flex-col justify-between border-r border-gray-200">
                  <div>
                     <p className="text-xs font-black text-emerald-500 uppercase tracking-tight mb-4">Input Validation</p>
                     <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">{activeStage}</h2>
                     <p className="text-zinc-500 font-sans text-sm uppercase">Batch: {selectedPlan?.batch_no}</p>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="p-4 bg-black/40 rounded-xl border border-gray-200">
                        <p className="text-[10px] text-zinc-500 uppercase font-black mb-2">Mass Balance Delta</p>
                         <p className={`text-3xl font-sans font-bold ${isWithinTolerance ? 'text-gray-900' : 'text-red-500'}`}>
                           {difference.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-medium uppercase mt-1">Tolerance Level: ±{tolerance.toFixed(2)}</p>
                     </div>
                  </div>
               </div>

               {/* Right Input Panel */}
               <div className="md:col-span-8 p-12 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="col-span-2 space-y-4">
                        <Label className="text-xs uppercase font-black tracking-[0.2em] text-zinc-500">Gross Material Input (kg/g)</Label>
                        <Input 
                          type="number" 
                          value={inputQty}
                          onChange={(e) => setInputQty(Number(e.target.value))}
                          className="h-24 bg-white border-gray-200 text-5xl font-black font-sans text-emerald-500 px-6 focus-visible:ring-emerald-500"
                        />
                     </div>
                     
                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-black text-zinc-500 flex items-center justify-between">
                           GOOD RESULT <CheckCircle2 className="h-3 w-3" />
                        </Label>
                        <Input 
                          type="number" 
                          value={goodQty}
                          onChange={(e) => setGoodQty(Number(e.target.value))}
                           className="h-20 bg-white border-gray-200 text-3xl font-black font-sans text-gray-900 px-5"
                        />
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase font-black text-zinc-500 flex items-center justify-between">
                           REJECT <AlertTriangle className="h-3 w-3" />
                        </Label>
                        <Input 
                          type="number" 
                          value={rejectQty}
                          onChange={(e) => setRejectQty(Number(e.target.value))}
                          className="h-20 bg-white border-gray-200 text-3xl font-black font-sans text-red-500 px-5"
                        />
                     </div>

                     <div className="space-y-3 col-span-2">
                        <Label className="text-[10px] uppercase font-black text-zinc-500 flex items-center justify-between">
                           QUARANTINE <Beaker className="h-3 w-3" />
                        </Label>
                        <Input 
                          type="number" 
                          value={quarantineQty}
                          onChange={(e) => setQuarantineQty(Number(e.target.value))}
                          className="h-20 bg-white border-gray-200 text-3xl font-black font-sans text-amber-500 px-5"
                        />
                     </div>
                  </div>

                  {!isWithinTolerance && (
                    <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center gap-6 animate-in shake duration-500">
                       <AlertTriangle className="h-10 w-10 text-red-500 shrink-0" />
                       <div>
                          <p className="text-lg font-black text-red-500 uppercase tracking-tighter italic">Selisih Material Terlalu Besar!</p>
                          <p className="text-xs text-red-400 font-medium uppercase mt-1 opacity-80 font-sans">Input: {inputQty} | Output: {totalOutput} | Delta: {difference.toFixed(2)}</p>
                       </div>
                    </div>
                  )}

                  <Button 
                    disabled={!isWithinTolerance || logStepMutation.isPending || inputQty <= 0}
                    className={`w-full h-24 text-2xl font-black uppercase tracking-[0.3em] italic transition-all shadow-2xl ${
                      isWithinTolerance 
                      ? "bg-white text-black hover:bg-emerald-500 hover:text-white"
                       : "bg-white text-gray-400 opacity-50"
                    }`}
                    onClick={() => {
                        if (!selectedPlan || !activeStage) return;
                        logStepMutation.mutate({
                          wo_id: selectedPlan.id,
                          stage: activeStage,
                          input_qty: inputQty,
                          qty_result: goodQty,
                          qty_reject: rejectQty,
                          qty_quarantine: quarantineQty
                        });
                    }}
                  >
                     {logStepMutation.isPending ? "TRANSMITTING DATA..." : "SUBMIT STAGE RESULT"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

