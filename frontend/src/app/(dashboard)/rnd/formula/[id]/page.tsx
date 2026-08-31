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
 FlaskConical,
 Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DnaInput, DnaButton } from "@/components/dna";
import { FormShell } from "@/components/layout/FormShell";
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
 enabled: !!id,
 queryFn: async () => (await api.get(`/rnd/formulas/${id}/inci`)).data,
 });

 const [inciSearch, setInciSearch] = useState("");
 const { data: inciResults } = useQuery({
 queryKey: ["master-inci-lookup", inciSearch],
 queryFn: async () => (await api.get(`/legality/master-inci?search=${inciSearch}`)).data,
 enabled: inciSearch.length > 1,
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
 <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
 <p className="text-xs font-medium text-slate-400">Loading Workspace...</p>
 </div>
 );

 return (
 <FormShell
 title="FORMULA"
 titleAccent="EDITOR"
 subtitle={`Formula ${formula?.sampleRequest?.sampleCode || ''}`}
 >
 <div className="bg-slate-50/50 pb-24">
 {/* --- CLEAN HEADER --- */}
 <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
 <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
 <div className="flex items-center gap-4">
 <DnaButton 
 variant="outline"
 size="sm"
 onClick={() => router.back()}
 className="h-10 w-10 rounded-lg border-slate-200"
 >
 <ArrowLeft className="h-4 w-4" />
 </DnaButton>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-black text-slate-900">
 Formula <span className="text-blue-600">Builder</span>
 </h1>
 
 <Select value={id as string} onValueChange={(val) => router.push(`/rnd/formula/${val}`)}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
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

 <span className={cn(
 "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm",
 formula?.status === 'DRAFT' ? "bg-amber-50 text-amber-700 border border-amber-100" : 
 formula?.status === 'SAMPLE_LOCKED' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
 formula?.status === 'PRODUCTION_LOCKED' ? "bg-slate-900 text-white" :
 "bg-slate-100 text-slate-600 border border-slate-200"
 )}>
 {formula?.status}
 </span>
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
 <DnaButton 
 variant="primary"
 onClick={handleSubmit(onSave)}
 disabled={updateMutation.isPending}
 className="h-10 text-xs"
 >
 {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 Sync Data
 </DnaButton>
 ) : (
 <DnaButton 
 variant="secondary"
 onClick={() => revisionMutation.mutate()}
 disabled={revisionMutation.isPending}
 className="h-10 text-xs"
 >
 <Plus className="h-4 w-4" /> Create Revision
 </DnaButton>
 )}

 {formula?.status === 'SAMPLE_LOCKED' && (
 <DnaButton 
 variant="primary"
 onClick={() => lockProductionMutation.mutate()}
 disabled={lockProductionMutation.isPending}
 className="h-10 text-xs border-2 border-blue-100 hover:bg-emerald-600"
 >
 <ShieldCheck className="h-4 w-4" /> Lock Production
 </DnaButton>
 )}
 </div>
 </div>
 </div>
 </header>

 <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
 {/* --- MAIN WORKSPACE --- */}
 <div className={cn("lg:col-span-8 space-y-8", isReadOnly && activeTab !== "lab" && activeTab !== "history" && "opacity-90 grayscale-[0.1]")}>
 
 {/* --- DYNAMIC SUMMARY INFO --- */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 overflow-hidden">
 <div className="-mx-6 -mt-6 p-4 mb-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
 <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
 <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-700">Technical Brief Summary</h3>
 </div>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sample Code</p>
 <p className="text-xs font-black text-slate-900">{formula?.sampleRequest?.sampleCode || "-"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Request Date</p>
 <p className="text-xs font-black text-slate-900">{formula?.sampleRequest?.requestedAt ? new Date(formula.sampleRequest.requestedAt).toLocaleDateString('id-ID') : "-"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Customer / Brand</p>
 <p className="text-xs font-black text-slate-900 line-clamp-1">{formula?.sampleRequest?.lead?.clientName || "-"} / {formula?.sampleRequest?.lead?.brandName || "-"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Netto / Yield</p>
 <p className="text-xs font-black text-blue-600">{formula?.targetYieldGram?.toLocaleString()} gr</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Formulator (PIC)</p>
 <p className="text-xs font-black text-slate-900">{formula?.sampleRequest?.pic?.fullName || "-"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sample Maker</p>
 <p className="text-xs font-black text-slate-900">{formula?.sampleRequest?.requester?.fullName || "System Admin"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Category</p>
 <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{formula?.sampleRequest?.productName || "Cosmetic Product"}</p>
 </div>
 <div className="space-y-1">
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Status</p>
 <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-slate-100 text-slate-600 border border-slate-200">
 {formula?.status || "Unknown"}
 </span>
 </div>
 </div>
 </div>

 {activeTab === "formula" ? (
 <div className="space-y-6">
 {phaseFields.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 gap-4">
 <div className="text-center">
 <h4 className="text-sm font-black text-slate-900">Laboratory Worksheet</h4>
 <p className="text-xs text-slate-500 mt-1">Start your formulation by initializing the first phase.</p>
 </div>
 <DnaButton 
 variant="primary"
 onClick={() => appendPhase({ prefix: "A", customName: "Phase A", items: [], instructions: "", order: 0 })}
 className="shadow-sm"
 >
 <Plus className="h-4 w-4" /> Initialize Composition
 </DnaButton>
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
 <DnaButton 
 variant="outline"
 onClick={() => appendPhase({ prefix: String.fromCharCode(65 + phaseFields.length), customName: "", items: [], instructions: "", order: phaseFields.length })}
 className="w-full h-12 border-2 border-dashed border-slate-200 text-slate-400 hover:bg-white hover:border-blue-300 hover:text-blue-600"
 >
 <Plus className="h-4 w-4" /> Add Next Phase (Phase {String.fromCharCode(65 + phaseFields.length)})
 </DnaButton>
 )}
 </div>
 )}
 </div>
 ) : activeTab === "qc" ? (
 <QCParameterEditor register={register} isReadOnly={isReadOnly} />
 ) : activeTab === "history" ? (
 <div className="space-y-6">
 <h2 className="text-xl font-black text-slate-900">Evolutionary History</h2>
 <div className="grid gap-4">
 {versions?.map((v: any) => (
 <div key={v.id} className={cn(
 "rounded-2xl bg-white border border-slate-200 shadow-sm p-6 hover:border-blue-200 transition-all cursor-pointer group",
 v.id === id ? "bg-blue-50/50 border-blue-200" : "bg-white"
 )} onClick={() => router.push(`/rnd/formula/${v.id}`)}>
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className={cn(
 "h-10 w-10 rounded-lg flex items-center justify-center font-black text-sm",
 v.id === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
 )}>
 v{v.version}
 </div>
 <div>
 <p className="font-black text-slate-900">Version {v.version}.0 {v.id === id && "(Active)"}</p>
 <p className="text-[10px] text-slate-600 uppercase font-black tracking-tight">
 {new Date(v.createdAt).toLocaleDateString()} • {v.status}
 </p>
 </div>
 </div>
 <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
 </div>
 </div>
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
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-6">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
 <Calculator className="h-5 w-5" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900">Math Engine</h3>
 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Live Configuration</p>
 </div>
 </div>
 
 <div className="space-y-4">
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Target Yield (Gram)</Label>
 <div className="flex items-center gap-3">
 <DnaInput 
 type="number" 
 disabled={isReadOnly}
 {...register("targetYieldGram", { valueAsNumber: true })}
 className="h-12 text-xl font-black bg-slate-50 border-slate-200 rounded-lg focus:bg-white" 
 />
 <span className="text-sm font-medium text-slate-400">gr</span>
 </div>
 </div>

 <div className="pt-4 border-t border-slate-100">
 <div className="flex justify-between items-center mb-2">
 <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Composition Total</span>
 <span className={cn("text-lg font-black", totalDosage === 100 ? "text-emerald-600" : "text-rose-600")}>
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
 <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Financial Alignment</span>
 <span className={cn(
 "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm",
 currentHpp > Number(sampleBrief?.targetHpp || 0) ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
 )}>
 {currentHpp > Number(sampleBrief?.targetHpp || 0) ? "Overbudget" : "Within Budget"}
 </span>
 </div>
 <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
 <div className="flex justify-between text-[10px]">
 <span className="text-slate-500">Target HPP</span>
 <span className="font-black text-slate-900">Rp {Number(sampleBrief?.targetHpp || 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-[10px]">
 <span className="text-slate-500">Current HPP</span>
 <span className={cn("font-black", currentHpp > Number(sampleBrief?.targetHpp || 0) ? "text-rose-600" : "text-emerald-600")}>
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
 </div>

 {/* INCI Reference */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
 <Database className="h-5 w-5" />
 </div>
 <div>
 <h3 className="text-sm font-black text-slate-900">INCI Reference</h3>
 <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Master Database</p>
 </div>
 </div>

 <div className="space-y-3">
 <div className="relative">
 <DnaInput
 placeholder="Search INCI name..."
 value={inciSearch}
 onChange={(e) => setInciSearch(e.target.value)}
 className="h-10 bg-slate-50 border-slate-200 text-xs rounded-lg pl-9"
 />
 <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 </div>

 <div className="space-y-2 max-h-[300px] overflow-y-auto">
 {inciSearch.length > 1 ? (
 inciResults?.length > 0 ? (
 inciResults.map((item: any) => (
 <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs font-black text-slate-900 italic truncate">{item.inciName || item.name}</span>
 <span className={cn(
 "shrink-0 rounded-lg px-2 py-0.5 font-black uppercase text-[8px]",
 item.safetyCategory === 'ALLOWED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
 item.safetyCategory === 'RESTRICTED' ? "bg-amber-50 text-amber-700 border border-amber-200" :
 item.safetyCategory === 'PROHIBITED' ? "bg-rose-50 text-rose-700 border border-rose-200" :
 "bg-slate-100 text-slate-600 border border-slate-200"
 )}>
 {item.safetyCategory || 'UNKNOWN'}
 </span>
 </div>
 {item.casNumber && (
 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">CAS: {item.casNumber}</p>
 )}
 {item.maxConcentration && (
 <p className="text-[10px] text-slate-500">Max: {item.maxConcentration}%</p>
 )}
 </div>
 ))
 ) : (
 <p className="text-[11px] text-slate-400 text-center py-4 italic">No results found.</p>
 )
 ) : (
 <p className="text-[10px] text-slate-400 text-center py-4">Type at least 2 characters to search.</p>
 )}
 </div>
 </div>
 </div>

 {/* INCI Preview */}
 <div className="rounded-2xl bg-slate-900 border border-slate-200 shadow-sm p-6 space-y-4 text-white">
 <div className="flex items-center gap-2">
 <Sparkles className="h-4 w-4 text-blue-400" />
 <h3 className="text-xs font-black uppercase tracking-widest">INCI List (Labeling)</h3>
 </div>
 <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-[11px] text-slate-300 leading-relaxed">
 {inciList?.map(item => item.name).join(", ")}
 </div>
 <p className="text-[9px] text-slate-500 font-medium italic text-center">
 *Auto-sorted by concentration (DESC)
 </p>
 </div>

 {/* Feedback History */}
 {(feedbackHistory && feedbackHistory.length > 0) && (
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
 <div className="flex items-center gap-2">
 <HistoryIcon className="h-4 w-4 text-blue-600" />
 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">BusDev Feedback</h3>
 </div>
 <div className="space-y-4">
 {feedbackHistory.map((fb: any) => (
 <div key={fb.id} className="pl-3 border-l-2 border-blue-100 py-1">
 <p className="text-[10px] font-black text-slate-400 mb-1">{new Date(fb.createdAt).toLocaleDateString()}</p>
 <p className="text-xs text-slate-700 italic">"{fb.feedbackText}"</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Integrity Checklist */}
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
 <ShieldAlert className="h-4 w-4 text-blue-600" />
 Validation
 </h3>
 <div className="space-y-3">
 <CheckItem label="Total Percentage (100%)" checked={totalDosage === 100} />
 <CheckItem label="No Empty Phases" checked={watchedPhases?.every(p => p.items?.length > 0)} />
 </div>
 </div>
 </div>
 </aside>
 </main>

 {/* --- FLOATING ACTION BAR --- */}
 <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-40">
 <div className="max-w-[1600px] mx-auto flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm">
 R&D
 </div>
 <div className="hidden sm:block">
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol V4.2</p>
 <p className="text-xs font-medium text-slate-600 italic">Scientific compliance mode active.</p>
 </div>
 </div>
 
 <div className="flex gap-3">
 {formula?.status === 'DRAFT' && (
 <DnaButton 
 variant="primary"
 onClick={() => requestApprovalMutation.mutate()}
 disabled={totalDosage !== 100 || requestApprovalMutation.isPending}
 className="h-11 px-8 text-xs"
 >
 Request Manager Approval
 </DnaButton>
 )}
 {formula?.status !== 'DRAFT' && (
 <DnaButton 
 variant="secondary"
 onClick={() => revisionMutation.mutate()}
 className="h-11 px-8 text-xs"
 >
 Unlock for New Revision
 </DnaButton>
 )}
 </div>
 </div>
 </footer>
 </div>
 </FormShell>
 );
}

// --- SUB-COMPONENTS ---

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
 return (
 <button 
 onClick={onClick}
 className={cn(
 "px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all",
 active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
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
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
 {/* Phase Header */}
 <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 bg-slate-900 text-white rounded flex items-center justify-center font-black text-sm">
 {phasePrefix}
 </div>
 <DnaInput 
 disabled={isReadOnly}
 {...register(`phases.${phaseIndex}.customName`)}
 placeholder="e.g., Oil Phase / Water Phase"
 className="h-9 w-64 bg-transparent border-none font-black text-sm focus:ring-0 px-0 placeholder:text-slate-300"
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
 <th className="py-3 pl-6 text-table-header text-slate-400 uppercase tracking-tight">Ingredient Protocol</th>
 <th className="py-3 text-table-header text-slate-400 uppercase tracking-tight text-right w-32">Dosage (%)</th>
 <th className="py-3 text-table-header text-slate-400 uppercase tracking-tight text-right w-24">Weight (gr)</th>
 <th className="py-3 text-table-header text-slate-400 uppercase tracking-tight text-right w-28">Est. Cost</th>
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
 <DnaInput 
 disabled={isReadOnly}
 {...register(`phases.${phaseIndex}.instructions`)}
 className="h-10 bg-white border-slate-200 text-xs rounded-lg"
 placeholder="e.g. Mix until homogenous at 70C..." 
 />
 </div>
 {!isReadOnly && (
 <div className="flex gap-2 w-full md:w-auto">
 <DnaButton 
 variant="outline"
 type="button"
 size="sm"
 onClick={() => appendItem({ materialId: "", isDummy: false, dosagePercentage: 0 })}
 className="h-10 border-slate-200 text-[10px] font-black flex-1"
 >
 <Plus className="h-3.5 w-3.5" /> Add Material
 </DnaButton>
 <DnaButton 
 variant="outline"
 type="button"
 size="sm"
 onClick={() => appendItem({ materialId: "", isDummy: true, dummyName: "New Active", dummyPrice: 0, dosagePercentage: 0 })}
 className="h-10 border-amber-200 bg-amber-50 text-amber-700 flex-1"
 >
 <FlaskConical className="h-3.5 w-3.5" /> Add Dummy
 </DnaButton>
 </div>
 )}
 </div>
 </div>
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
 <span className="rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm bg-amber-100 text-amber-700 border border-amber-200">DUMMY</span>
 <DnaInput 
 disabled={isReadOnly}
 {...register(`phases.${phaseIndex}.items.${itemIndex}.dummyName`)}
 className="h-8 bg-transparent border-slate-200 text-xs font-black w-48 rounded-md" 
 />
 </div>
 <div className="flex items-center gap-2 pl-12">
 <span className="text-[9px] font-black text-slate-400 uppercase">Est. Price: Rp</span>
 <DnaInput 
 type="number"
 disabled={isReadOnly}
 {...register(`phases.${phaseIndex}.items.${itemIndex}.dummyPrice`, { valueAsNumber: true })}
 className="h-6 w-24 bg-transparent border-slate-200 text-[10px] font-black rounded-md" 
 />
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
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
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
 <SelectValue placeholder="Search Material..." />
 </SelectTrigger>
 <SelectContent className="max-h-80 w-[400px]">
 <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
 <DnaInput 
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
 <span className="font-black text-slate-900">{m.name}</span>
 <span className="text-[9px] text-slate-400 uppercase tracking-wider font-black">
 {m.category?.name || "Uncategorized"} • {m.sku}
 </span>
 <span className="text-[10px] text-blue-600/70 italic font-medium">
 {m.description?.substring(0, 40) || "No technical description available"}...
 </span>
 </div>
 <div className="text-right">
 <span className="text-[11px] font-black text-emerald-600 block">Rp {Number(m.movingAvgPrice || m.unitPrice || 0).toLocaleString()}</span>
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
 <DnaInput 
 type="number" 
 step="0.01"
 disabled={isReadOnly}
 {...register(`phases.${phaseIndex}.items.${itemIndex}.dosagePercentage`, { valueAsNumber: true })}
 className="h-9 w-24 border-slate-200 text-right font-black text-xs pr-6 rounded-lg" 
 />
 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">%</span>
 </div>
 </td>
 <td className="text-right">
 <span className="text-xs font-black text-slate-900">{weight.toFixed(2)} gr</span>
 </td>
 <td className="text-right">
 <span className="text-[10px] font-black text-slate-600">Rp {hpp.toLocaleString()}</span>
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
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 space-y-8">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-lg">
 QC
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900">Quality Standards</h2>
 <p className="text-xs text-slate-700 font-black">Target sensory & physical parameters for production.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-6">
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target pH</Label>
 <DnaInput disabled={isReadOnly} {...register("qcParameters.targetPh")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="e.g. 5.5 - 6.5" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Viscosity</Label>
 <DnaInput disabled={isReadOnly} {...register("qcParameters.targetViscosity")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="e.g. 10.000 - 15.000 cps" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Appearance</Label>
 <DnaInput disabled={isReadOnly} {...register("qcParameters.appearance")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="e.g. Shiny White Cream" />
 </div>
 </div>
 <div className="space-y-6">
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Color</Label>
 <DnaInput disabled={isReadOnly} {...register("qcParameters.targetColor")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="e.g. Pure White" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-600 uppercase tracking-tight px-1">Target Aroma</Label>
 <DnaInput disabled={isReadOnly} {...register("qcParameters.targetAroma")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="e.g. Floral Jasmine" />
 </div>
 <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
 <Info className="h-4 w-4 text-blue-600 mt-0.5" />
 <p className="text-[11px] text-blue-900 leading-relaxed font-medium">
 These targets will be used by the QC team during mass production inspection.
 </p>
 </div>
 </div>
 </div>
 </div>
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
 <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
 <div className="flex items-center gap-4 mb-8">
 <div className="h-12 w-12 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-lg">
 LAB
 </div>
 <div>
 <h2 className="text-xl font-black text-slate-900">Record Trial Result</h2>
 <p className="text-xs text-slate-700 font-black">Document actual findings from this specific version.</p>
 </div>
 </div>

 <form onSubmit={handleSubmit((data) => recordMutation.mutate(data))} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Actual pH</Label>
 <DnaInput {...register("actualPh")} className="h-11 border-slate-200 bg-slate-50 font-black px-4 rounded-lg focus:bg-white" placeholder="5.42" />
 </div>
 <div className="space-y-1.5">
 <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Stability Status</Label>
 <Select onValueChange={(val) => setValue("stabilityStatus", val)}>
 <SelectTrigger className="h-11 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs uppercase">
 <SelectValue placeholder="Select Status" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="STABLE" className="font-black">✅ STABLE</SelectItem>
 <SelectItem value="SEPARATED" className="font-black text-rose-600">❌ SEPARATED</SelectItem>
 <SelectItem value="DISCOLORED" className="font-black text-amber-600">⚠️ DISCOLORED</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="flex items-end">
 <DnaButton variant="secondary" disabled={recordMutation.isPending} className="w-full h-11 text-xs">
 {recordMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Log Result"}
 </DnaButton>
 </div>
 </form>

 <div className="space-y-4">
 <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Recent Lab History</h4>
 <div className="space-y-2">
 {tests.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No lab results logged yet.</p>}
 {tests.map((test) => {
 const phDiff = qcTarget?.targetPh ? (parseFloat(test.actualPh) - parseFloat(qcTarget.targetPh)) : 0;
 const isPhOk = Math.abs(phDiff) < 0.5;

 return (
 <div key={test.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <span className={cn(
 "rounded-lg px-2.5 py-1 font-black uppercase text-[8px] border-none shadow-sm",
 isPhOk ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
 )}>
 {test.actualPh ? `pH ${test.actualPh}` : "No pH"}
 </span>
 <span className={cn(
 "text-[10px] font-black uppercase tracking-wider",
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
 <span className="text-[9px] font-black text-slate-400 uppercase min-w-fit">
 Target: {qcTarget.targetPh}
 </span>
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 );
}
