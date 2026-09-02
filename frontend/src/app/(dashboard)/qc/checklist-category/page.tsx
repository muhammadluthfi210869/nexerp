"use client";

import React, { useState } from "react";
import { 
  ClipboardList, 
  History, 
  Eye, 
  Search, 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Save, 
  Info,
  GitCommit,
  Clock,
  ArrowRight,
  Layers,
  Settings2,
  Workflow,
  CheckCircle2,
  MoreVertical,
  ShieldAlert,
  ArrowDownWideNarrow,
  Timer,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { StatCard } from "@/components/dna/StatCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { FormShell } from "@/components/layout/FormShell";

// Static Data from Plan
const STATIC_CATEGORIES = [
  { "nama": "Desain Logo", "urutan": 1, "lama_hari": 7, "setelah": "-", "type": "Design" },
  { "nama": "HKI", "urutan": 2, "lama_hari": 14, "setelah": "Desain Logo", "type": "Legal" },
  { "nama": "BPOM NA", "urutan": 3, "lama_hari": 30, "setelah": "HKI", "type": "Legal" },
  { "nama": "BPOM Merk", "urutan": 4, "lama_hari": 30, "setelah": "HKI", "type": "Legal" },
  { "nama": "Produksi", "urutan": 5, "lama_hari": 7, "setelah": "BPOM NA", "type": "Ops" },
  { "nama": "Packing", "urutan": 6, "lama_hari": 3, "setelah": "Produksi", "type": "Ops" },
  { "nama": "Delivery", "urutan": 7, "lama_hari": 1, "setelah": "Packing", "type": "Logistics" },
  { "nama": "Uji Lab", "urutan": 8, "lama_hari": 14, "setelah": "-", "type": "QA" }
];

const DEPENDENCY_OPTIONS = [
  "Desain Logo", "HKI", "BPOM NA", "BPOM Merk", "MOU", "Desain Kemasan", 
  "Approval Desain", "Bahan Baku", "Bahan Kemas", "Label", "Box", 
  "Produksi", "Packing", "Delivery", "Halal", "Uji Lab"
];

export default function ChecklistCategoryPrototype() {
  const [view, setView] = useState<"list" | "form">("list");

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <FormShell
      title="Kategori"
      titleAccent="Checklist"
      subtitle="Lead-Time Management & Automated Quality Control Sequence Protocols"
      actions={
        <div className="flex gap-4">
          <DnaButton 
            variant="outline"
            className="rounded-[14px] text-[12px]"
          >
            <History className="mr-2 h-4 w-4 text-blue-500" /> Version Control
          </DnaButton>
          <DnaButton
            variant="secondary"
            onClick={() => setView("form")}
            className="rounded-[14px] text-[12px]"
          >
            <Plus className="mr-2 h-5 w-5" /> Define Category
          </DnaButton>
        </div>
      }
    >

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Active Protocols" value="24" icon={<Workflow className="h-6 w-6" />} />
              <StatCard label="Avg. Cycle Time" value="84d" icon={<Timer className="h-6 w-6" />} />
              <StatCard label="Dependencies" value="18" icon={<GitCommit className="h-6 w-6" />} />
              <StatCard label="Critical Path Risk" value="Low" icon={<ShieldAlert className="h-6 w-6" />} />
            </div>

            {/* List Table */}
            <TableWrapper
              filters={
                <div className="flex justify-between items-center">
                  <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search Protocols..." className="pl-10 h-11 bg-[var(--gray-50)] border border-[var(--border-color)] rounded-[12px] text-xs font-medium" />
                  </div>
                  <div className="flex gap-4">
                    <DnaButton variant="ghost">
                      Sort: Execution Order
                    </DnaButton>
                  </div>
                </div>
              }
            >
              <table>
                <thead className="bg-[#F8FAFC]">
                  <tr className="hover:bg-transparent border-[var(--border-color)]">
                    <th className="py-6 pl-10 text-table-header w-24 text-center">Order</th>
                    <th className="text-table-header">Category Identity</th>
                    <th className="text-table-header">Default SLA</th>
                    <th className="text-table-header">Sequence Hook (After)</th>
                    <th className="pr-10 text-right text-table-header">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {STATIC_CATEGORIES.map((cat) => (
                    <tr key={cat.nama} className="group hover:bg-amber-50/30 transition-all duration-300 border-b border-[var(--border-color)]">
                      <td className="py-6 pl-10 text-center">
                          <span className="h-10 w-10 rounded-xl bg-gray-100 text-gray-900 flex items-center justify-center mx-auto font-bold shadow-sm group-hover:scale-110 transition-transform">
                            {cat.urutan}
                         </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 tracking-tight text-sm">{cat.nama}</span>
                            <DnaBadge status="default" className="w-fit mt-1">{cat.type}</DnaBadge>
                          </div>
                        </div>
                      </td>
                      <td>
                         <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-bold text-slate-900 tabular-nums">{cat.lama_hari} <span className="text-[10px] text-slate-400 uppercase">Days</span></span>
                         </div>
                      </td>
                      <td>
                        {cat.setelah === "-" ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Independent</span>
                        ) : (
                          <div className="flex items-center gap-2">
                             <ArrowRight className="h-4 w-4 text-emerald-500" />
                             <span className="text-[10px] font-bold text-emerald-600 uppercase underline decoration-emerald-200 underline-offset-4">{cat.setelah}</span>
                          </div>
                        )}
                      </td>
                      <td className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                            <DnaButton variant="ghost" className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                               <Settings2 className="h-5 w-5" />
                            </DnaButton>
                           <DnaButton variant="ghost" className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                              <Trash2 className="h-5 w-5" />
                           </DnaButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-10 pb-20"
          >
            {/* Form Nav */}
            <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border border-[var(--border-color)] shadow-sm">
               <DnaButton
                  variant="ghost"
                  onClick={() => setView("list")}
                  className="group rounded-2xl p-2 pr-6 hover:bg-rose-50 hover:text-rose-600"
                >
                   <div className="h-11 w-11 rounded-xl bg-gray-100 text-gray-600 shadow-lg flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all">
                     <ChevronLeft className="h-5 w-5" />
                  </div>
                  <span className="ml-4 font-black uppercase text-[10px] tracking-widest italic text-slate-400 group-hover:text-rose-600">Cancel Protocol</span>
                </DnaButton>
               <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Drafting Phase</span>
                     <span className="text-xs font-black uppercase text-amber-600">Protocol 12-CKL</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-100" />
                  <DnaButton variant="primary" className="h-12 px-8 bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-xl shadow-amber-100 tracking-widest text-[10px]">
                     <Save className="mr-2 h-4 w-4" /> Save Protocol
                  </DnaButton>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Left: General Config */}
               <div className="lg:col-span-7 space-y-10">
                   <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white space-y-10">
                      <div className="flex items-center gap-3">
                         <LayoutGrid className="h-5 w-5 text-amber-600" />
                         <h2 className="text-lg font-black uppercase tracking-tighter">Identity <span className="text-amber-600">& Sequence</span></h2>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Designation Name</label>
                           <Input placeholder="E.g., Legal Document Submission" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs italic focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Execution Order</label>
                              <Input type="number" placeholder="1" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black text-xs" />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Global SLA</label>
                              <div className="relative">
                                 <Input type="number" placeholder="0" className="h-14 px-6 bg-slate-50 border-none rounded-2xl font-black text-xs" />
                                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Days</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dependency Hook (Start After)</label>
                           <select className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl font-black uppercase text-xs appearance-none focus:ring-2 focus:ring-amber-500 transition-all italic">
                              <option value="">â€” NO DEPENDENCY (INDEPENDENT) â€”</option>
                              {DEPENDENCY_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </Card>

                  {/* Matrix Panel */}
                   <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white space-y-10">
                      <div className="flex items-center gap-3">
                         <ArrowDownWideNarrow className="h-5 w-5 text-amber-600" />
                         <h2 className="text-lg font-black uppercase tracking-tighter">Dynamic <span className="text-amber-600">SLA Matrix</span></h2>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-relaxed">
                        Adjust lead-times specifically for different sales categories. Leave as default if not applicable.
                     </p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pt-4">
                        {[
                          "New Normal", "Repeat Order Normal", "New Import", "Repeat Order Import"
                        ].map((cat) => (
                          <div key={cat} className="flex items-center justify-between group">
                             <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight italic group-hover:text-amber-600 transition-colors">{cat}</span>
                             <div className="relative w-32">
                                <Input type="number" className="h-12 px-4 bg-slate-50 border-none rounded-xl font-black text-xs text-center" placeholder="0" />
                                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase rotate-90">Days</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>
               </div>

               {/* Right: Overview & Flow */}
               <div className="lg:col-span-5 space-y-10">
                    <Card className="rounded-[24px] border border-[var(--border-color)] shadow-sm p-8 bg-white text-gray-900 overflow-hidden relative">
                     <div className="relative z-10 space-y-10">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Flow Governance</p>
                           <h2 className="text-3xl font-black italic tracking-tighter uppercase mt-2">Critical <br/> <span className="text-amber-500">Milestones</span></h2>
                        </div>

                             <div className="space-y-8 pt-10 border-t border-[var(--border-color)]">
                            <div className="flex gap-6 relative">
                               <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gray-100" />
                               <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 relative z-10 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-gray-900">Previous Step Done</span>
                                  <span className="text-[9px] font-bold text-gray-400 italic uppercase">System triggers new task</span>
                               </div>
                            </div>
                            <div className="flex gap-6">
                               <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 relative z-10">
                                  <Timer className="h-4 w-4 text-amber-400" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black uppercase text-gray-900">SLA Countdown Starts</span>
                                  <span className="text-[9px] font-bold text-gray-400 italic uppercase">Based on Matrix Definition</span>
                               </div>
                            </div>
                         </div>

                          <div className="p-6 bg-gray-50 rounded-[24px] border border-[var(--border-color)] space-y-3">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Protocol Intelligence Remarks</label>
                            <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic uppercase">
                               "Dependency mapping ensures production doesn't start before legal BPOM approval is verified."
                            </p>
                         </div>
                     </div>
                      <Workflow className="h-48 w-48 text-black/5 absolute -right-12 -bottom-12 rotate-12" />
                  </Card>

                   <div className="p-8 border-2 border-dashed border-[var(--border-color)] rounded-[24px] bg-white/50 flex gap-4 items-start">
                     <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
                     <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase italic">
                        "Category sequence changes will not affect existing active projects but will apply to all future Sales Orders."
                     </p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FormShell>
  );
}
