"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  QrCode, 
  Play, 
  CheckCircle2, 
  Thermometer, 
  Gauge, 
  Clock, 
  Info,
  ChevronRight,
  AlertOctagon,
  Settings,
  User,
  Zap,
  ArrowLeft,
  X,
  FlaskConical,
  ShieldCheck,
  ClipboardList,
  PenTool
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input as UIInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/hooks/useWakeLock";
import { IndustrialNumpad } from "@/components/production/IndustrialNumpad";
import { toast } from "sonner";

export default function MixingTerminalV4() {
  useWakeLock();
  const queryClient = useQueryClient();
  
  // Phase States
  const [activePhase, setActivePhase] = useState("A");
  const [isScanning, setIsScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isProductionActive, setIsProductionActive] = useState(false);

  // Numpad States
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState("");
  const [numpadLabel, setNumpadLabel] = useState("");
  const [numpadUnit, setNumpadUnit] = useState("");
  const [activeInput, setActiveInput] = useState<"TEMP" | "RPM" | "RESULT" | "DOWNTIME" | null>(null);

  // QC States
  const [isQCModalOpen, setIsQCModalOpen] = useState(false);
  const [qcData, setQCData] = useState({
    phValue: "",
    viscosityValue: "",
    organoleptic: true,
    notes: ""
  });

  // Actual Values
  const [actualTemp, setActualTemp] = useState("0");
  const [actualRPM, setActualRPM] = useState("0");
  const [resultQty, setResultQty] = useState("");
  const [downtimeMinutes, setDowntimeMinutes] = useState("0");

  // Tolerance PIN States
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [pendingActuals, setPendingActuals] = useState<any>(null);
  const [supervisorPin, setSupervisorPin] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isProductionActive) return;
    const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isProductionActive]);

  // Fetch active mixing schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["mixing-schedules"],
    queryFn: async () => {
      const res = await api.get("/production/schedules?stage=MIXING");
      return res.data;
    }
  });

  const activeSchedule = schedules?.find((s: any) => s.status === "IN_PROGRESS") || schedules?.[0];

  const submitActualsMutation = useMutation({
    mutationFn: async (data: any) => api.post(`/production/schedules/${activeSchedule.id}/actuals`, data),
    onSuccess: () => {
      toast.success("Material actual quantity recorded.");
      queryClient.invalidateQueries({ queryKey: ["mixing-schedules"] });
      setIsScanning(false);
      setIsSupervisorModalOpen(false);
      setSupervisorPin("");
      setPendingActuals(null);
    },
    onError: (err: any) => {
      if (err.response?.data?.code === 'TOLERANCE_EXCEEDED') {
        toast.warning("Weight Tolerance Exceeded", {
          description: err.response.data.message
        });
        setIsSupervisorModalOpen(true);
      } else {
        toast.error("Submission Failed", {
          description: err.response?.data?.message || "Check terminal connection."
        });
      }
      setIsScanning(false);
    }
  });

  const reportBreakdownMutation = useMutation({
    mutationFn: async (notes: string) => api.post("/production/breakdown", {
      workOrderId: activeSchedule.workOrderId,
      stage: "MIXING",
      machineId: activeSchedule.machineId,
      notes
    }),
    onSuccess: () => {
      toast.error("EMERGENCY STOP REGISTERED", {
        description: "Maintenance team has been notified. Terminal locked.",
        icon: <AlertOctagon className="text-rose-500" />
      });
      setIsProductionActive(false);
    }
  });

  const submitResultMutation = useMutation({
    mutationFn: async (data: { resultQty: number; notes?: string; elapsedSeconds?: number; downtimeMinutes?: number }) => 
      api.post(`/production/schedules/${activeSchedule.id}/result`, data),
    onSuccess: () => {
      toast.success("Mixing result submitted. Stage finalized.");
      queryClient.invalidateQueries({ queryKey: ["mixing-schedules"] });
      setIsProductionActive(false);
    }
  });

  const verifyQCMutation = useMutation({
    mutationFn: async (data: any) => api.post("/production/qc/verify", data),
    onSuccess: () => {
      toast.success("QC Audit Signed & Verified.");
      queryClient.invalidateQueries({ queryKey: ["mixing-schedules"] });
      setIsQCModalOpen(false);
      // Now we can finalize
      submitResultMutation.mutate({ 
        resultQty: Number(resultQty) || activeSchedule.targetQty,
        notes: `QC PASS: PH ${qcData.phValue}, VISC ${qcData.viscosityValue}`,
        elapsedSeconds: elapsedTime,
        downtimeMinutes: Number(downtimeMinutes)
      });
    },
    onError: (err: any) => {
      toast.error("QC Verification Failed", {
        description: err.response?.data?.message || "Check your officer credentials."
      });
    }
  });

  const openNumpad = (label: string, unit: string, currentVal: string, type: "TEMP" | "RPM" | "RESULT" | "DOWNTIME") => {
    setNumpadLabel(label);
    setNumpadUnit(unit);
    setNumpadValue(currentVal);
    setActiveInput(type);
    setIsNumpadOpen(true);
  };

  const handleNumpadConfirm = () => {
    if (activeInput === "TEMP") setActualTemp(numpadValue);
    if (activeInput === "RPM") setActualRPM(numpadValue);
    if (activeInput === "RESULT") setResultQty(numpadValue);
    if (activeInput === "DOWNTIME") setDowntimeMinutes(numpadValue);
    setIsNumpadOpen(false);
  };

  const [manualQrInput, setManualQrInput] = useState("");
  const [pendingScan, setPendingScan] = useState<{ detailId: string; theoretical: number } | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [breakdownReason, setBreakdownReason] = useState("");

  const handleScanMaterial = (detailId: string, theoretical: number) => {
    setPendingScan({ detailId, theoretical });
    setManualQrInput("");
    setIsScanning(true);
  };

  const confirmQrScan = () => {
    if (!pendingScan) return;
    const data = {
      actuals: [{ 
        detailId: pendingScan.detailId, 
        qtyActual: pendingScan.theoretical,
        inventoryId: manualQrInput || undefined 
      }]
    };
    setPendingActuals(data);
    setIsScanning(false);
    submitActualsMutation.mutate(data);
  };

  const handleSupervisorOverride = (pin: string) => {
    if (!pendingActuals) return;
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};
    submitActualsMutation.mutate({
      ...pendingActuals,
      supervisorPin: pin,
      supervisorId: user.id || "MANAGER_ID"
    });
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic">INITIALIZING TERMINAL...</div>;
  if (!activeSchedule) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic">NO ACTIVE MIXING SCHEDULES FOUND.</div>;

  const materials = activeSchedule.stepDetails || [];
  const activeMaterial = materials.find((m: any) => !m.qtyActual);
  const isFinished = materials.every((m: any) => m.qtyActual > 0);

  return (
    <div className="min-h-screen bg-[#000000] text-[#E0E0E0] p-0 font-sans flex flex-col overflow-hidden select-none">
      {/* Top Status Bar */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#050505] z-50">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
              MIXING <span className="text-[#d4af37]">STATION 01</span>
            </h1>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Industrial Execution Terminal V4.0</span>
          </div>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
          <div className="flex items-center gap-4">
             <Badge className="bg-white/5 text-[#d4af37] border border-[#d4af37]/30 px-4 py-1.5 font-black text-[10px] tracking-tight rounded-lg">
                BATCH: {activeSchedule.scheduleNumber}
             </Badge>
             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-500 uppercase">System Online</span>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Live Clock</span>
              <span className="text-sm font-black italic uppercase tracking-tighter tabular-nums">
                 {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
           </div>
           <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <Settings className="w-5 h-5 text-white/20" />
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Formulation Checklist */}
        <section className="w-[38%] border-r border-white/5 bg-[#050505] p-10 overflow-y-auto custom-scrollbar">
          <div className="mb-10 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-[#d4af37]" />
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">R&D Formulation</h2>
             </div>
             <Badge className="bg-[#d4af37]/10 text-[#d4af37] border-none text-[8px] font-black px-3 py-1">
               {activeSchedule.workOrder?.woNumber}
             </Badge>
          </div>

          <div className="space-y-4">
            {materials.map((m: any) => (
              <MaterialInstructionItem 
                key={m.id} 
                name={m.material?.name} 
                target={`${m.qtyTheoretical.toLocaleString()} KG`} 
                status={m.qtyActual ? 'completed' : activeMaterial?.id === m.id ? 'active' : 'pending'} 
              />
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8 mt-10">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-center">Target Specifications</h3>
             <div className="grid grid-cols-2 gap-px bg-white/5">
                <div className="bg-[#050505] p-6 flex flex-col items-center text-center space-y-2">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Target Qty</span>
                   <p className="text-3xl font-black italic tracking-tighter">{activeSchedule.targetQty} <span className="text-[10px] text-white/20 uppercase">KG</span></p>
                </div>
                <div className="bg-[#050505] p-6 flex flex-col items-center text-center space-y-2">
                   <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Upscale</span>
                   <p className="text-3xl font-black italic tracking-tighter">+{activeSchedule.upscalePercent || 0}<span className="text-[10px] text-white/20 uppercase">%</span></p>
                </div>
             </div>
          </div>
        </section>

        {/* RIGHT PANEL: Execution */}
        <section className="flex-1 p-12 bg-[#000000] flex flex-col relative">
            {isScanning && (
              <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-20 animate-in fade-in duration-500">
                 <button onClick={() => { setIsScanning(false); setPendingScan(null); }} className="absolute top-10 right-10 w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white hover:bg-white/10">
                    <X className="w-8 h-8" />
                 </button>
                 <div className="w-full max-w-2xl aspect-square border-4 border-[#d4af37]/20 rounded-[4rem] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4af37]/5 to-transparent animate-scan" />
                    <div className="absolute inset-20 border-2 border-dashed border-[#d4af37]/40 rounded-[2rem] flex items-center justify-center">
                       <QrCode className="w-40 h-40 text-[#d4af37]/20" />
                    </div>
                 </div>
                 <h3 className="mt-12 text-3xl font-black italic tracking-tighter uppercase text-[#d4af37]">Scan Material QR</h3>
                 <p className="mt-4 text-white/40 font-bold uppercase tracking-widest text-xs">QR for: {activeMaterial?.material?.name}</p>
                 <div className="mt-8 w-full max-w-md space-y-4">
                   <UIInput
                     value={manualQrInput}
                     onChange={(e) => setManualQrInput(e.target.value)}
                     placeholder="Scan or enter Inventory ID manually..."
                     className="h-16 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-lg font-bold placeholder:text-white/20"
                     autoFocus
                   />
                   <button
                     onClick={confirmQrScan}
                     className="w-full h-14 bg-[#d4af37] text-black font-black uppercase rounded-2xl text-sm tracking-wider hover:bg-[#d4af37]/90 transition-all"
                   >
                     Confirm & Submit
                   </button>
                 </div>
              </div>
            )}

           <div className="flex justify-between items-start mb-16">
              <div className="space-y-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">Active Execution</span>
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">STAGE <span className="text-white/20">/</span> MIXING</h2>
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <User className="w-4 h-4 text-[#d4af37]" />
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-white/30 uppercase leading-none">Terminal Operator</span>
                    <span className="text-xs font-black uppercase italic tracking-tight">System Terminal</span>
                </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center space-y-12">
              <div 
                onClick={() => {
                  if (isFinished) return setIsProductionActive(!isProductionActive);
                  setIsScanning(true);
                  setTimeout(() => handleScanMaterial(activeMaterial.id, activeMaterial.qtyTheoretical), 2000);
                }}
                className={cn(
                  "w-full max-w-xl p-12 border-2 rounded-[4rem] bg-[#0A0A0A] relative overflow-hidden group cursor-pointer transition-all duration-500 active:scale-95",
                  activeMaterial ? "border-[#d4af37]/30 shadow-[0_0_80px_rgba(212,175,55,0.08)]" : "border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.08)]"
                )}
              >
                 <div className="relative z-10 flex flex-col items-center text-center space-y-10">
                    <div className={cn(
                      "w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-2xl transition-transform duration-700",
                      activeMaterial ? "bg-[#d4af37] shadow-[#d4af37]/40" : "bg-emerald-500 shadow-emerald-500/40"
                    )}>
                       {activeMaterial ? <QrCode className="w-16 h-16 text-black" /> : <Zap className="w-16 h-16 text-black fill-black" />}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-white">
                         {activeMaterial ? "SCAN NEXT MATERIAL" : isProductionActive ? "MIXING IN PROGRESS" : "START MIXING CYCLE"}
                       </h3>
                       <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                          {activeMaterial ? `Requirement: ${activeMaterial.material?.name}` : "Formula verified. Stabilize agitator speed."}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="w-full grid grid-cols-4 gap-8 max-w-5xl">
                 <MetricDisplay label="Temp Aktual" value={actualTemp} unit="°C" status={Number(actualTemp) > 70 ? 'ok' : 'warning'} onClick={() => openNumpad("Temp Aktual", "°C", actualTemp, "TEMP")} />
                 <MetricDisplay label="RPM Aktual" value={actualRPM} unit="RPM" status={Number(actualRPM) > 1000 ? 'ok' : 'warning'} onClick={() => openNumpad("RPM Aktual", "RPM", actualRPM, "RPM")} />
                 <MetricDisplay label="Actual Yield" value={resultQty || "0"} unit="KG" status="ok" onClick={() => openNumpad("Actual Yield", "KG", resultQty, "RESULT")} />
                 <MetricDisplay label="Downtime" value={downtimeMinutes} unit="MIN" status={Number(downtimeMinutes) > 0 ? 'warning' : 'ok'} onClick={() => openNumpad("Total Downtime", "MIN", downtimeMinutes, "DOWNTIME")} />
              </div>
           </div>

           <footer className="h-40 border-t border-white/5 flex items-center gap-10">
              <div className="h-24 px-10 bg-white/[0.03] rounded-[2rem] border border-white/5 flex items-center gap-6 group hover:border-rose-500/30 transition-all flex-1">
                 <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <AlertOctagon className="w-6 h-6 text-rose-500" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Protocol</span>
                    <span className="text-xs font-black uppercase text-rose-500 italic">Emergency Machine Stop</span>
                 </div>
                   <button 
                    onClick={() => { setBreakdownReason(""); setIsBreakdownModalOpen(true); }}
                    className="ml-auto bg-rose-600 text-white text-[10px] font-black uppercase px-6 py-3 rounded-xl hover:bg-rose-500 transition-all"
                  >
                    TRIGGER STOP
                  </button>
              </div>

              <button 
                onClick={() => {
                  if (!isFinished) return toast.error("Complete all material scans first.");
                  submitResultMutation.mutate({ resultQty: activeSchedule.targetQty });
                }}
                className={cn(
                "h-24 px-16 rounded-[2rem] font-black italic uppercase text-lg flex items-center gap-4 transition-all group overflow-hidden",
                isFinished ? "bg-[#d4af37] text-black shadow-xl" : "bg-white/5 text-white/10 cursor-not-allowed"
              )}>
                 Finalize Mixing <ChevronRight className="w-6 h-6" />
              </button>
           </footer>
        </section>
      </main>

      {isNumpadOpen && (
        <IndustrialNumpad
          value={numpadValue}
          onChange={setNumpadValue}
          onConfirm={handleNumpadConfirm}
          onClose={() => setIsNumpadOpen(false)}
          label={numpadLabel}
          unit={numpadUnit}
        />
      )}

      {isSupervisorModalOpen && (
        <IndustrialNumpad
          value={supervisorPin}
          onChange={setSupervisorPin}
          onConfirm={() => handleSupervisorOverride(supervisorPin)}
          onClose={() => setIsSupervisorModalOpen(false)}
          label="Supervisor PIN Required"
          unit="AUTH"
          isPassword
        />
      )}

      {isBreakdownModalOpen && (
        <Dialog open={isBreakdownModalOpen} onOpenChange={setIsBreakdownModalOpen}>
          <DialogContent className="bg-black border border-white/10 rounded-[2rem] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-rose-500">EMERGENCY STOP</DialogTitle>
              <DialogDescription className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Enter breakdown reason to register the stop protocol.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <textarea
                value={breakdownReason}
                onChange={(e) => setBreakdownReason(e.target.value)}
                placeholder="Describe the issue causing the emergency stop..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold placeholder:text-white/20 resize-none"
                autoFocus
              />
            </div>
            <DialogFooter>
              <button onClick={() => setIsBreakdownModalOpen(false)} className="px-6 py-3 rounded-xl bg-white/5 text-white font-black uppercase text-[10px]">Cancel</button>
              <button
                onClick={() => {
                  if (breakdownReason) reportBreakdownMutation.mutate(breakdownReason);
                  setIsBreakdownModalOpen(false);
                }}
                className="px-6 py-3 rounded-xl bg-rose-600 text-white font-black uppercase text-[10px] hover:bg-rose-500"
              >
                Confirm Stop
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .animate-scan { animation: scan 3s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

function MaterialInstructionItem({ name, target, status }: any) {
   const isCompleted = status === 'completed';
   const isActive = status === 'active';
   return (
      <div className={cn(
        "flex items-center justify-between p-6 rounded-2xl border transition-all duration-500",
        isCompleted ? "bg-emerald-500/[0.02] border-emerald-500/10 opacity-40" : 
        isActive ? "bg-[#d4af37]/[0.05] border-[#d4af37]/30" : "bg-white/[0.02] border-white/5"
      )}>
         <div className="flex items-center gap-5">
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-all", isCompleted ? "bg-emerald-500 text-black" : isActive ? "bg-[#d4af37] text-black" : "bg-white/5")}>
               {isCompleted ? <CheckCircle2 size={14} className="stroke-[3px]" /> : <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-black" : "bg-white/20")} />}
            </div>
            <div className="flex flex-col">
               <span className={cn("text-xs font-bold uppercase tracking-tight", isCompleted ? "text-emerald-500/50 line-through" : "text-white")}>{name}</span>
               {isActive && <span className="text-[8px] font-black uppercase text-[#d4af37] tracking-[0.2em] mt-1">Ready for Scan</span>}
            </div>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-sm font-black italic tracking-tighter tabular-nums">{target}</span>
            <span className="text-[7px] font-black uppercase text-white/20 tracking-widest mt-1">Required</span>
         </div>
      </div>
   );
}

function MetricDisplay({ label, value, unit, status, onClick }: any) {
  return (
    <div className={cn("flex flex-col items-center space-y-4", onClick && "cursor-pointer")} onClick={onClick}>
       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{label}</span>
       <div className={cn("w-full h-28 rounded-[2.5rem] bg-white/[0.03] border flex flex-col items-center justify-center relative overflow-hidden transition-all", status === 'active' ? "border-[#d4af37]/40" : status === 'warning' ? "border-rose-500/40" : "border-white/5")}>
          <span className={cn("text-4xl font-black italic tracking-tighter tabular-nums", status === 'active' || status === 'ok' ? "text-white" : "text-rose-500")}>{value}</span>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">{unit}</span>
       </div>
    </div>
  );
}

