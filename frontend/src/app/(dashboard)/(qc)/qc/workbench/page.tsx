"use client";
export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { 
  QrCode, 
  Search, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  AlertOctagon,
  Microscope,
  Database,
  ArrowLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CheckItem = ({ label }: { label: string }) => (
  <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
     <div className="w-6 h-6 rounded-lg border-2 border-white/20 group-hover:border-blue-500 flex items-center justify-center transition-colors">
        <CheckCircle2 className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
     </div>
     <span className="text-xs font-bold text-slate-300 leading-tight">{label}</span>
  </div>
);

export default function QCWorkbenchPage() {
  const [scanValue, setScanValue] = useState("");
  const [context, setContext] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    status: "GOOD" as "GOOD" | "REJECTED",
    goodQty: 0,
    rejectQty: 0,
    reason: "",
    ph: undefined as number | undefined,
    viscosity: undefined as number | undefined,
    organoleptic: "PASS",
    fillingWeight: undefined as number | undefined,
    sealingCheck: "PASS",
    labelingCheck: "PASS",
  });

  const handleResolve = async () => {
    if (!scanValue) return;
    setIsScanning(true);
    try {
      const res = await api.get(`/production/qr/resolve/${scanValue}`);
      setContext(res.data);
      // Reset form on context change
      setFormData({
        status: "GOOD",
        goodQty: 0,
        rejectQty: 0,
        reason: "",
        ph: undefined,
        viscosity: undefined,
        organoleptic: "PASS",
        fillingWeight: undefined,
        sealingCheck: "PASS",
        labelingCheck: "PASS",
      });
      toast.success("Context Identified: " + res.data.type);
    } catch (err) {
      toast.error("Invalid QR Code or No Context Found");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        status: formData.status,
        notes: formData.reason,
        ph: formData.ph,
        viscosity: formData.viscosity,
        organoleptic: formData.organoleptic,
        fillingWeight: formData.fillingWeight,
        sealingCheck: formData.sealingCheck,
        // Map context reference to the correct backend field
        stepLogId: context.type === 'PRODUCTION_QC' ? context.reference : undefined,
        inventoryId: context.type === 'MATERIAL_QC' ? context.reference : undefined,
      };

      await api.post("/qc/audits", payload);
      toast.success("QC Audit Finalized & Stock Synchronized!");
      setContext(null);
      setScanValue("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to finalize audit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateLossPreview = () => {
    if (formData.rejectQty <= 0) return 0;
    return formData.rejectQty * 15000 + 50000; 
  };

  if (!context) {
    return (
      <div className="h-[90vh] flex flex-col items-center justify-center p-8 bg-[#0F172A] text-white overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-12 max-w-xl w-full relative z-10"
        >
          <div className="relative inline-block group">
             <div className="absolute -inset-8 bg-blue-600/30 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="w-32 h-32 bg-slate-900 border border-white/10 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative">
                <QrCode className="w-16 h-16 text-blue-400" />
             </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
              QC INTEGRITY WORKBENCH
            </h1>
            <p className="text-slate-400 text-sm font-black uppercase tracking-[0.4em]">Initialize real-time inspection terminal</p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <Input 
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
                placeholder="SCAN QR CODE / INPUT UUID..."
                className="pl-16 h-20 bg-white/5 border-white/10 rounded-3xl font-black text-2xl tracking-widest text-blue-400 placeholder:text-slate-700 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <Button 
              onClick={handleResolve}
              disabled={isScanning || !scanValue}
              className="w-full h-20 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isScanning ? "IDENTIFYING..." : "START INSPECTION"}
            </Button>
          </div>

          <div className="flex justify-center gap-12 pt-12 opacity-30">
             <div className="flex flex-col items-center gap-3">
                <Database className="w-6 h-6 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Global Sync</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Audit Secure</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <Microscope className="w-6 h-6 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Lab Grade</span>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      {/* PREMIUM HEADER */}
      <div className="bg-slate-900 text-white p-8 sticky top-0 z-50 shadow-2xl border-b border-white/5">
         <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-8">
               <button 
                 onClick={() => setContext(null)} 
                 className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all group"
               >
                  <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
               </button>
               <div className="h-10 w-[2px] bg-white/10" />
               <div>
                  <div className="flex items-center gap-4 mb-1">
                     <h2 className="text-2xl font-black tracking-tight">{context.title}</h2>
                     <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-[10px] px-3 py-1 rounded-lg uppercase">
                        {context.type}
                     </Badge>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.3em]">
                     {context.origin} • REF: <span className="text-blue-500">{context.reference}</span>
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Protocol</p>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-tighter">ISO-9001 Compliance Active</p>
               </div>
               <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-lg text-blue-400 shadow-inner">
                 QC
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto p-12 grid grid-cols-12 gap-12">
         {/* LEFT: INSPECTION DYNAMICS */}
         <div className="col-span-8 space-y-12">
            <Card className="p-10 border-none shadow-xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
               
               <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                       <Microscope className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Phase Diagnostics</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Submit Lab Verified Parameters</p>
                    </div>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                     <button 
                       onClick={() => setFormData({...formData, status: "GOOD"})}
                       className={cn(
                         "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                         formData.status === "GOOD" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-600"
                       )}
                     >
                        Release
                     </button>
                     <button 
                       onClick={() => setFormData({...formData, status: "REJECTED"})}
                       className={cn(
                         "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                         formData.status === "REJECTED" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-slate-400 hover:text-slate-600"
                       )}
                     >
                        Reject
                     </button>
                  </div>
               </div>

               {/* DYNAMIC FORM FIELDS */}
               <div className="grid grid-cols-2 gap-10 mb-12">
                  {/* Common: Quantity Input for Inbound/Production Results */}
                  <div className="space-y-4">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">Verification Qty (Actual)</label>
                     <Input 
                        type="number"
                        value={formData.goodQty}
                        onChange={(e) => setFormData({...formData, goodQty: Number(e.target.value)})}
                        className="h-20 rounded-[1.5rem] bg-slate-50 border-none font-black text-3xl px-8 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="0.00"
                     />
                  </div>

                  {/* Stage Specific: Mixing (pH & Viscosity) */}
                  {(context.stage === 'MIXING' || context.type === 'PRODUCTION_QC') && (
                    <>
                      <div className="space-y-4">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">pH Value (Lab)</label>
                         <Input 
                            type="number"
                            step="0.01"
                            value={formData.ph}
                            onChange={(e) => setFormData({...formData, ph: Number(e.target.value)})}
                            className="h-20 rounded-[1.5rem] bg-blue-50/50 border-none font-black text-3xl px-8 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="7.00"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">Viscosity (cPs)</label>
                         <Input 
                            type="number"
                            value={formData.viscosity}
                            onChange={(e) => setFormData({...formData, viscosity: Number(e.target.value)})}
                            className="h-20 rounded-[1.5rem] bg-indigo-50/50 border-none font-black text-3xl px-8 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            placeholder="0"
                         />
                      </div>
                      <div className="space-y-4 col-span-2">
                         <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">Organoleptic Result (Color/Odor/Texture)</label>
                         <Select 
                            value={formData.organoleptic} 
                            onValueChange={(val) => setFormData({...formData, organoleptic: val || "FAIL"})}
                         >
                            <SelectTrigger className="h-20 rounded-[1.5rem] bg-slate-50 border-none font-black text-xl px-8">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                               <SelectItem value="PASS" className="h-14 font-bold text-emerald-600">PASSED - Standard Match</SelectItem>
                               <SelectItem value="FAIL" className="h-14 font-bold text-rose-600">FAILED - Deviation Detected</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                    </>
                  )}

                  {/* Stage Specific: Filling (Weight Sampling) */}
                  {(context.stage === 'FILLING' || context.stage === 'PACKING') && (
                    <div className="space-y-4">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">Sampling Weight (g/mL)</label>
                       <Input 
                          type="number"
                          step="0.1"
                          value={formData.fillingWeight}
                          onChange={(e) => setFormData({...formData, fillingWeight: Number(e.target.value)})}
                          className="h-20 rounded-[1.5rem] bg-amber-50/50 border-none font-black text-3xl px-8 text-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all"
                          placeholder="0.0"
                       />
                    </div>
                  )}
               </div>

               <div className="space-y-4 mb-12">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[.2em] ml-2">Audit Notes / Reason for Rejection</label>
                  <textarea 
                     value={formData.reason}
                     onChange={(e) => setFormData({...formData, reason: e.target.value})}
                     className="w-full min-h-[140px] rounded-[2rem] bg-slate-50 border-none font-bold text-base p-8 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                     placeholder="Detailed analysis of this batch..."
                  />
               </div>

               {/* DIGITAL INTERLOCKS - DYNAMIC BASED ON CONTEXT */}
               <div className="p-8 bg-slate-900 rounded-[2.5rem] mb-12 border border-white/5">
                  <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[.4em] mb-8 flex items-center gap-3">
                     <ShieldAlert className="w-5 h-5" />
                     {context.type === 'MATERIAL_QC' ? 'Incoming Materials Protocol' : 'Batch Production Matrix'}
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                     {context.type === 'MATERIAL_QC' ? (
                       <>
                         {[
                            { label: "COA (Cert of Analysis) Available", id: "coa" },
                            { label: "Packaging/Container Intact", id: "pkg" },
                            { label: "Labeling & Expiry Match PO", id: "lbl" },
                            { label: "Visual Color/Purity Match", id: "vis" }
                         ].map((check, i) => (
                            <CheckItem key={i} label={check.label} />
                         ))}
                       </>
                     ) : (
                       <>
                         {[
                            { label: "Formula Compliance Confirmed", id: "fml" },
                            { label: "Physical Organoleptic PASS", id: "org" },
                            { label: "Coding & Exp Date Valid", id: "exp" },
                            { label: "Weight Tolerance < 1%", id: "wgt" }
                         ].map((check, i) => (
                            <CheckItem key={i} label={check.label} />
                         ))}
                       </>
                     )}
                  </div>
               </div>

               <div className="flex items-center gap-6">
                  <div className="flex-1 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                     <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Zap className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attach Evidence</span>
                  </div>
                  <Button 
                     onClick={handleFinalize}
                     disabled={isSubmitting}
                     className={cn(
                       "flex-[2.5] h-24 rounded-[2rem] font-black uppercase text-sm tracking-[.5em] shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]",
                       formData.status === 'GOOD' ? "bg-slate-900 hover:bg-black text-white" : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                     )}
                  >
                     {isSubmitting ? "SYNCING DATA..." : "FINALIZE AUDIT SIGN-OFF"}
                  </Button>
               </div>
            </Card>
         </div>

         {/* RIGHT: INTELLIGENCE & COMPLIANCE SIDEBAR */}
         <div className="col-span-4 space-y-8">
            <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden relative">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                     <AlertOctagon className="w-5 h-5 text-rose-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">Cost of Poor Quality (Est)</h4>
               </div>
               
               <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-50 pb-5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Loss</span>
                     <span className="text-base font-black text-rose-600">Rp {(formData.rejectQty * 15000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-50 pb-5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Waste</span>
                     <span className="text-base font-black text-rose-600">Rp 50,000</span>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                     <span className="text-xs font-black uppercase text-slate-900 tracking-widest">Total COPQ Impact</span>
                     <span className="text-2xl font-black text-rose-600 tracking-tighter">Rp {calculateLossPreview().toLocaleString()}</span>
                  </div>
               </div>
               
               <div className="mt-8 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 flex gap-4">
                  <Zap className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-[10px] font-bold text-rose-700 leading-relaxed italic">
                    WARNING: High rejection rate detected. Submission will automatically trigger a corrective action report (CAR) for the production lead.
                  </p>
               </div>
            </Card>

            <Card className="p-8 border-none shadow-xl shadow-blue-500/10 rounded-[2.5rem] bg-blue-600 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                     <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Audit Transparency</h4>
               </div>
               <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-6 leading-relaxed opacity-80">Traceability: 100% Secure. Encrypted Signature ready for submission.</p>
               <div className="h-2 w-full bg-blue-400 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="h-full bg-white rounded-full shadow-[0_0_15px_white]" 
                  />
               </div>
               <div className="mt-4 flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                  <span>Blockchain Log</span>
                  <span>Verified</span>
               </div>
            </Card>

            <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-200/50 flex items-start gap-4">
               <ShieldAlert className="w-6 h-6 text-amber-600 mt-1" />
               <div>
                  <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Supervisor PIN Required?</p>
                  <p className="text-[11px] font-bold text-amber-700 leading-relaxed mt-2 italic">
                    For rejection exceeding 10% of batch size, an authorization overlay will appear upon clicking finalize.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

