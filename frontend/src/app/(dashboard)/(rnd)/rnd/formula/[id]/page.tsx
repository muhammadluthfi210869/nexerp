"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ArrowRight,
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Calculator, 
  Beaker,
  ShieldAlert,
  ChevronRight,
  Target,
  Layers,
  Sparkles,
  Info,
  AlertTriangle,
  Lock,
  ChevronDown,
  LayoutDashboard,
  Database,
  History as HistoryIcon,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  FlaskConical
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- TYPES ---
interface FormulaItem {
  id?: string;
  materialId?: string;
  material?: any;
  isDummy: boolean;
  dummyName?: string;
  dummyPrice?: number;
  dosagePercentage: number;
  costSnapshot?: number;
}

interface FormulaPhase {
  id?: string;
  prefix: string;
  customName: string;
  instructions: string;
  order: number;
  items: FormulaItem[];
}

interface FormulaV4 {
  id: string;
  sampleRequestId: string;
  targetYieldGram: number;
  status: string;
  version: number;
  phases: FormulaPhase[];
  qcParameters?: any;
  sampleRequest?: any;
}

export default function FormulationPhaseBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"formula" | "qc" | "lab" | "history">("formula");

  // --- DATA FETCHING ---
  const { data: formula, isLoading } = useQuery<FormulaV4>({
    queryKey: ["formula", id],
    queryFn: async () => (await api.get(`/rnd/formulas/${id}`)).data,
  });

  const { data: versions } = useQuery<any[]>({
    queryKey: ["formula-versions", formula?.sampleRequestId],
    queryFn: async () => (await api.get(`/rnd/samples/${formula?.sampleRequestId}/versions`)).data,
    enabled: !!formula?.sampleRequestId
  });

  const { data: labTests } = useQuery<any[]>({
    queryKey: ["lab-tests", id],
    queryFn: async () => (await api.get(`/rnd/formulas/${id}/lab-tests`)).data,
  });

  const { data: materials = [] } = useQuery<any[]>({
    queryKey: ["materials"],
    queryFn: async () => (await api.get("/master/materials")).data,
  });

  const { data: feedbackHistory } = useQuery<any[]>({
    queryKey: ["sample-feedback", formula?.sampleRequestId],
    enabled: !!formula?.sampleRequestId,
    queryFn: async () => (await api.get(`/rnd/samples/${formula?.sampleRequestId}/feedback`)).data,
  });

  const { data: sampleBrief } = useQuery<any>({
    queryKey: ["sample-brief", formula?.sampleRequestId],
    enabled: !!formula?.sampleRequestId,
    queryFn: async () => (await api.get(`/rnd/samples/${formula?.sampleRequestId}`)).data,
  });

  const { data: inciList } = useQuery<any[]>({
    queryKey: ["formula-inci", id],
    enabled: formula?.status === 'SAMPLE_LOCKED' || formula?.status === 'PRODUCTION_LOCKED',
    queryFn: async () => (await api.get(`/rnd/formulas/${id}/inci`)).data,
  });

  // --- FORM SETUP ---
  const { register, control, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      targetYieldGram: 1000,
      phases: [] as FormulaPhase[],
      qcParameters: {
        targetPh: "",
        targetViscosity: "",
        appearance: "",
        targetColor: "",
        targetAroma: ""
      }
    }
  });

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: "phases",
  });

  useEffect(() => {
    if (formula) {
      reset({
        targetYieldGram: formula.targetYieldGram || 1000,
        phases: formula.phases || [],
        qcParameters: formula.qcParameters || {}
      });
    }
  }, [formula, reset]);

  // --- MUTATIONS ---
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/rnd/formulas/${id}`, data),
    onSuccess: () => {
      toast.success("Formula synced successfully.");
      queryClient.invalidateQueries({ queryKey: ["formula", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Sync failed")
  });

  const requestApprovalMutation = useMutation({
    mutationFn: () => api.post(`/rnd/formulas/${id}/request-approval`),
    onSuccess: () => {
      toast.success("Approval requested. Formula locked for review.");
      queryClient.invalidateQueries({ queryKey: ["formula", id] });
    },
  });

  const revisionMutation = useMutation({
    mutationFn: () => api.post(`/rnd/formulas/${id}/revision`),
    onSuccess: (res) => {
      toast.success("New revision initialized.");
      router.push(`/rnd/formula/${res.data.id}`);
    }
  });

  const lockProductionMutation = useMutation({
    mutationFn: () => api.post(`/rnd/formulas/${id}/lock-production`),
    onSuccess: () => {
      toast.success("Formula LOCKED for Production. Data synced to SCM/Mixing.");
      queryClient.invalidateQueries({ queryKey: ["formula", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Lock failed")
  });

  // --- MATH ENGINE ---
  const watchedPhases = useWatch({ control, name: "phases" });
  const targetYield = useWatch({ control, name: "targetYieldGram" }) || 1000;

  const totalDosage = useMemo(() => {
    let total = 0;
    watchedPhases?.forEach(phase => {
      phase.items?.forEach(item => {
        total += Number(item.dosagePercentage || 0);
      });
    });
    return total;
  }, [watchedPhases]);

  const currentHpp = useMemo(() => {
    let totalHpp = 0;
    watchedPhases?.forEach(phase => {
      phase.items?.forEach(item => {
        const percentage = Number(item.dosagePercentage || 0);
        if (item.isDummy) {
          totalHpp += (percentage / 100) * Number(item.dummyPrice || 0);
        } else {
          const mat = materials.find(m => m.id === item.materialId);
          const price = Number(mat?.movingAvgPrice || mat?.unitPrice || 0);
          totalHpp += (percentage / 100) * price;
        }
      });
    });
    return totalHpp;
  }, [watchedPhases, materials]);

  const onSave = (data: any) => updateMutation.mutate(data);

  const isReadOnly = formula?.status === "PRODUCTION_LOCKED" || formula?.status === "SAMPLE_LOCKED";
  // The user wants direct editing, so we only lock if it's strictly finalized for production/sampling.
  // Otherwise, R&D can iterate directly.

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      <p className="text-xs font-semibold text-slate-400">Loading Workspace...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* --- CLEAN HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => router.back()}
                className="h-10 w-10 rounded-lg border-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                 <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">
                      Formula <span className="text-indigo-600">Builder</span>
                    </h1>
                    
                    <Select value={id as string} onValueChange={(val) => router.push(`/rnd/formula/${val}`)}>
                       <SelectTrigger className="h-7 px-2 bg-slate-100 border-none text-[10px] font-bold rounded-md min-w-[80px]">
                          <SelectValue placeholder={`v${formula?.version}.0`} />
                       </SelectTrigger>
                       <SelectContent>
                          {versions?.map((v: any) => (
                             <SelectItem key={v.id} value={v.id} className="text-xs">
                                v{v.version}.0 {v.status === 'SAMPLE_LOCKED' && '🔒'}
                             </SelectItem>
                          ))}
                       </SelectContent>
                    </Select>

                    <Badge className={cn(
                      "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none",
                      formula?.status === 'DRAFT' ? "bg-amber-100 text-amber-700" : 
                      formula?.status === 'SAMPLE_LOCKED' ? "bg-emerald-100 text-emerald-700" :
                      formula?.status === 'PRODUCTION_LOCKED' ? "bg-slate-900 text-white" :
                      "bg-slate-200 text-slate-600"
                    )}>
                       {formula?.status}
                    </Badge>
                 </div>
                 <p className="text-[11px] font-black text-slate-700 mt-0.5">
                    {formula?.sampleRequest?.productName} • v{formula?.version}.0
                 </p>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                 <TabButton active={activeTab === "formula"} onClick={() => setActiveTab("formula")} label="Composition" />
                 <TabButton active={activeTab === "qc"} onClick={() => setActiveTab("qc")} label="QC Standards" />
                 <TabButton active={activeTab === "lab"} onClick={() => setActiveTab("lab")} label="Lab Results" />
                 <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} label="History" />
              </div>

              <div className="flex gap-2">
                 {formula?.status === 'DRAFT' ? (
                   <Button 
                    onClick={handleSubmit(onSave)}
                    disabled={updateMutation.isPending}
                    className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 rounded-lg shadow-sm"
                   >
                     {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                     Sync Data
                   </Button>
                 ) : (
                   <Button 
                    onClick={() => revisionMutation.mutate()}
                    disabled={revisionMutation.isPending}
                    className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 rounded-lg shadow-sm"
                   >
                     <Plus className="h-4 w-4 mr-2" /> Create Revision
                   </Button>
                 )}

                 {formula?.status === 'SAMPLE_LOCKED' && (
                    <Button 
                     onClick={() => lockProductionMutation.mutate()}
                     disabled={lockProductionMutation.isPending}
                     className="h-10 bg-indigo-600 hover:bg-emerald-600 text-white font-bold text-xs px-4 rounded-lg border-2 border-indigo-100"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Lock Production
                    </Button>
                 )}
              </div>
           </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
        {/* --- MAIN WORKSPACE --- */}
        <div className={cn("lg:col-span-8 space-y-8", isReadOnly && activeTab !== "lab" && activeTab !== "history" && "opacity-90 grayscale-[0.1]")}>
           
           {/* --- DYNAMIC SUMMARY INFO --- */}
           <Card className="rounded-xl border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                 <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-700">Technical Brief Summary</h3>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sample Code</p>
                    <p className="text-xs font-bold text-slate-900">{formula?.sampleRequest?.sampleCode || "-"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Request Date</p>
                    <p className="text-xs font-bold text-slate-900">{formula?.sampleRequest?.requestedAt ? new Date(formula.sampleRequest.requestedAt).toLocaleDateString('id-ID') : "-"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer / Brand</p>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1">{formula?.sampleRequest?.lead?.clientName || "-"} / {formula?.sampleRequest?.lead?.brandName || "-"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Netto / Yield</p>
                    <p className="text-xs font-bold text-indigo-600">{formula?.targetYieldGram?.toLocaleString()} gr</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Formulator (PIC)</p>
                    <p className="text-xs font-bold text-slate-900">{formula?.sampleRequest?.pic?.fullName || "-"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sample Maker</p>
                    <p className="text-xs font-bold text-slate-900">{formula?.sampleRequest?.requester?.fullName || "System Admin"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Product Category</p>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{formula?.sampleRequest?.productName || "Cosmetic Product"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Status</p>
                    <Badge variant="outline" className="text-[9px] font-bold h-5 px-2 bg-slate-100 border-none text-slate-500 rounded uppercase">
                       {formula?.status || "Unknown"}
                    </Badge>
                 </div>
              </div>
           </Card>

           {activeTab === "formula" ? (
             <div className="space-y-6">
                {phaseFields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 gap-4">
                       <div className="text-center">
                          <h4 className="text-sm font-bold text-slate-900">Laboratory Worksheet</h4>
                          <p className="text-xs text-slate-500 mt-1">Start your formulation by initializing the first phase.</p>
                       </div>
                       <Button 
                         onClick={() => appendPhase({ prefix: "A", customName: "Phase A", items: [], instructions: "", order: 0 })}
                         className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 font-bold text-xs h-10 shadow-lg"
                       >
                          <Plus className="h-4 w-4 mr-2" /> Initialize Composition
                       </Button>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {phaseFields.map((field, index) => (
                         <PhaseBlock 
                           key={field.id}
                           phaseIndex={index}
                           control={control}
                           register={register}
                           remove={() => removePhase(index)}
                           materials={materials}
                           targetYield={targetYield}
                           setValue={setValue}
                           isReadOnly={isReadOnly}
                         />
                       ))}
                       
                       {!isReadOnly && (
                         <Button 
                           variant="outline" 
                           onClick={() => appendPhase({ prefix: String.fromCharCode(65 + phaseFields.length), customName: "", items: [], instructions: "", order: phaseFields.length })}
                           className="w-full h-12 border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:bg-white hover:border-indigo-300 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                         >
                           <Plus className="h-4 w-4 mr-2" /> Add Next Phase (Phase {String.fromCharCode(65 + phaseFields.length)})
                         </Button>
                       )}
                    </div>
                 )}
             </div>
           ) : activeTab === "qc" ? (
             <QCParameterEditor register={register} isReadOnly={isReadOnly} />
           ) : activeTab === "history" ? (
                <div className="space-y-6">
                   <h2 className="text-xl font-bold text-slate-900">Evolutionary History</h2>
                   <div className="grid gap-4">
                      {versions?.map((v: any) => (
                        <Card key={v.id} className={cn(
                          "p-5 border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group",
                          v.id === id ? "bg-indigo-50/50 border-indigo-200" : "bg-white"
                        )} onClick={() => router.push(`/rnd/formula/${v.id}`)}>
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                   "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
                                   v.id === id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                 )}>
                                    v{v.version}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-900">Version {v.version}.0 {v.id === id && "(Active)"}</p>
                                    <p className="text-[10px] text-slate-600 uppercase font-black tracking-tight">
                                       {new Date(v.createdAt).toLocaleDateString()} • {v.status}
                                    </p>
                                 </div>
                              </div>
                              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                           </div>
                        </Card>
                      ))}
                   </div>
                </div>
           ) : (
             <LabTestWorkspace formulaId={id as string} tests={labTests || []} qcTarget={formula?.qcParameters} />
           )}
        </div>

        {/* --- SIDEBAR TOOLS --- */}
        <aside className="lg:col-span-4 space-y-6">
           <div className="sticky top-28 space-y-6">
              {/* Math Engine Card */}
              <Card className="rounded-xl border-slate-200 shadow-sm p-6 space-y-6 bg-white">
                 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                       <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-slate-900">Math Engine</h3>
                       <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Live Configuration</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Target Yield (Gram)</Label>
                       <div className="flex items-center gap-3">
                          <Input 
                            type="number" 
                            disabled={isReadOnly}
                            {...register("targetYieldGram", { valueAsNumber: true })}
                            className="h-12 text-xl font-bold bg-slate-50 border-slate-200 rounded-lg focus:bg-white" 
                          />
                          <span className="text-sm font-medium text-slate-400">gr</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Composition Total</span>
                          <span className={cn("text-lg font-bold", totalDosage === 100 ? "text-emerald-600" : "text-rose-600")}>
                             {totalDosage.toFixed(2)}%
                          </span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", totalDosage === 100 ? "bg-emerald-500" : "bg-rose-500")}
                            style={{ width: `${Math.min(100, totalDosage)}%` }}
                          />
                       </div>
                    </div>

                  <div className="pt-4 space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Financial Alignment</span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-bold uppercase",
                            currentHpp > Number(sampleBrief?.targetHpp || 0) ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}>
                            {currentHpp > Number(sampleBrief?.targetHpp || 0) ? "Overbudget" : "Within Budget"}
                          </Badge>
                       </div>
                       <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                          <div className="flex justify-between text-[10px]">
                             <span className="text-slate-500">Target HPP</span>
                             <span className="font-bold text-slate-900">Rp {Number(sampleBrief?.targetHpp || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                             <span className="text-slate-500">Current HPP</span>
                             <span className={cn("font-bold", currentHpp > Number(sampleBrief?.targetHpp || 0) ? "text-rose-600" : "text-emerald-600")}>
                                Rp {currentHpp.toLocaleString()}
                             </span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden mt-2">
                             <div 
                               className={cn("h-full transition-all", currentHpp > Number(sampleBrief?.targetHpp || 0) ? "bg-rose-500" : "bg-emerald-500")}
                               style={{ width: `${Math.min(100, (currentHpp / Number(sampleBrief?.targetHpp || 1)) * 100)}%` }}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              </Card>

              {/* INCI Preview */}
              {(formula?.status === 'SAMPLE_LOCKED' || formula?.status === 'PRODUCTION_LOCKED') && (
                <Card className="rounded-xl border-slate-200 shadow-sm p-6 bg-slate-900 text-white space-y-4">
                   <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest">INCI List (Labeling)</h3>
                   </div>
                   <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-[11px] text-slate-300 leading-relaxed">
                      {inciList?.map(item => item.name).join(", ")}
                   </div>
                   <p className="text-[9px] text-slate-500 font-medium italic text-center">
                      *Auto-sorted by concentration (DESC)
                   </p>
                </Card>
              )}

              {/* Feedback History */}
              {(feedbackHistory && feedbackHistory.length > 0) && (
                <Card className="rounded-xl border-slate-200 shadow-sm p-6 space-y-4 bg-white">
                   <div className="flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">BusDev Feedback</h3>
                   </div>
                   <div className="space-y-4">
                      {feedbackHistory.map((fb: any) => (
                        <div key={fb.id} className="pl-3 border-l-2 border-indigo-100 py-1">
                           <p className="text-[10px] font-bold text-slate-400 mb-1">{new Date(fb.createdAt).toLocaleDateString()}</p>
                           <p className="text-xs text-slate-700 italic">"{fb.feedbackText}"</p>
                        </div>
                      ))}
                   </div>
                </Card>
              )}

              {/* Integrity Checklist */}
              <Card className="rounded-xl border-slate-200 shadow-sm p-6 bg-white space-y-4">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-indigo-600" />
                    Validation
                 </h3>
                 <div className="space-y-3">
                    <CheckItem label="Total Percentage (100%)" checked={totalDosage === 100} />
                    <CheckItem label="No Empty Phases" checked={watchedPhases?.every(p => p.items?.length > 0)} />
                 </div>
              </Card>
           </div>
        </aside>
      </main>

      {/* --- FLOATING ACTION BAR --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40">
         <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  R&D
               </div>
               <div className="hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol V4.2</p>
                  <p className="text-xs font-medium text-slate-600 italic">Scientific compliance mode active.</p>
               </div>
            </div>
            
            <div className="flex gap-3">
               {formula?.status === 'DRAFT' && (
                  <Button 
                    onClick={() => requestApprovalMutation.mutate()}
                    disabled={totalDosage !== 100 || requestApprovalMutation.isPending}
                    className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-8 rounded-lg shadow-md transition-all"
                  >
                     Request Manager Approval
                  </Button>
               )}
               {formula?.status !== 'DRAFT' && (
                  <Button 
                    onClick={() => revisionMutation.mutate()}
                    className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-8 rounded-lg shadow-md transition-all"
                  >
                     Unlock for New Revision
                  </Button>
               )}
            </div>
         </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all",
        active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
      )}
    >
      {label}
    </button>
  );
}

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-[11px] font-medium text-slate-600">{label}</span>
       {checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-rose-400" />}
    </div>
  );
}

function PhaseBlock({ phaseIndex, control, register, remove, materials, targetYield, setValue, isReadOnly }: any) {
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: `phases.${phaseIndex}.items`,
  });

  const watchedItems = useWatch({ control, name: `phases.${phaseIndex}.items` });
  const phasePrefix = useWatch({ control, name: `phases.${phaseIndex}.prefix` });

  const phaseWeight = useMemo(() => {
    return watchedItems?.reduce((acc: number, item: any) => acc + (Number(item.dosagePercentage || 0) / 100) * targetYield, 0) || 0;
  }, [watchedItems, targetYield]);

  return (
    <Card className="rounded-xl border-slate-200 shadow-sm bg-white overflow-hidden">
       {/* Phase Header */}
       <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-sm">
                {phasePrefix}
             </div>
             <Input 
               disabled={isReadOnly}
               {...register(`phases.${phaseIndex}.customName`)}
               placeholder="e.g., Oil Phase / Water Phase"
               className="h-9 w-64 bg-transparent border-none font-bold text-sm focus:ring-0 px-0 placeholder:text-slate-300"
             />
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight leading-none">Phase Load</p>
                <p className="text-sm font-black text-slate-900">{phaseWeight.toFixed(2)} gr</p>
             </div>
             {!isReadOnly && (
               <Button variant="ghost" size="icon" onClick={remove} className="text-slate-300 hover:text-rose-500 h-8 w-8">
                  <Trash2 className="h-4 w-4" />
               </Button>
             )}
          </div>
       </div>

       {/* Phase Table */}
       <table className="w-full text-left">
          <thead>
             <tr className="bg-white border-b border-slate-50">
                <th className="py-3 pl-6 text-[10px] font-black uppercase tracking-tight text-slate-700">Ingredient Protocol</th>
                <th className="py-3 text-[10px] font-black uppercase tracking-tight text-slate-700 text-right w-32">Dosage (%)</th>
                <th className="py-3 text-[10px] font-black uppercase tracking-tight text-slate-700 text-right w-24">Weight (gr)</th>
                <th className="py-3 text-[10px] font-black uppercase tracking-tight text-slate-700 text-right w-28">Est. Cost</th>
                {!isReadOnly && <th className="w-12"></th>}
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
             {itemFields.map((item, idx) => (
                <IngredientRow 
                  key={item.id}
                  phaseIndex={phaseIndex}
                  itemIndex={idx}
                  control={control}
                  register={register}
                  remove={() => removeItem(idx)}
                  materials={materials}
                  targetYield={targetYield}
                  setValue={setValue}
                  isReadOnly={isReadOnly}
                />
             ))}
          </tbody>
       </table>

       {/* Phase Footer */}
       <div className="p-4 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
             <Label className="text-[10px] font-black uppercase tracking-tight text-slate-600 mb-1.5 block">Phase Instructions</Label>
             <Input 
               disabled={isReadOnly}
               {...register(`phases.${phaseIndex}.instructions`)}
               className="h-10 bg-white border-slate-200 text-xs rounded-lg"
               placeholder="e.g. Mix until homogenous at 70C..." 
             />
          </div>
          {!isReadOnly && (
            <div className="flex gap-2 w-full md:w-auto">
               <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendItem({ materialId: "", isDummy: false, dosagePercentage: 0 })}
                className="h-10 border-slate-200 text-[10px] font-bold uppercase tracking-wider rounded-lg flex-1"
               >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Material
               </Button>
               <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendItem({ materialId: "", isDummy: true, dummyName: "New Active", dummyPrice: 0, dosagePercentage: 0 })}
                className="h-10 border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex-1"
               >
                  <FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Add Dummy
               </Button>
            </div>
          )}
       </div>
    </Card>
  );
}

function IngredientRow({ phaseIndex, itemIndex, control, register, remove, materials, targetYield, setValue, isReadOnly }: any) {
  const item = useWatch({ control, name: `phases.${phaseIndex}.items.${itemIndex}` });
  
  const material = useMemo(() => {
    if (item?.isDummy) return null;
    return materials.find((m: any) => m.id === item?.materialId);
  }, [item?.materialId, item?.isDummy, materials]);

  const weight = (Number(item?.dosagePercentage || 0) / 100) * targetYield;

  const hpp = useMemo(() => {
    const percentage = Number(item?.dosagePercentage || 0);
    if (item?.isDummy) {
      return (percentage / 100) * Number(item?.dummyPrice || 0);
    }
    const price = Number(material?.movingAvgPrice || material?.unitPrice || 0);
    return (percentage / 100) * price;
  }, [item?.dosagePercentage, item?.isDummy, item?.dummyPrice, material]);

  return (
    <tr className="group hover:bg-slate-50 transition-colors">
       <td className="py-4 pl-6">
          {item?.isDummy ? (
            <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-bold uppercase px-1.5">DUMMY</Badge>
                  <Input 
                    disabled={isReadOnly}
                    {...register(`phases.${phaseIndex}.items.${itemIndex}.dummyName`)}
                    className="h-8 bg-transparent border-slate-200 text-xs font-bold w-48 rounded-md" 
                  />
               </div>
               <div className="flex items-center gap-2 pl-12">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Est. Price: Rp</span>
                  <Input 
                    type="number"
                    disabled={isReadOnly}
                    {...register(`phases.${phaseIndex}.items.${itemIndex}.dummyPrice`, { valueAsNumber: true })}
                    className="h-6 w-24 bg-transparent border-slate-200 text-[10px] font-bold rounded-md" 
                  />
               </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                  <Beaker className="h-4 w-4" />
               </div>
                <Select 
                  disabled={isReadOnly}
                  value={item?.materialId} 
                  onValueChange={(val) => {
                    setValue(`phases.${phaseIndex}.items.${itemIndex}.materialId`, val);
                    const mat = materials.find((m: any) => m.id === val);
                    if (mat) {
                      setValue(`phases.${phaseIndex}.items.${itemIndex}.costSnapshot`, Number(mat.movingAvgPrice || mat.unitPrice || 0));
                    }
                  }}
                >
                  <SelectTrigger className="h-10 bg-transparent border-slate-200 text-xs font-bold min-w-[280px] rounded-lg">
                     <SelectValue placeholder="Search Material..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 w-[400px]">
                     <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
                        <Input 
                          placeholder="Search INCI, Name, or Function..." 
                          className="h-8 text-[10px] bg-white"
                          onChange={(e) => {
                            // Local filtering could be added here
                          }}
                        />
                     </div>
                     {materials.filter((m: any) => m.category === 'CHEMICAL' || m.type === 'RAW_MATERIAL' || true).map((m: any) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs py-3">
                           <div className="flex justify-between items-start w-full gap-4">
                              <div className="flex flex-col gap-0.5">
                                 <span className="font-bold text-slate-900">{m.name}</span>
                                 <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                                    {m.category?.name || "Uncategorized"} • {m.sku}
                                 </span>
                                 <span className="text-[10px] text-indigo-600/70 italic font-medium">
                                    {m.description?.substring(0, 40) || "No technical description available"}...
                                 </span>
                              </div>
                              <div className="text-right">
                                 <span className="text-[11px] font-bold text-emerald-600 block">Rp {Number(m.movingAvgPrice || m.unitPrice || 0).toLocaleString()}</span>
                                 <span className="text-[9px] text-slate-400">per kg</span>
                              </div>
                           </div>
                        </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
            </div>
          )}
       </td>
       <td className="text-right">
          <div className="relative inline-block">
             <Input 
              type="number" 
              step="0.01"
              disabled={isReadOnly}
              {...register(`phases.${phaseIndex}.items.${itemIndex}.dosagePercentage`, { valueAsNumber: true })}
              className="h-9 w-24 border-slate-200 text-right font-bold text-xs pr-6 rounded-lg" 
             />
             <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">%</span>
          </div>
       </td>
       <td className="text-right">
          <span className="text-xs font-bold text-slate-900">{weight.toFixed(2)} gr</span>
       </td>
       <td className="text-right">
          <span className="text-[10px] font-bold text-slate-600">Rp {hpp.toLocaleString()}</span>
       </td>
       {!isReadOnly && (
         <td className="text-right pr-4">
            <Button variant="ghost" size="icon" onClick={remove} className="text-slate-300 hover:text-rose-500 h-8 w-8">
               <Trash2 className="h-3.5 w-3.5" />
            </Button>
         </td>
       )}
    </tr>
  );
}

function QCParameterEditor({ register, isReadOnly }: any) {
  return (
    <Card className="rounded-xl border-slate-200 shadow-sm bg-white p-8 space-y-8">
       <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
             QC
          </div>
          <div>
             <h2 className="text-xl font-bold text-slate-900">Quality Standards</h2>
             <p className="text-xs text-slate-700 font-bold">Target sensory & physical parameters for production.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target pH</Label>
                <Input disabled={isReadOnly} {...register("qcParameters.targetPh")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="e.g. 5.5 - 6.5" />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Viscosity</Label>
                <Input disabled={isReadOnly} {...register("qcParameters.targetViscosity")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="e.g. 10.000 - 15.000 cps" />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Appearance</Label>
                <Input disabled={isReadOnly} {...register("qcParameters.appearance")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="e.g. Shiny White Cream" />
             </div>
          </div>
          <div className="space-y-6">
             <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Color</Label>
                <Input disabled={isReadOnly} {...register("qcParameters.targetColor")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="e.g. Pure White" />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Aroma</Label>
                <Input disabled={isReadOnly} {...register("qcParameters.targetAroma")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="e.g. Floral Jasmine" />
             </div>
             <div className="p-5 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                   These targets will be used by the QC team during mass production inspection.
                </p>
             </div>
          </div>
       </div>
    </Card>
  );
}

function LabTestWorkspace({ formulaId, tests, qcTarget }: { formulaId: string, tests: any[], qcTarget: any }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm();

  const recordMutation = useMutation({
    mutationFn: (data: any) => api.post(`/rnd/formulas/${formulaId}/lab-tests`, data),
    onSuccess: () => {
      toast.success("Lab test result recorded.");
      reset();
      queryClient.invalidateQueries({ queryKey: ["lab-tests", formulaId] });
    }
  });

  return (
    <div className="space-y-8">
       <Card className="rounded-xl border-slate-200 shadow-sm bg-white p-8">
          <div className="flex items-center gap-4 mb-8">
             <div className="h-12 w-12 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                LAB
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900">Record Trial Result</h2>
                <p className="text-xs text-slate-700 font-bold">Document actual findings from this specific version.</p>
             </div>
          </div>

          <form onSubmit={handleSubmit((data) => recordMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Actual pH</Label>
                <Input {...register("actualPh")} className="h-11 border-slate-200 bg-slate-50 font-bold px-4 rounded-lg focus:bg-white" placeholder="5.42" />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1">Stability Status</Label>
                <Select onValueChange={(val) => setValue("stabilityStatus", val)}>
                   <SelectTrigger className="h-11 bg-slate-50 border-slate-200 font-bold rounded-lg">
                      <SelectValue placeholder="Select Status" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="STABLE" className="font-bold">✅ STABLE</SelectItem>
                      <SelectItem value="SEPARATED" className="font-bold text-rose-600">❌ SEPARATED</SelectItem>
                      <SelectItem value="DISCOLORED" className="font-bold text-amber-600">⚠️ DISCOLORED</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="flex items-end">
                <Button disabled={recordMutation.isPending} className="w-full h-11 bg-slate-900 text-white font-bold text-xs rounded-lg">
                   {recordMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Log Result"}
                </Button>
             </div>
          </form>

          <div className="space-y-4">
             <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-widest px-1">Recent Lab History</h4>
             <div className="space-y-2">
                {tests.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No lab results logged yet.</p>}
                {tests.map((test) => {
                   const phDiff = qcTarget?.targetPh ? (parseFloat(test.actualPh) - parseFloat(qcTarget.targetPh)) : 0;
                   const isPhOk = Math.abs(phDiff) < 0.5;

                   return (
                    <div key={test.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <Badge variant="outline" className={cn(
                               "font-bold text-[10px]",
                               isPhOk ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                             )}>
                                {test.actualPh ? `pH ${test.actualPh}` : "No pH"}
                             </Badge>
                             <span className={cn(
                               "text-[10px] font-bold uppercase tracking-wider",
                               test.stabilityStatus === 'STABLE' ? "text-emerald-600" : "text-rose-500"
                             )}>
                                {test.stabilityStatus}
                             </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">{new Date(test.createdAt).toLocaleDateString()}</span>
                       </div>
                       
                       {qcTarget?.targetPh && (
                         <div className="flex items-center gap-2 px-1">
                            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden flex">
                               <div className="h-full bg-emerald-500" style={{ width: isPhOk ? '100%' : '30%' }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase min-w-fit">
                               Target: {qcTarget.targetPh}
                            </span>
                         </div>
                       )}
                    </div>
                   );
                 })}
             </div>
          </div>
       </Card>
    </div>
  );
}

